import {Component, OnInit, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {AnimationOptions} from 'ol/View';
import {HttpClient} from '@angular/common/http';
import {PieChart} from './pie-chart';
import {Popup} from './popup';
import {Layers} from './layers';
import {MeasurementStore} from './measurement-store';
import {UserStore} from './user-store';
import {EowDataLayer} from './eow-data-layer';
import EowDataGeometries from './eow-data-geometries';
import LayerGeometries from './layers-geometries';
import GeometryOps from './geometry-ops';
import {Brolog} from 'brolog';
import EOWDataPieChart from './eow-data-piechart';
import {Coordinate} from 'ol/coordinate';
import {EOWMap} from './eow-map';
import {EowLayers} from './eow-layers';
import {EowWaterBodyIntersection} from './eow-data-struct';

const theClass = 'AppComponent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Eye On Water';
  eowMap: EOWMap;
  popupObject: Popup;
  measurementStore: MeasurementStore;
  userStore: UserStore;
  eowData: EowDataLayer;
  pieChart: PieChart;
  layers: Layers;
  eowLayers: EowLayers;
  eowDataGeometries: EowDataGeometries;
  layersGeometries: LayerGeometries;
  geometryOps: GeometryOps;
  eowDataPieChart: EOWDataPieChart;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private http: HttpClient, private log: Brolog) {
    this.pieChart = new PieChart(log);
  }

  async ngOnInit() {
    this.userStore = new UserStore(this.htmlDocument, this.log);
    this.popupObject = new Popup(this.htmlDocument, this.pieChart, this.userStore);
    this.eowMap = new EOWMap(this.log).init(this.popupObject);
    this.eowData = new EowDataLayer().init(this.eowMap);
    this.layers = new Layers(this.eowMap, this.htmlDocument, this.http, this.log);
    this.eowLayers = await new EowLayers(this.layers, this.log).init(); // this.eowMap);
    this.measurementStore = await new MeasurementStore(this.log);
    this.eowDataGeometries = await new EowDataGeometries(this.log).init();  // TODO this seems to do similar to EowDataLayer - combine
    this.layersGeometries = new LayerGeometries(this.log);
    this.geometryOps = new GeometryOps(this.log);
    this.eowDataPieChart = new EOWDataPieChart(this.geometryOps, this.pieChart, this.layers, this.log);

    this.popupObject.init(this.eowMap);
    this.eowDataPieChart.init(this.eowMap, this.htmlDocument);
    this.measurementStore.init(this.eowMap, this.eowData, this.userStore);
    await this.userStore.init(this.eowData.dataLayerObs, this.measurementStore);

    // DEBUG
    this.eowData.allDataSourceObs.asObservable().subscribe(allDataSource => {
      allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this));
    });

    this.setupEventHandlers();

    this.DEBUGinit();

    await this.layersGeometries.init();

    // Call one or the other - the 2nd is debug
    this.calculateIntersectionsPlot();
    this.debug_WriteDataToSpreadsheet();
    // this.calculateWaterBodiesCentroidsPlot();  // DEBUG
  }

  // todo - add ENV VAR to setup debug stuff
  DEBUGinit() {
    this.htmlDocument.querySelectorAll('.pull-tab').forEach(e => {
      const element = (e as HTMLElement).closest('.panel');
      element.classList.toggle('pulled'); // Turn off initially as they are really annoying
    });
  }

  /**
   * Calculate intersections between EOW Data points and waterbodies and plot information about the data points
   */
  private calculateIntersectionsPlot() {
    let eowWaterBodyIntersections: EowWaterBodyIntersection[] = undefined; // tslint:disable-line
    this.eowDataGeometries.pointsObs.asObservable().subscribe(async (points) => {
      this.eowDataGeometries.allPointsObs.asObservable().subscribe(async sourceNErrorMarginPoints => {
        this.eowDataGeometries.allPointsMapObs.asObservable().subscribe(async allPointsMap => {

          let layerName = 'i5516 reservoirs';
          eowWaterBodyIntersections = await this.geometryOps.calculateLayerIntersections(points, sourceNErrorMarginPoints, allPointsMap, this.layersGeometries, layerName);
          this.eowDataPieChart.plot(eowWaterBodyIntersections, layerName);

          layerName = 'Waterbodies shape';
          eowWaterBodyIntersections = await this.geometryOps.calculateLayerIntersections(points, null, allPointsMap, this.layersGeometries, layerName);
          this.eowDataPieChart.plot(eowWaterBodyIntersections, layerName);
        });
      });
    });
    this.eowDataGeometries.pointsErrorMarginObs.asObservable().subscribe(pointsErrorMargins => {
      this.eowDataPieChart.debugDrawErrorMarginPoints(pointsErrorMargins);
    });
  }

  /**
   * DEBUG - find centroids for ALL water bodies and plot something - eg. my avatar
   */
  private async calculateWaterBodiesCentroidsPlot() {
    const layerName = 'i5516 reservoirs';
    const eowWaterbodyPoints: EowWaterBodyIntersection[] = await this.geometryOps.convertLayerToDataFormat(this.layersGeometries, layerName);
    this.eowDataPieChart.plot(eowWaterbodyPoints, layerName);
  }

  private debug_compareUsersNMeasurements() {
    return; // don't want it currently
    // Delay so other allDataSource.on('change' that loads the data gets a chance to fire
    this.eowData.allDataSourceObs.asObservable().subscribe(allDataSource => {
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
    });
  }

  /**
   * I'm getting weird results and I could craft a solution (and tests) if I could visualise the data
   */
  private debug_WriteDataToSpreadsheet() {

  }

  private setupEventHandlers() {
    // Pull tabs of Most Active Users and Recent Measurements
    this.htmlDocument.querySelectorAll('.pull-tab').forEach(i => i.addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement).closest('.panel');
      element.classList.toggle('pulled');
    }));

    // Measurement List
    document.querySelector('.measurement-list').addEventListener('click', (event) => {
      const element = (event.target as HTMLElement).closest('.item');
      if (!element) {
        return;
      }

      const coordinate = element.getAttribute('data-coordinate').split(',').map(c => parseInt(c, 10)) as Coordinate;
      const id = element.getAttribute('data-key');
      this.eowMap.mapObs.asObservable().subscribe(map => {
        const view = map.getView();
        view.cancelAnimations();
        view.animate({
          center: coordinate,
          zoom: 8,
          duration: 1300
        } as AnimationOptions);
        const features = [this.measurementStore.getById(id)];
        this.popupObject.draw(features, coordinate);
      });
    }, true);


    this.htmlDocument.getElementById('clearFilterButton').addEventListener('click', (event) => {
      this.clearFilter();
    });
  }

  private clearFilter() {
    this.userStore.clearSelectedUser();
    this.measurementStore.clearFilter();
    this.eowData.dataLayerObs.asObservable().subscribe(dataLayer => {
      this.eowMap.mapObs.asObservable().subscribe(map => {
        map.getView().fit(dataLayer.getSource().getExtent(), {duration: 1300});
      });
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
