import {Component, OnInit, Inject, AfterViewInit} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View, {AnimationOptions} from 'ol/View';
import {fromLonLat} from 'ol/proj';
import {HttpClient} from '@angular/common/http';
import {PieChart} from './pie-chart';
import {Popup} from './popup';
import {Layers} from './layers';
import {MeasurementStore} from './measurement-store';
import {UserStore} from './user-store';
import {EowDataLayer} from './eow-data-layer';
import EowDataGeometries from './eow-data-geometries';
import LayerGeometries from './layers-geometries';
import GeometryOps, {EowWaterbodyIntersection} from './geometry-ops';
import {Brolog} from 'brolog';
import {timeout} from 'rxjs/operators';
import {FeatureCollection, Point} from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import {Coordinate} from 'ol/coordinate';

const defaultCoord = [133.945313, -26.431228];
const canberra = [149.130005, -35.280937];
const theZoom = 12;

const theClass = 'AppComponent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Eye On Water';
  map: Map;
  popupObject: any;
  measurementStore: MeasurementStore;
  userStore: UserStore;
  eowData: EowDataLayer;
  // dataLayer: any;
  // allDataSource: any;
  pieChart: any;
  layers: Layers;
  // htmlDocument: Document;
  eowDataGeometries: EowDataGeometries;
  layersGeometries: LayerGeometries;
  geometryOps: GeometryOps;
  eowDataPieChart: EOWDataPieChart;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private http: HttpClient, private log: Brolog) {
    // this.htmlDocument = document;
    this.pieChart = new PieChart(log);
  }

  async ngOnInit() {
    this.initMap();

    this.userStore = new UserStore(document, this.log);
    this.popupObject = new Popup(document, this.pieChart, this.userStore);
    this.eowData = new EowDataLayer().init(this.map);
    this.layers = new Layers(document, this.http, this.log);
    this.measurementStore = await new MeasurementStore(this.log).init(this.map, this.eowData);
    // this.eowData.init(this.map);
    this.eowDataGeometries = await new EowDataGeometries(this.log).init();
    this.layersGeometries = new LayerGeometries(this.log);
    this.geometryOps = new GeometryOps(this.log);
    this.eowDataPieChart = new EOWDataPieChart(this.geometryOps, this.log);

    this.popupObject.init(this.map);
    // this.eowData.init(this.map); //  , this.htmlDocument);
    this.eowDataPieChart.init(this.map, this.htmlDocument);
    // this.measurementStore.init(this.map, this.eowData.dataLayerObs, this.eowData.allDataSourceObs, this.log);
    await this.userStore.init(this.eowData.dataLayerObs);
    // await this.eowDataGeometries.init();

    this.eowData.allDataSourceObs.asObservable().subscribe(allDataSource => {
      allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this));
    });
    this.eowData.dataLayerObs.asObservable().subscribe(dataLayer => {
      this.map.addLayer(dataLayer);
    });


    this.setupEventHandlers();
    await this.layersGeometries.init();

    // Turn off for the moment whilst debug to show something in all waterbodies
    // let eowDataInWaterbodies: EowWaterbodyIntersection[];
    // this.eowDataGeometries.pointsObs.asObservable().subscribe((points) => {
    //   eowDataInWaterbodies = this.geometryOps.calculateLayerIntersections(points, this.layersGeometries, 'i5516 reservoirs');
    // });
    // this.eowDataPieChart.plot(eowDataInWaterbodies);
    const eowWaterbodyPoints: EowWaterbodyIntersection[] = this.geometryOps.convertLayerToDataForamt(this.layersGeometries, 'i5516 reservoirs');
    this.eowDataPieChart.plot(eowWaterbodyPoints);
    // EO DEBUG

    this.layers.addLayers(this.map);
  }

  private debug_compareUsersNMeasurements() {
    // return; // don't want it currently
    // Delay so other allDataSource.on('change' that loads the data gets a chance to fire
    this.eowData.allDataSourceObs.asObservable().subscribe(allDataSource => {
      window.setTimeout(() => {
        console.log('debug_compareUsersNMeasurements:');
        Object.keys(this.userStore.userById).forEach(uid => {
          const user = this.userStore.userById[uid];
          console.log(`  user - Id: ${user.id}, nickName: ${user.nickname}, photo_count: ${user.photo_count}`);
          const m = this.measurementStore.getByOwner(user.id);
          if (m && m.length > 0) {
            const images = m.map(m2 => m2.get('image'));
            console.log(`    number of images: ${images.length} -> \n${JSON.stringify(images, null, 2)}`);
          }
        });
        // Now print Measurements info
        console.log(`measurementsByOwner: ${
          JSON.stringify(this.measurementStore.measurementSummary(true, this.userStore), null, 2)}`);
        console.log(`measurementsById: ${
          JSON.stringify(this.measurementStore.measurementSummary(false, this.userStore), null, 2)}`);
        console.log(`Number of measurements per user: ${
          JSON.stringify(this.measurementStore.numberMeasurmentsPerUser(this.userStore), null, 2)}`);
      }, 1000);
    });
  }

  private initMap() {
    const mainMap = new TileLayer({
      source: new OSM()
    });
    mainMap.set('name', 'Main map');

    this.map = new Map({
      target: 'map',
      layers: [
        mainMap,
      ],
      view: new View({
        center: fromLonLat(canberra),
        zoom: theZoom
      }),
      controls: [],
    });

    this.map.on('click', (evt) => {
      const {
        pixel,
        coordinate
      } = evt;

      const features = [];

      this.map.forEachFeatureAtPixel(pixel, (feature) => {
        features.push(feature);
      });

      if (features.length) {
        this.log.verbose(theClass, `Clicked on map at: ${JSON.stringify(coordinate)}`);
        this.popupObject.draw(features, coordinate);
      }
    });
  }

  private setupEventHandlers() {
    // Pull tabs of Most Active Users and Recent Measurements
    this.htmlDocument.querySelectorAll('.pull-tab').forEach(i => i.addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement).closest('.panel');
      element.classList.toggle('pulled');
    }));
    // User List
    document.querySelector('.user-list').addEventListener('click', (event) => {
      const element = (event.target as HTMLElement).closest('.item');
      const userId = element.getAttribute('data-user');
      console.log(`clicked on user-id: ${userId}`);
      if (this.measurementStore.showMeasurements(userId)) {
        this.userStore.clearSelectedUser();
        element.classList.add('selectedUser', 'box-shadow');
        this.toggleFilterButton(true);
      }
    }, true);

    // Measurement List
    document.querySelector('.measurement-list').addEventListener('click', (event) => {
      const element = (event.target as HTMLElement).closest('.item');
      if (!element) {
        return;
      }

      const coordinate = element.getAttribute('data-coordinate').split(',').map(c => parseInt(c, 10)) as Coordinate;
      const id = element.getAttribute('data-key');
      const view = this.map.getView();
      view.cancelAnimations();
      view.animate({
        center: coordinate,
        zoom: 8,
        duration: 1300
      } as AnimationOptions);
      const features = [this.measurementStore.getById(id)];
      this.popupObject.draw(features, coordinate);
    }, true);

    this.htmlDocument.getElementById('clearFilterButton').addEventListener('click', (event) => {
      this.clearFilter();
    });
  }

  private clearFilter() {
    this.userStore.clearSelectedUser();
    this.measurementStore.clearFilter();
    this.eowData.dataLayerObs.asObservable().subscribe(dataLayer => {
      this.map.getView().fit(dataLayer.getSource().getExtent(), {duration: 1300});
      this.eowData.allDataSourceObs.asObservable().subscribe(allDataSource => {
        dataLayer.setSource(allDataSource);
      });
    });
    this.toggleFilterButton(false);
  }

  private toggleFilterButton(state = false) {
    const element = this.htmlDocument.getElementById('clearFilterButton');
    element.classList.toggle('hidden', !state);
  }
}
