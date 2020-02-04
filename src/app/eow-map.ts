import Map from 'ol/Map';
import {BehaviorSubject} from 'rxjs';
import Brolog from 'brolog';
import {Popup} from './popup';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import View from 'ol/View';
import {fromLonLat} from 'ol/proj';

const theClass = 'EOWMap';
const defaultCoord = [133.945313, -26.431228];
const canberra = [149.130005, -35.280937];
const theZoom = 12;

export class EOWMap {
  mapObs: BehaviorSubject<Map>;

  constructor(private log: Brolog) {
  }

  init(popupObject: Popup) {
    const mainMap = new TileLayer({
      source: new OSM()
    });
    mainMap.set('name', 'Main map');

    const map = new Map({
      target: 'map',
      layers: [
        mainMap,
      ],
      view: new View({
        center: fromLonLat(canberra),
        zoom: theZoom,
        // projection: 'EPSG:4326'
      }),
      controls: [],
    });

    this.mapObs = new BehaviorSubject<Map>(map);

    this.setupEventHandling(popupObject);

    return this;
  }

  private setupEventHandling(popupObject: Popup) {
    this.mapObs.asObservable().subscribe(map => {
      map.on('click', (evt) => {
        const {
          pixel,
          coordinate
        } = evt;

        const features = [];

        map.forEachFeatureAtPixel(pixel, (feature) => {
          features.push(feature);
        });

        if (features.length) {
          this.log.verbose(theClass, `Clicked on map at: ${JSON.stringify(coordinate)}`);
          popupObject.draw(features, coordinate);
        }
      });
    });
  }
}
