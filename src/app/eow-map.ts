import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import Brolog from 'brolog';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
import {LayersInfo} from './eow-layers';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import LayerSwitcher from 'ol-layerswitcher';
import {defaults} from 'ol/control';
import {Injectable} from '@angular/core';
import SideBarService from './sidebar/sidebar.service';
import {EowBaseService} from './eow-base-service';
import {SidebarStatsService} from './stats/stats.sidebar.service';

const theClass = 'EOWMap';
const defaultCoord = [133.945313, -26.431228];
const canberra = [149.130005, -35.280937];
const theZoom = 12;

@Injectable()
export class EOWMap extends EowBaseService {
  private _mapObs: BehaviorSubject<Map>;
  private map: Map;

  constructor(private sidebarStatsService: SidebarStatsService, private sideBarService: SideBarService, private log: Brolog) {
    super();
    this._mapObs = new BehaviorSubject<Map>(null);
  }

  destroy() {
    super.destroy();
  }

  // popupObject: Popup) {
  init() {
    const mainMap = new TileLayer({
      source: new OSM(),
    });
    mainMap.set('name', 'Main map');
    mainMap.set('title', 'Open Street Map');
    mainMap.set('type', 'base');

    this.map = new Map({
      target: 'map',
      layers: [
        mainMap,
      ],
      view: new View({
        center: canberra,
        zoom: theZoom,
        projection: 'EPSG:4326'
      }),
      controls: defaults({
        zoom: true,
        attribution: true,
        rotate: true
      })
    });

    this._mapObs.next(this.map);

    this.setupEventHandling();  // this.popupObject);

    const layerSwitcher = new LayerSwitcher();
    this.map.addControl(layerSwitcher);
    // layerSwitcher.showPanel();

    return this;
  }

  public getMap() {
    return this._mapObs.asObservable();
  }

  private setupEventHandling() { // popupObject: Popup) {
    this.map.on('click', async (evt) => {
      const {
        pixel,
        coordinate
      } = evt;

      const features = [];

      this.map.forEachFeatureAtPixel(pixel, (feature) => {
        features.push(feature);
      });

      if (features.length) {
        this.log.verbose(theClass, `Clicked on map at: ${JSON.stringify(coordinate)}  - fix the call to display Popup (do through sidebar)`);
        this.sidebarStatsService.calculateStats(features);
        this.sideBarService.timeSeriesRawData = features;
        await this.sideBarService.buildPieChartPreparedData(features);
        this.sideBarService.setupToDisplayCharts();
        // popupObject.draw(features, coordinate);
      }
    });
  }

  /**
   * Return the WaterBodies in layer with name / index in waterBodyLayer that are in the current map view.  Potentially restrict to a zoom amount
   * if I find that when zoomed out to much time is being spent on all the enormous amount of data.
   *
   * @param waterBodyLayer has the name and index of layer in the Map's layers
   * @return somethign ....
   */
  // TODO - I don't think this is used (all the way through)
  async getWaterBodiesInView(waterBodyLayer: LayersInfo): Promise<Feature[]> {
    return new Promise(resolve => {
      const format = new GeoJSON();
      // this.mapObs.asObservable().subscribe(map => {
      if (this.map.getLayers().getLength() > waterBodyLayer.index) {
        if (waterBodyLayer.options.useAsWaterBodySource) {
          if (this.map.getLayers().getArray()[waterBodyLayer.index] instanceof VectorLayer) {
            const source: VectorSource = (this.map.getLayers().getArray()[waterBodyLayer.index] as VectorLayer).getSource();
            const features = source.getFeaturesInExtent(this.map.getView().calculateExtent(this.map.getSize()));
            resolve(features);
          } else {
            throw new Error(`getWaterBodiesInView() - expecting layer to be of type 'ol/layer/Vector', with name ${waterBodyLayer.name}`);
          }
        }
      }
    });
  }
}
