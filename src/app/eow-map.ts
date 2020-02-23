import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import {BehaviorSubject} from 'rxjs';
import Brolog from 'brolog';
import {Popup} from './popup';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
import {fromLonLat, toLonLat} from 'ol/proj';
import {AppComponent} from './app.component';
import {FeatureCollection, featureCollection as turfFeatureCollection, Geometry, Polygon, polygon as turfPolygon} from '@turf/helpers';
import {feature as turfFeature} from '@turf/helpers';
import {LayersInfo} from './eow-layers';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

const theClass = 'EOWMap';
const defaultCoord = [133.945313, -26.431228];
const canberra = [149.130005, -35.280937];
const theZoom = 12;

export class EOWMap {
  private _mapObs: BehaviorSubject<Map>;
  private map: Map;

  constructor(private app: AppComponent, private log: Brolog) {
  }

  init(popupObject: Popup) {
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
        center: canberra,
        zoom: theZoom,
        projection: 'EPSG:4326'
      }),
      controls: [],
    });

    this._mapObs = new BehaviorSubject<Map>(this.map);

    this.setupEventHandling(popupObject);

    return this;
  }

  public getMap() {
    return this._mapObs.asObservable();
  }

  private setupEventHandling(popupObject: Popup) {
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
        popupObject.draw(features, coordinate);
      }
    });

    // Draw the EOW Artefacts initially and after the map moves / zooms
    this.map.on('moveend', async (evt) => {
      console.log(`map moveend`);
      await this.app.calculateIntersectionsPlot();
    });
  }

  /**
   * Return the WaterBodies in layer with name / index in waterBodyLayer that are in the current map view.  Potentially restrict to a zoom amount
   * if I find that when zoomed out to much time is being spent on all the enormous amount of data.
   *
   * @param waterBodyLayer has the name and index of layer in the Map's layers
   * @return somethign ....
   */
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
