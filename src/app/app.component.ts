import {Component, OnInit, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {AnimationOptions} from 'ol/View';
import Feature from 'ol/Feature';
import {HttpClient} from '@angular/common/http';
import {Popup} from './popup';
import {Layers} from './layers';
import {MeasurementStore} from './measurement-store';
import {UserStore} from './user-store';
import {EowDataLayer} from './eow-data-layer';
import EowDataGeometries from './eow-data-geometries';
import LayerGeometries from './layers-geometries';
import GeometryOps from './geometry-ops';
import {Brolog} from 'brolog';
import {Coordinate} from 'ol/coordinate';
import {EOWMap} from './eow-map';
import {EowLayers, LayersInfo} from './eow-layers';
import {EowWaterBodyIntersection, PointsMap, SourcePointMarginsType} from './eow-data-struct';
import {FeatureCollection, Point, Polygon} from '@turf/helpers';
import EowDataCharts from './charts/eow-data-charts';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {forkJoin, combineLatest} from 'rxjs';
import {Feature as TurfFeature} from '@turf/helpers';

const theClass = 'AppComponent';

type WaterBodyFeatures = { [name: string]: Feature[] }; // tslint:disable-line

// TODO - split this up!
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
  layers: Layers;
  eowLayers: EowLayers;
  eowDataGeometries: EowDataGeometries;
  layersGeometries: LayerGeometries;
  geometryOps: GeometryOps;
  eowDataCharts: EowDataCharts;
  waterBodiesLayers: LayersInfo[];
  map: Map;
  points: FeatureCollection<Point>;
  sourceNErrorMarginPoints: FeatureCollection<Point>;
  pointsErrorMargins: SourcePointMarginsType[];
  allPointsMap: PointsMap;
  allDataSource: VectorSource;
  dataLayer: VectorLayer;
  newPoints = false;
  waterBodyFeatures: WaterBodyFeatures = {};
  totalNumberWaterBodyFeatures = 0;
  newWaterbodiesData = false;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private http: HttpClient, private log: Brolog) {
  }

  async ngOnInit() {
    this.userStore = new UserStore(this.htmlDocument, this.log);
    this.popupObject = new Popup(this.htmlDocument, this.userStore);
    this.eowMap = new EOWMap(this, this.log).init(this.popupObject);
    this.eowMap.getMap().subscribe(async map => {
      this.map = map;
    });

    this.eowData = new EowDataLayer().init(this.eowMap);
    this.eowData.allDataSourceObs.subscribe(allDataSource => {
      this.allDataSource = allDataSource;
      // DEBUG
      if (this.allDataSource) {
        this.allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this));
        // this.allDataSource.on('change', this.debug_printFirstEOWData.bind(this));
        this.debug_printFirstEOWData();
      }
    });
    this.eowData.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    });

    this.layers = new Layers(this.eowMap, this.htmlDocument, this.http, this.log);
    this.eowLayers = await new EowLayers(this.layers, this.log).init(); // this.eowMap);
    // this.eowLayers.waterBodiesLayers.getLayersInfo().subscribe(async waterBodiesLayers => {
    //   this.waterBodiesLayers = waterBodiesLayers;
    //   const theWaterBodyLayersLength = this.waterBodiesLayers ? this.waterBodiesLayers.length : 'null';
    //   console.log(`  waterBodyLayers subscription updated - points#: ${theWaterBodyLayersLength}`);
    // });

    this.measurementStore = await new MeasurementStore(this.log);
    this.eowDataGeometries = await new EowDataGeometries(this.log).init(this.eowData);  // TODO this seems to do similar to EowDataLayer - combine
    // this.eowDataGeometries.getPoints().subscribe(async (points) => {
    //   this.points = points;
    //   this.newPoints = true;
    //   const pointsLength = this.points ? this.points.features.length : 'null';
    //   console.log(`  pointsObs subscription updated - points#: ${pointsLength}`);
    // });
    // this.eowDataGeometries.getAllPoints().subscribe(async sourceNErrorMarginPoints => {
    //   this.sourceNErrorMarginPoints = sourceNErrorMarginPoints;
    //   const theSourceNErrorMarginPointsLength = this.sourceNErrorMarginPoints ? this.sourceNErrorMarginPoints.features.length : 'null';
    //   console.log(`  sourceNErrorMarginPoints subscription updated - points#: ${theSourceNErrorMarginPointsLength}`);
    // });
    // this.eowDataGeometries.getAllPointsMap().subscribe(async allPointsMap => {
    //   this.allPointsMap = allPointsMap;
    //   const theAllPointsMapObsLength = this.allPointsMap ? Object.keys(this.allPointsMap).length : 'null';
    //   console.log(`  allPointsMap subscription updated - points#: ${theAllPointsMapObsLength}`);
    // });
    // this.eowDataGeometries.getPointsErrorMargin().subscribe(pointsErrorMargins => {
    //   this.pointsErrorMargins = pointsErrorMargins;
    // });
    // this.map.on('moveend', () => {
    //   // set waterBodyFeatures, totalNumberWaterBodyFeatures and newWaterbodiesData
    //   this.collectWaterBodyFeatures();
    //   console.log(`app - map moved - newWaterbodiesData?: ${this.newWaterbodiesData}`);
    //   this.performRunWhenNewData();
    // });

    this.layersGeometries = new LayerGeometries(this.eowLayers, this.log);
    this.geometryOps = new GeometryOps(this.log);
    this.eowDataCharts = new EowDataCharts(this.geometryOps, this.layers, this.log);

    this.popupObject.init(this.eowMap);
    this.eowDataCharts.init(this.eowMap, this.htmlDocument);
    this.measurementStore.init(this.eowMap, this.eowData, this.userStore);
    await this.userStore.init(this.eowData, this.measurementStore);

    this.setupObserversHandleNewData();

    this.setupEventHandlers();

    this.DEBUGinit();

    // this.performFirstRunWhenReady();
    // this.calculateWaterBodiesCentroidsPlot();  // DEBUG
  }

  private setupObserversHandleNewData() { // forkJoin
    const uberObserver = combineLatest([
      this.eowDataGeometries.getPoints(),
      this.eowDataGeometries.getAllPoints(),
      this.eowDataGeometries.getAllPointsMap(),
      this.eowDataGeometries.getPointsErrorMargin(),
    ]);
    uberObserver.subscribe(async (value) => {
      this.log.verbose(theClass, `uberObserver - value length: ${value.filter(v => v !== null).length}`);
      const [points, allPoints, allPointsMap, errorMarginPoints] = value;
      if (points && allPoints && allPointsMap && errorMarginPoints) {
        handlePointsObserver(points);
        handleAllPointsObserver(allPoints);
        handlePointsMapObserver(allPointsMap);
        handleErrorMarginPoints(errorMarginPoints);

        if (this.ready()) {
          this.log.verbose(theClass, 'userObserver subcribe complete - call main loop now');
          await this.calculateIntersectionsPlot();
        }
      }
    });
    this.eowLayers.waterBodiesLayers.getLayersInfo().subscribe(layersInfo => {
      // I want to subscribe to layer's VectorSource observer and when triggers call calculateIntersectionsPlot()
      // with that new data.  When data points change, as per above subscription, it will call calculateIntersectionsPlot()
      // with no arguments and that means 'apply new data to existing layers'.
      // PERHAPS use collectWaterBodyFeatures()
      this.waterBodiesLayers = layersInfo;
      for (const layerInfo of layersInfo) {
        layerInfo.observable.subscribe(async vectorSource => {
          // New map vector data
          const passedData = {};
          passedData[layerInfo.name] = vectorSource.getFeatures();
          // accumulate / update global data
          this.waterBodyFeatures[layerInfo.name] = vectorSource.getFeatures();
          await this.calculateIntersectionsPlot(passedData);
        });
      }

      // const handleLayersInfo = (waterBodiesLayers: LayersInfo[]) => {
      //   this.waterBodiesLayers = waterBodiesLayers;
      //   const theWaterBodyLayersLength = this.waterBodiesLayers ? this.waterBodiesLayers.length : 'null';
      //   // Setup observers on the layers.observer
      //   // I think I could just build an array of layers that have changed and set a new field in  waterBodiesLayers to mark that
      //   console.log(`  waterBodyLayers subscription updated - points#: ${theWaterBodyLayersLength}`);
      // };

    });

    const handlePointsObserver = (points: FeatureCollection<Point>) => {
      this.points = points;
      this.newPoints = true;
      const pointsLength = this.points ? this.points.features.length : 'null';
      this.log.verbose(theClass, `  pointsObs subscription updated - points#: ${pointsLength}`);
    };

    const handleAllPointsObserver = (allPoints: FeatureCollection<Point>) => {
      this.sourceNErrorMarginPoints = allPoints;
      const theSourceNErrorMarginPointsLength = this.sourceNErrorMarginPoints ? this.sourceNErrorMarginPoints.features.length : 'null';
      this.log.verbose(theClass, `  sourceNErrorMarginPoints subscription updated - points#: ${theSourceNErrorMarginPointsLength}`);
    };

    const handlePointsMapObserver = (allPointsMap: PointsMap) => {
      this.allPointsMap = allPointsMap;
      const theAllPointsMapObsLength = this.allPointsMap ? Object.keys(this.allPointsMap).length : 'null';
      this.log.verbose(theClass, `  allPointsMap subscription updated - points#: ${theAllPointsMapObsLength}`);
    };

    const handleErrorMarginPoints = (pointsErrorMargins: SourcePointMarginsType[]) => {
      this.pointsErrorMargins = pointsErrorMargins;
      this.log.verbose(theClass, `  pointsErrorMargins subscription updated - points#: ${pointsErrorMargins.length}`);
    };

  }

  /**
   * Run this upon data changes
   */
  private async collectWaterBodyFeatures() {
    let numberWaterBodyFeatures = 0;

    for (const waterBodyLayer of this.waterBodiesLayers) {
      const waterBodyFeatures: Feature[] = await this.eowMap.getWaterBodiesInView(waterBodyLayer);
      numberWaterBodyFeatures += waterBodyFeatures.length;
      this.waterBodyFeatures[waterBodyLayer.name] = waterBodyFeatures;
    }

    if (numberWaterBodyFeatures !== this.totalNumberWaterBodyFeatures) {
      this.totalNumberWaterBodyFeatures = numberWaterBodyFeatures;
      this.newWaterbodiesData = true;
    }
  }

  private async performRunWhenNewData() {
    this.log.verbose(theClass, `  *** -> performRunWhenNewData -`);
    this.log.verbose(theClass, `    totalNumberWaterBodyFeatures: ${this.totalNumberWaterBodyFeatures}, points#: ${this.points && this.points.features.length},`
      + `allPointsMap#: ${this.allPointsMap && Object.keys(this.allPointsMap).length}, `
      + `sourceNErrorMarginPoints#: ${this.sourceNErrorMarginPoints && this.sourceNErrorMarginPoints.features.length}, `
      + `waterBodyLayers#: ${this.waterBodiesLayers && this.waterBodiesLayers.length}, newPoints: ${this.newPoints}, newWaterbodiesData: ${this.newWaterbodiesData}`);
    if (this.newPoints || this.newWaterbodiesData) {
      this.newPoints = false;
      this.newWaterbodiesData = false;
      await this.calculateIntersectionsPlot();
    }
  }

  /**
   * We need to wait until all data is ready.
   */
  private async performFirstRunWhenReady() {
    let numberOfTest = 0;
    const maxNumberTests = 100;
    await this.collectWaterBodyFeatures();
    const intervalId = setInterval(async () => {
      if (this.ready()) {
        clearInterval(intervalId);
        this.calculateIntersectionsPlot();
      } else {
        if (numberOfTest++ > maxNumberTests) {
          clearInterval(intervalId);
          throw new Error(`Waiting for data to become available - Max number of tests exceeded: ${maxNumberTests}`);
        }
        await this.collectWaterBodyFeatures();
      }
    }, 100);
  }

  // todo - add ENV VAR to setup debug stuff
  DEBUGinit() {
    this.htmlDocument.querySelectorAll('.pull-tab').forEach(e => {
      const element = (e as HTMLElement).closest('.panel');
      element.classList.toggle('pulled'); // Turn off initially as they are really annoying
    });
  }

  /**
   * Calculate intersections between EOW Data points and waterbodies and plot information about the data points.
   * It works dynamically when the map is first displayed, moved or zoomed.  It takes the waterbodies that are in view,
   * creates polygons out of them and calculates the intersections with those.  And then does whatever, such as draw
   * Pie Charts of the FU values of the EOW Data points in the waterbodies.
   *
   * This is called initially above and from map events. ??????????????
   *
   * @param givenWaterBodyFeatures if given will be the features (that have changed) to apply the EOWData Points to.  If it is null, this
   * means that no layer data has changed and to just apply the EOWData Points to all layers in this.waterBodyFeatures
   */
  async calculateIntersectionsPlot(givenWaterBodyFeatures: WaterBodyFeatures = null) {
    this.log.verbose(theClass, `calculateIntersectionsPlot called`);
    if (this.ready()) {
      const theFeatures = givenWaterBodyFeatures ? givenWaterBodyFeatures : this.waterBodyFeatures;   // choose argument or global data
      // Maybe debug, maybe not.  Don't perform calculations when zoomed out too far
      console.warn(`Resolution: ${this.map.getView().getResolution()}`);
      if (this.map.getView().getZoom() >= 9) {
        this.log.verbose(theClass, `  *** -> calculateIntersectionsPlot loop -`);
        this.log.verbose(theClass, `    points#: ${this.points.features.length}, allPointsMap#: ${Object.keys(this.allPointsMap).length}, `
          + `sourceNErrorMarginPoints#: ${this.sourceNErrorMarginPoints.features.length}, waterBodyLayers#: ${this.waterBodiesLayers.length}`);
        for (const waterBodyLayerName of Object.keys(theFeatures)) {
          // Get the features in the view
          const waterBodyFeatures: Feature[] = theFeatures[waterBodyLayerName];
          this.log.verbose(theClass, `     waterBodyLayer loop for: ${waterBodyLayerName} - Features in View#: ${waterBodyFeatures.length}`);
          // Convert to polygons
          const waterBodyFeatureCollection: FeatureCollection<Polygon> = this.layersGeometries.createFeatureCollection(waterBodyFeatures);

          // intersectAndDraw EOWData in polygons
          this.intersectAndDraw(waterBodyLayerName, waterBodyFeatureCollection, this.points, this.allPointsMap, this.sourceNErrorMarginPoints);
        }
      } else {
        console.warn(`Not performating calculations or drawing charts - zoomed too far out: ${this.map.getView().getZoom()}`);
      }
    }
  }

  private ready(): boolean {
    return (this.points && this.points.features.length > 0
      && this.sourceNErrorMarginPoints && this.sourceNErrorMarginPoints.features.length > 0
      && this.allPointsMap && Object.keys(this.allPointsMap).length > 0
      && this.waterBodiesLayers && this.waterBodiesLayers.length > 0);
  }

  // TODO - no need to pass the class args to this any more
  private async intersectAndDraw(layerName: string, waterBodyPolygons: FeatureCollection<Polygon>, points: FeatureCollection<Point>,
                                 allPointsMap: PointsMap, sourceNErrorMarginPoints: FeatureCollection<Point>) {
    const eowWaterBodyIntersections = await this.geometryOps.calculateLayerIntersections(points, sourceNErrorMarginPoints, allPointsMap, waterBodyPolygons, layerName);
    this.eowDataCharts.plotCharts(eowWaterBodyIntersections, layerName);
    this.eowDataCharts.debugDrawErrorMarginPoints(this.pointsErrorMargins);
  }

  /**
   * DEBUG - find centroids for ALL water bodies and plot something - eg. my avatar
   */
  private async calculateWaterBodiesCentroidsPlot() {
    const layerName = 'i5516 reservoirs';
    const eowWaterbodyPoints: EowWaterBodyIntersection[] = await this.geometryOps.convertLayerToDataFormat(this.layersGeometries, layerName);
    this.eowDataCharts.plotCharts(eowWaterbodyPoints, layerName);
  }

  private debug_printFirstEOWData() {
    if (this.allDataSource) {
      const features = this.allDataSource.getFeatures();
      const point = features.length > 0 ? (features[0].getGeometry() as SimpleGeometry).getFirstCoordinate() : 'no data yet';
      this.log.verbose(theClass, `First EOWData point: ${point}`);
    }
  }

  private debug_compareUsersNMeasurements() {
    return; // don't want it currently
    // Delay so other allDataSource.on('change' that loads the data gets a chance to fire
    if (this.allDataSource) {
      this.log.verbose(theClass, 'debug_compareUsersNMeasurements:');
      Object.keys(this.userStore.userById).forEach(uid => {
        const user = this.userStore.userById[uid];
        this.log.verbose(theClass, `  user - Id: ${user.id}, nickName: ${user.nickname}, photo_count: ${user.photo_count}`);
        const m = this.measurementStore.getByOwner(user.id);
        if (m && m.length > 0) {
          const images = m.map(m2 => m2.get('image'));
          this.log.verbose(theClass, `    number of images: ${images.length} -> \n${JSON.stringify(images, null, 2)}`);
        }
      });
      // Now print Measurements info
      this.log.verbose(theClass, `measurementsByOwner: ${
        JSON.stringify(this.measurementStore.measurementSummary(true, this.userStore), null, 2)}`);
      this.log.verbose(theClass, `measurementsById: ${
        JSON.stringify(this.measurementStore.measurementSummary(false, this.userStore), null, 2)}`);
      this.log.verbose(theClass, `Number of measurements per user: ${
        JSON.stringify(this.measurementStore.numberMeasurmentsPerUser(this.userStore), null, 2)}`);
    }
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
    if (this.dataLayer) {
      this.map.getView().fit(this.dataLayer.getSource().getExtent(), {duration: 1300});
      if (this.allDataSource) {
        this.dataLayer.setSource(this.allDataSource);
      }
    }
    this.toggleFilterButton(false);
  }

  private toggleFilterButton(state = false) {
    const element = this.htmlDocument.getElementById('clearFilterButton');
    element.classList.toggle('hidden', !state);
  }
}
