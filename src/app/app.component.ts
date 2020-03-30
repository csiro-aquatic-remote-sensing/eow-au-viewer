import {Component, OnInit, Inject, OnDestroy, ElementRef, ViewChild, AfterViewInit} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import Feature from 'ol/Feature';
import {HttpClient} from '@angular/common/http';
import {ApplicationLayers} from './layers';
import {EowDataLayer} from './eow-data-layer';
import EowDataGeometries from './eow-data-geometries';
import LayerGeometries from './layers-geometries';
import GeometryOps from './geometry-ops';
import {Brolog} from 'brolog';
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
import {jqxWindowComponent} from 'jqwidgets-framework/jqwidgets-ng/jqxwindow';
import {StatsService} from './stats/stats.service';

const theClass = 'AppComponent';

type WaterBodyFeatures = { [name: string]: Feature[] }; // tslint:disable-line

// TODO - split this up!
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy { // }, AfterViewInit {
  // @ViewChild('windowReference', {static: false}) window: jqxWindowComponent;
  // @ViewChild('jqxWidget', {static: false}) jqxWidget: ElementRef;

  title = 'Eye On Water';
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
  mapIsMovingState = false;
  // Use this to asyncronously 'call' SideBar methods - mitigates Circular Refs
  sideBarMessagingService = new Subject<SideBarMessage>();
  private subscriptions: Subscription[] = [];

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private http: HttpClient, private log: Brolog, private eowMap: EOWMap,
              private eowData: EowDataLayer, private layers: ApplicationLayers, private eowLayers: EowLayers, private eowDataGeometries: EowDataGeometries,
              private layersGeometries: LayerGeometries, private eowDataCharts: EowDataCharts, private sideBarService: SideBarService,
              private statsService: StatsService) {
  }

  XngAfterViewInit(): void {
    const offsetLeft = 0; // this.jqxWidget.nativeElement.offsetLeft;
    const offsetTop = 0; // this.jqxWidget.nativeElement.offsetTop;
    // this.window.position({x: offsetLeft + 50, y: offsetTop + 50});
    // this.window.focus();
  }


  onLogin() {
    console.log('login');
  }

  // onResizeCheckBox(event: any): void {
  //   if (event.args.checked) {
  //     this.window.resizable(true);
  //   } else {
  //     this.window.resizable(false);
  //   }
  // }
  //
  // onDragCheckBox(event: any): void {
  //   if (event.args.checked) {
  //     this.window.draggable(true);
  //   } else {
  //     this.window.draggable(false);
  //   }
  // }
  //
  // onShowButton(): void {
  //   this.window.open();
  // }
  //
  // onHideButton(): void {
  //   this.window.close();
  // }

  async ngOnInit() {
    this.eowMap.init(this.sideBarMessagingService);
    this.subscriptions.push(this.eowMap.getMap().subscribe(async map => {
      this.map = map;
    }));

    this.eowData.init();
    this.subscriptions.push(this.eowData.allDataSourceObs.subscribe(allDataSource => {
      this.allDataSource = allDataSource;
      if (this.allDataSource) {
        // DEBUG
        // this.allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this));
        // this.allDataSource.on('change', this.debug_printFirstEOWData.bind(this));
        this.debug_printFirstEOWData();
      }
    }));
    this.subscriptions.push(this.eowData.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    }));
    await this.eowLayers.init();

    await this.eowDataGeometries.init();

    // this.popupObject.init(this.sideBarMessagingService);
    this.eowDataCharts.init(this.eowMap, this.htmlDocument, this.sideBarMessagingService);
    await this.sideBarService.init(this.sideBarMessagingService);
    this.statsService.init();

    this.setupObserversHandleNewData();

    this.setupEventHandlers();

    this.preventObstructingPartsOfUI();

    // this.calculateWaterBodiesCentroidsPlot();  // DEBUG
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.eowMap.destroy();
    // this.popupObject.destroy();
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
          const waterBodyFeatureFiltered: FeatureCollection<Polygon> = await GisOps.filterFromClusteredEOWDataBbox(waterBodyFeatures,
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
      await this.eowDataCharts.plotCharts(eowWaterbodyPoints, layerName);
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

    this.map.on('moveStart', () => {
      this.mapIsMovingState = true;
    });

    this.map.on('moveEnd', () => {
      this.mapIsMovingState = false;
    });
  }
}
