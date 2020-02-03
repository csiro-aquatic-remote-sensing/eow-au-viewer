import Icon from 'ol/style/Icon';
import TileWMS from 'ol/source/TileWMS';
import {
  Style,
  Fill
} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import {HttpClient} from '@angular/common/http';
import {
  Brolog,
} from 'brolog';
import IconAnchorUnits from 'ol/style/IconAnchorUnits';
import {EOWMap} from './eow-map';
import {BehaviorSubject} from 'rxjs';

const theClass = 'Layers';

export const iconStyle = new Style({
  image: new Icon({
    anchor: [0.5, 46],
    anchorXUnits: IconAnchorUnits.FRACTION,
    anchorYUnits: IconAnchorUnits.PIXELS,
    opacity: 0.75,
    scale: 0.02,
    src: '../assets/icon.png'
  })
});
export const fillStyle = new Style({
  fill: new Fill({color: 'rgba(224, 255, 255, 0.33)'})
});

export interface Options {
  style?: any;
  minZoom?: number;
  visible?: boolean;
  params?: any;
}

// Internally to the Map, layers are stored in an array but we need to get to them through the layer 'name'.
// We need to have the ability to append to existing features in createLayerFromWFSFeatures
type LayerNames = { [name: string]: number }; // tslint:disable-line

export class Layers {
  private mapLayersObs: BehaviorSubject<any>;
  private layerNames: LayerNames = {};

  constructor(private eowMap: EOWMap, private htmlDocument: Document, private http: HttpClient, private log: Brolog) {
    this.mapLayersObs = new BehaviorSubject(null);
    this.mapLayersObs.asObservable().subscribe(layer => {
      this.drawLayerInMenu(layer);
    });
  }

  async createLayerFromWFSURL(title, url, options: Options = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {
        this.http.get(url).toPromise().then(d => {
          this.log.info(theClass, `url exists: ${url}`);
          const newLayer = new VectorLayer(Object.assign(options, {
            title,
            source: new VectorSource({
              url,
              format: new GeoJSON(),
              // projection: 'EPSG:4326'
            })
          }));
          newLayer.set('name', title);
          this.addLayer(newLayer, title);
          this.log.verbose(`map.add layer "${title} - there are now ${map.getLayers().getArray().length} layers`);
          newLayer.setVisible(false); // options.hasOwnProperty('visible') ? options.visible : true);
          resolve(newLayer);
        }).catch(e => {
          // reject() this?
          this.log.warn(theClass, `URL DOES NOT EXIST: ${url}`);
        });
      });
    });
  }

  async createLayerFromWMSURL(title, url, options: Options = {}): Promise<any> {
    return new Promise((resolve) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {
        const wms = new TileLayer({
          opacity: 0.6,
          source: new TileWMS({
            url: 'https://ows.dea.ga.gov.au',
            params: options.params,
          })
        });
        wms.set('name', title);
        this.addLayer(wms, title);
        wms.setVisible(false);
        resolve();
      });
    });
  }

  /**
   * Create a new layer and set the features or append features to an existing layer with the same name (title)
   * @param title / name
   * @param features to set / append to layer
   * @param options when creating layer
   */
  async createLayerFromWFSFeatures(title, features, options: Options = {}): Promise<any> {
    return new Promise((resolve) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {

        const existingLayerIndex = this.layerNames.hasOwnProperty(title) ? this.layerNames[title] : -1;
        let newLayer;
        if (existingLayerIndex > -1) {
          newLayer = map.getLayers().getArray()[existingLayerIndex];
          const source: VectorSource = newLayer.getSource();
          source.addFeatures(features);
        } else {
          const featureSource = new VectorSource();
          featureSource.addFeatures(features);
          console.log(`Lines layer: ${name} - # lines added: ${features.length}`);
          newLayer = new VectorLayer(Object.assign(options, {
            name,
            source: featureSource
          }));
          newLayer.set('name', title);
          this.addLayer(newLayer, title);
          newLayer.get('name');
          newLayer.setVisible(options.hasOwnProperty('visible') ? options.visible : true);
        }
        resolve(newLayer);
      });
    });
  }

  private addLayer(layer: any, layerName: string) {
    this.eowMap.mapObs.asObservable().subscribe(async map => {
      map.addLayer(layer);
      this.layerNames[layerName] = map.getLayers().getArray().length - 1;
      this.log.verbose(`map.add layer "${layer.get('name')} - there are now ${map.getLayers().getArray().length} layers`);

      this.mapLayersObs.next(layer);
    });
  }

  private drawLayerInMenu(layer: any) {
    const generateCheckbox = (idCheckbox, labelName, htmlElement) => {
      const theCheckbox = this.htmlDocument.createElement('input');
      theCheckbox.type = 'checkbox';
      theCheckbox.id = idCheckbox;
      const label = this.htmlDocument.createElement('label');
      label.htmlFor = idCheckbox;
      label.appendChild(this.htmlDocument.createTextNode(labelName));
      htmlElement.appendChild(theCheckbox);
      htmlElement.appendChild(label);
      return theCheckbox;
    };

    if (!layer) {
      return;
    }

    const name = layer.get('name');
    const checkbox = generateCheckbox(Math.floor(Math.random() * 10000), name, this.htmlDocument.querySelector('.layersSwitch'));

    // Manage when checkbox is (un)checked
    checkbox.addEventListener('change', function() {
      if (this.checked !== layer.getVisible()) {
        layer.setVisible(this.checked);
      }
    });

    // Manage when layer visibility changes outside of this
    layer.on('change:visible', function() {
      if (this.getVisible() !== checkbox.checked) {
        checkbox.checked = this.getVisible();
      }
    });

    // Set state the first time
    setTimeout(() => {
      checkbox.checked = layer.getVisible();
    }, 200);
  }
}
