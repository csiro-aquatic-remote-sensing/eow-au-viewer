import Icon from 'ol/style/Icon';
import TileWMS from 'ol/source/TileWMS';
import {
  Style,
  Fill
} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import WFS from 'ol/format/WFS';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import {HttpClient} from '@angular/common/http';
import {
  Brolog,
} from 'brolog';
import IconAnchorUnits from 'ol/style/IconAnchorUnits';
import {EOWMap} from './eow-map';
import {BehaviorSubject} from 'rxjs';
import Feature from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {LayersInfoManager, LayersSourceSetup} from './eow-layers';

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
export const redLines = new Style({
  stroke: new Stroke({color: 'rgba(125, 25, 0, 1)'})
});

export interface Options {
  style?: any;
  minZoom?: number;
  visible?: boolean;
  params?: any;
}

type LayerNamesSchema = { [name: string]: number }; // tslint:disable-line

/**
 *
 * Internally to the Map, layers are stored in an array but we need to get to them through the layer 'name'.
 * We need to have the ability to append to existing features in createLayerFromWFSFeatures
 * LayerNames maps names to index in the Map's layers array
 */
export class LayerNames {
  private layerNames: LayerNamesSchema = {};

  private fixeName(name: string) {
    if (! name) {
      throw new Error(`name is undefined`);
    }
    return name.replace('\s+', '_');
  }

  /**
   * Add a value at 'name' index and return the 'name' (as it might have been altered for consistency reasons)
   * @param name is the index
   * @param value to add at name
   * @return name as it was used as index since might have been altered for consistency reasons
   */
  public addName(name: string, value: any): string {
    const fixed = this.fixeName(name);
    if (this.layerNames.hasOwnProperty(fixed)) {
      throw new Error(`Attempting to add an existing name: ${fixed}`);
    }
    this.layerNames[fixed] = value;
    return fixed;
  }

  public getName(name: string) {
    return this.layerNames[this.fixeName(name)];
  }

  public getAll(): string[] {
    return Object.keys(this.layerNames);
  }
}

export class Layers {
  private mapLayersObs: BehaviorSubject<any>;
  layerNames = new LayerNames();
  private map: Map;

  constructor(private eowMap: EOWMap, private htmlDocument: Document, private http: HttpClient, private log: Brolog) {
    this.eowMap.getMap().subscribe(async map => {
      this.map = map;
    });

    this.mapLayersObs = new BehaviorSubject(null);
    this.mapLayersObs.asObservable().subscribe(layer => {
      this.drawLayerInMenu(layer);
    });
  }

  /**
   * Such as from a file.
   *
   * @param url to source that returns a geojson.
   * @param options for creating the layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromGeoJSON(url, options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`createLayerFromWFSURL - Fetch Network response not ok for Name: "${name}", URL: ${url} - status: ${response.status}`);
      }
      const newLayer = new VectorLayer(Object.assign(options, {
        source: new VectorSource({
          url,
          format: new GeoJSON(),
          // projection: 'EPSG:4326'
        })
      }));
      newLayer.set('name', name);
      const index = this.addLayer(newLayer, name);
      // This waterBodiesLayers.addInfo() needs to be done here in the promise
      waterBodiesLayers.addInfo(name, index, url, options);
      resolve(newLayer);
    });
  }

  /**
   * Such as from a geo service.
   *
   * @param url to source that returns a geojson.
   * @param options for creating the layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromWFS(urlForWFS, options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!options.layerOrFeatureName) {
        reject('options.featureName expected');
      }
      const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      const vectorSource = new VectorSource({
        format: new GeoJSON(),
        loader: (extent, resolution, projection) => {
          const proj = projection.getCode();
          const feature = options.featurePrefix ? options.featurePrefix + ':' + options.layerOrFeatureName : options.layerOrFeatureName;
          const normalBBox = `&bbox=${extent.join(',')},${proj}`;
          const queryBBox = `BBOX(geom, ${extent.join(',')},'${proj}')`;
          const bboxOrQuery = options.query ? `&cql_filter=${options.query}%20AND%20${queryBBox}` : normalBBox;
          const url = `${urlForWFS}?service=WFS&version=1.1.0&request=GetFeature&typename=${feature}&` +
            `outputFormat=application/json&srsname=${proj}${bboxOrQuery}`;
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url);
          const onError = () => {
            vectorSource.removeLoadedExtent(extent);
          };
          xhr.onerror = onError;
          xhr.onload = () => {
            if (xhr.status === 200) {
              const features = vectorSource.getFormat().readFeatures(xhr.responseText, {
                dataProjection: proj,
                featureProjection: 'EPSG:4326'
              }) as Feature[];
              vectorSource.addFeatures(features);
              // Due to the BBOXStrategy, this loader function will run every time the map is panned or zoomed.  Update the Observable
              // with new data if the VectorLayer is already defined (ie. not the first time this runs).  The first time the Observable
              // will be created in the VectorLayer code below.
              const existingWaterBodiesLayer = waterBodiesLayers.getLayerInfo(name);
              if (existingWaterBodiesLayer) {
                existingWaterBodiesLayer.observable.next(vectorSource);
              }
            } else {
              onError();
            }
          };
          xhr.send();
        },
        strategy: bboxStrategy
      });

      // I want to subscribe to changes on the VectorSource so can use Observables to know when there are changes.  But this method may
      // be used by lots of different layers

      const newLayer = new VectorLayer(Object.assign(options, {
        source: vectorSource,
        // TODO pass in the style
        style: new Style({
          stroke: new Stroke({
            color: 'rgba(0, 64, 128, 1.0)',
            width: 2
          })
        })
      }));
      newLayer.set('name', name);
      const index = this.addLayer(newLayer, name);
      // This waterBodiesLayers.addInfo() needs to be done here in the promise
      const behaviourSubject = new BehaviorSubject<VectorSource>(vectorSource);
      waterBodiesLayers.addInfo(name, index, urlForWFS, options, behaviourSubject);
      resolve(newLayer);
    });
  }

  /**
   * Such as from a geo service.
   *
   * @param url to source that returns a geojson.
   * @param options for creating the layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromWMS(url, options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<any> {
    return new Promise((resolve) => {
      options.opacity = options.opacity || 0.6;
      const newLayer = new TileLayer(Object.assign(options, {
        source: new TileWMS({
          url,
          params: Object.assign(options, {
            LAYER: options.layerOrFeatureName
          })
        })
      }));
      const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      newLayer.set('name', name);
      this.addLayer(newLayer, name);
      newLayer.setVisible(false);
      resolve(newLayer);
    });
  }

  /**
   * Create a new layer and set the features or append features to an existing layer with the same name (title)
   * @param title / name
   * @param features to set / append to layer
   * @param options when creating layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromWFSFeatures(features: Feature[], options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<any> {
    return new Promise((resolve) => {
      const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      const existingLayerIndex = this.layerNames.getName(name) || -1; // hasOwnProperty(name) ? this.layerNames[name] : -1;
      let newLayer;
      if (existingLayerIndex > -1) {
        newLayer = this.map.getLayers().getArray()[existingLayerIndex];
        const source: VectorSource = newLayer.getSource();
        source.addFeatures(features);
      } else {
        const featureSource = new VectorSource();
        featureSource.addFeatures(features);
        options.opacity = options.opacity || 0.6;
        this.log.verbose(`Lines layer: ${name} - # lines added: ${features.length}`);
        newLayer = new VectorLayer(Object.assign(options, {
          source: featureSource
        }));
        newLayer.set('name', name);
        this.addLayer(newLayer, name);
        newLayer.get('name');
      }
      resolve(newLayer);
    });
  }

  /**
   * Add layer to map and keep information about it.
   *
   * @param layer to add
   * @param layerName so can find it later (maps just use a numerically indexed array)
   * @return index of layer in the map's array
   */
  private addLayer(layer: any, layerName: string): number {
    this.map.addLayer(layer);
    const index = this.map.getLayers().getLength() - 1;
    const newName = this.layerNames.addName(layerName, index);
    this.log.verbose(`map.add layer "${newName}" - there are now ${this.map.getLayers().getArray().length} layers`);

    this.mapLayersObs.next(layer);
    return index;
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
