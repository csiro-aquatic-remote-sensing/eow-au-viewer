import {Component, OnInit, Inject, OnDestroy} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {AnimationOptions} from 'ol/View';
import Feature from 'ol/Feature';
import {HttpClient} from '@angular/common/http';
import {Popup} from './sidebar/popup';
import {ApplicationLayers} from './layers';
import {MeasurementStore} from './sidebar/measurement-store';
import {UserStore} from './sidebar/user-store';
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
import {combineLatest, Subject, Subscription} from 'rxjs';
import moment from 'moment';
import {GisOps} from './gis-ops';
import {isDebugLevel} from './globals';
import SideBarService from './sidebar/sidebar.service';
import {SideBarMessage} from './types';

const theClass = 'AppComponent';

type WaterBodyFeatures = { [name: string]: Feature[] }; // tslint:disable-line

// TODO - split this up!
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Eye On Water';
  // eowMap: EOWMap;
  // popupObject: Popup;
  // measurementStore: MeasurementStore;
  // userStore: UserStore;
  // eowData: EowDataLayer;
  // layers: ApplicationLayers;
  // eowLayers: EowLayers;
  // eowDataGeometries: EowDataGeometries;
  // layersGeometries: LayerGeometries;
  geometryOps: GeometryOps;
  // eowDataCharts: EowDataCharts;
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
  mapIsMovingState = false;
  // Use this to asyncronously 'call' SideBar methods - mitigates Circular Refs
  sideBarMessagingService = new Subject<SideBarMessage>();
  private subscriptions: Subscription[] = [];

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private http: HttpClient, private log: Brolog, private eowMap: EOWMap, private popupObject: Popup,
              private eowData: EowDataLayer, private layers: ApplicationLayers, private eowLayers: EowLayers, private eowDataGeometries: EowDataGeometries,
              private layersGeometries: LayerGeometries, private eowDataCharts: EowDataCharts, private sideBarService: SideBarService) {
  }

  async ngOnInit() {
    // this.loopLastCalled = -(this.loopCallIntervalMS + 1);
    // this.userStore = new UserStore(this.htmlDocument, this.log);
    // this.popupObject = new Popup(this.htmlDocument, this.userStore);
    // this.eowMap = new EOWMap(this, this.log).init(this.popupObject);
    this.eowMap.init(this.sideBarMessagingService);
    this.subscriptions.push(this.eowMap.getMap().subscribe(async map => {
      this.map = map;
    }));

    // this.eowData = new EowDataLayer().init(this.eowMap);
    this.eowData.init();
    this.subscriptions.push(this.eowData.allDataSourceObs.subscribe(allDataSource => {
      this.allDataSource = allDataSource;
      if (this.allDataSource) {
        // TODO - do this through sidebar
        // this.measurementStore.initialLoadMeasurements(this.userStore, this.allDataSource);
        // this.allDataSource.un('change', this.measurementStore.initialLoadMeasurements.bind(this, this.userStore, this.allDataSource));

        // DEBUG
        // this.allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this));
        // this.allDataSource.on('change', this.debug_printFirstEOWData.bind(this));
        this.debug_printFirstEOWData();
      }
    }));
    this.subscriptions.push(this.eowData.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    }));

    // this.layers = new ApplicationLayers(this.eowMap, this.log);
    // this.eowLayers = await new EowLayers(this.layers, this.log).init(); // this.eowMap);
    await this.eowLayers.init();

    // this.measurementStore = await new MeasurementStore(this.log);
    // this.eowDataGeometries = await new EowDataGeometries(this.log).init(this.eowData);  // TODO this seems to do similar to EowDataLayer - combine
    await this.eowDataGeometries.init();

    // this.layersGeometries = new LayerGeometries(this.eowLayers, this.log);
    // GeometryOps = new GeometryOps(this.log);
    // this.eowDataCharts = new EowDataCharts(this.layers, this.log);

    this.popupObject.init(this.sideBarMessagingService);
    this.eowDataCharts.init(this.eowMap, this.htmlDocument);
    await this.sideBarService.init(this.sideBarMessagingService);
    // this.measurementStore.init(); // this.eowMap, this.eowData, this.userStore);
    // await this.userStore.init();  // this.eowData, this.measurementStore);

    this.setupObserversHandleNewData();

    this.setupEventHandlers();

    this.preventObstructingPartsOfUI();

    // this.calculateWaterBodiesCentroidsPlot();  // DEBUG
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.eowMap.destroy();
    this.popupObject.destroy();
    this.eowData.destroy();
    this.layers.destroy();
    this.eowLayers.destroy();
    this.eowDataGeometries.destroy();
    this.layersGeometries.destroy();
    this.eowDataCharts.destroy();
    this.sideBarService.destroy();
  }

  private setupObserversHandleNewData() {
    const uberObserver = combineLatest([
      this.eowDataGeometries.getPoints(),
      this.eowDataGeometries.getAllPoints(),
      this.eowDataGeometries.getAllPointsMap(),
      this.eowDataGeometries.getPointsErrorMargin(),
    ]);
    this.subscriptions.push(uberObserver.subscribe(async (value) => {
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
    }));
    this.subscriptions.push(this.eowLayers.waterBodiesLayers.getLayersInfo().subscribe(layersInfo => {
      // I want to subscribe to layer's VectorSource observer and when triggers call calculateIntersectionsPlot()
      // with that new data.  When data points change, as per above subscription, it will call calculateIntersectionsPlot()
      // with no arguments and that means 'apply new data to existing layers'.
      // PERHAPS use collectWaterBodyFeatures()
      this.waterBodiesLayers = layersInfo;
      for (const layerInfo of layersInfo) {
        this.subscriptions.push(layerInfo.observable.subscribe(async vectorSource => {
          // New map vector data
          const passedData = {};
          passedData[layerInfo.name] = vectorSource.getFeatures();
          // accumulate / update global data
          this.waterBodyFeatures[layerInfo.name] = vectorSource.getFeatures();
          await this.calculateIntersectionsPlot(passedData);
        }));
      }
    }));

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

  preventObstructingPartsOfUI() {
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
    const dateStart = moment();

    if (this.ready()) {
      const theFeatures = givenWaterBodyFeatures ? givenWaterBodyFeatures : this.waterBodyFeatures;   // choose argument or global data
      this.log.verbose(theClass, `Resolution: ${this.map.getView().getResolution()} - ${dateStart.format(`HH:mm:ss.sss`)}`);
      // Maybe debug, maybe not.  Don't perform calculations when zoomed out too far
      if (this.map.getView().getZoom() >= 7) {
        console.log(`zoom: ${this.map.getView().getZoom()}`);
        this.log.silly(theClass, `  *** -> calculateIntersectionsPlot loop -`);
        this.log.silly(theClass, `    points#: ${this.points.features.length}, allPointsMap#: ${Object.keys(this.allPointsMap).length}, `
          + `sourceNErrorMarginPoints#: ${this.sourceNErrorMarginPoints.features.length}, waterBodyLayers#: ${this.waterBodiesLayers.length}`);
        for (const waterBodyLayerName of Object.keys(theFeatures)) {
          // Get the features in the view
          const waterBodyFeatures: Feature[] = theFeatures[waterBodyLayerName];
          // const clippedFeatures = bboxClip(waterBodyFeatures, this.map.getView().calculateExtent(this.map.getSize()));
          this.log.verbose(theClass, `     waterBodyLayer loop for: ${waterBodyLayerName} - # Features in View unfiltered: ${waterBodyFeatures.length}`);
          // Convert to polygons
          const waterBodyFeatureFiltered: FeatureCollection<Polygon> = GisOps.filterFromClusteredEOWDataBbox(waterBodyFeatures,
            this.points, this.layers, 'EOW Points box');  // filterFromClusteredEOWDataBbox
          this.log.verbose(theClass, `     waterBodyLayer loop for: ${waterBodyLayerName} - # Features in View FILTERED: ${waterBodyFeatureFiltered.features.length}`);
          // intersectAndDraw EOWData in polygons
          this.intersectAndDraw(waterBodyLayerName, waterBodyFeatureFiltered, this.points, this.allPointsMap, this.sourceNErrorMarginPoints);
        }
      } else {
        console.warn(theClass, `Not performating calculations or drawing charts - zoomed too far out: ${this.map.getView().getZoom()}`);
      }
      // } else {
      //   this.log.verbose(theClass, `not ready for calculating and drawing charts`);
    }
    const dateEnd = moment();
    this.log.info(theClass, `Time to perform calculateIntersectionsPlot Loop: ${dateEnd.diff(dateStart)}`);
  }

  private ready(): boolean {
    return (!this.mapIsMovingState && this.points && this.points.features.length > 0
      && this.sourceNErrorMarginPoints && this.sourceNErrorMarginPoints.features.length > 0
      && this.allPointsMap && Object.keys(this.allPointsMap).length > 0
      && this.waterBodiesLayers && this.waterBodiesLayers.length > 0);
  }

  private async intersectAndDraw(layerName: string, waterBodyPolygons: FeatureCollection<Polygon>, points: FeatureCollection<Point>,
                                 allPointsMap: PointsMap, sourceNErrorMarginPoints: FeatureCollection<Point>) {
    const eowWaterBodyIntersections = await GeometryOps.calculateLayerIntersections(points, sourceNErrorMarginPoints, allPointsMap, waterBodyPolygons, layerName);
    this.eowDataCharts.plotCharts(eowWaterBodyIntersections, layerName);
    await this.eowDataCharts.drawErrorMarginPoints(this.pointsErrorMargins);
  }

  /**
   * DEBUG - find centroids for ALL water bodies and plot something - eg. my avatar
   */
  private async calculateWaterBodiesCentroidsPlot() {
    const layerName = 'DigitalEarthAustraliaWaterbodies';
    if (this.waterBodyFeatures.hasOwnProperty(layerName)) {
      const eowWaterbodyPoints: EowWaterBodyIntersection[] = await GeometryOps.convertLayerToDataFormat(this.waterBodyFeatures[layerName]);
      this.eowDataCharts.plotCharts(eowWaterbodyPoints, layerName);
    }
  }

  private debug_printFirstEOWData() {
    if (isDebugLevel() && this.allDataSource) {
      const features = this.allDataSource.getFeatures();
      const point = features.length > 0 ? (features[0].getGeometry() as SimpleGeometry).getFirstCoordinate() : 'no data yet';
      this.log.verbose(theClass, `First EOWData point: ${point}`);
    }
  }

  private setupEventHandlers() {
    // Pull tabs of Most Active Users and Recent Measurements
    // this.htmlDocument.querySelectorAll('.pull-tab').forEach(i => i.addEventListener('click', (event: Event) => {
    //   const element = (event.target as HTMLElement).closest('.panel');
    //   element.classList.toggle('pulled');
    // }));

    // // Measurement List
    // document.querySelector('.measurement-list').addEventListener('click', (event) => {
    //   const element = (event.target as HTMLElement).closest('.item');
    //   if (!element) {
    //     return;
    //   }
    //
    //   const coordinate = element.getAttribute('data-coordinate').split(',').map(c => parseInt(c, 10)) as Coordinate;
    //   const id = element.getAttribute('data-key');
    //   const view = this.map.getView();
    //   view.cancelAnimations();
    //   view.animate({
    //     center: coordinate,
    //     zoom: 8,
    //     duration: 1300
    //   } as AnimationOptions);
    //   const features = [this.measurementStore.getById(id)];
    //   this.popupObject.draw(features, coordinate);
    // }, true);
    //
    // // User List
    // // TODO - this should be being removed (???) when setup SideBar properly
    // document.querySelector('.user-list').addEventListener('click', (event) => {
    //   const element = (event.target as HTMLElement).closest('.item');
    //   const selectedUserId = element.getAttribute('data-user');
    //   console.log(`clicked on user-id: ${this.userStore.selectedUserId}`);
    //   if (this.measurementStore.showMeasurements(selectedUserId)) {
    //     this.userStore.clearSelectedUser();
    //     this.userStore.selectedUserId = selectedUserId;
    //     element.classList.add('selectedUser', 'box-shadow');
    //     this.toggleFilterButton(true);
    //   }
    // }, true);

    // this.htmlDocument.getElementById('clearFilterButton').addEventListener('click', (event) => {
    //   this.clearFilter();
    // });
    //
    this.map.on('moveStart', () => {
      this.mapIsMovingState = true;
    });

    this.map.on('moveEnd', () => {
      this.mapIsMovingState = false;
    });
  }

  // private clearFilter() {
  //   this.userStore.clearSelectedUser();
  //   this.measurementStore.clearFilter();
  //   if (this.dataLayer) {
  //     this.map.getView().fit(this.dataLayer.getSource().getExtent(), {duration: 1300});
  //     if (this.allDataSource) {
  //       this.dataLayer.setSource(this.allDataSource);
  //     }
  //   }
  //   this.toggleFilterButton(false);
  // }

}
