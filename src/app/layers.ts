import TileWMS from 'ol/source/TileWMS';
import {Style, Fill} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import WFS from 'ol/format/WFS';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import {Brolog} from 'brolog';
import IconAnchorUnits from 'ol/style/IconAnchorUnits';
import {EOWMap} from './eow-map';
import {BehaviorSubject} from 'rxjs';
import Feature from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {LayersInfoManager, LayersSourceSetup} from './eow-layers';
import LayerSwitcher from 'ol-layerswitcher';
import {Group} from 'ol/layer';
import Layer from 'ol/layer/Layer';
import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import LayerGroup from 'ol/layer/Group';
import Icon from 'ol/style/Icon';

const theClass = 'Layers';
const lookInGroups = true;

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

export class ApplicationLayers {
  private map: Map;

  constructor(private eowMap: EOWMap, private log: Brolog) {
    this.eowMap.getMap().subscribe(map => {
      this.map = map;
    });
  }

  public getMapLayers(): Collection<BaseLayer> {
    return this.map.getLayers();
  }

  // private
  async createLayer(options: LayersSourceSetup, createNewLayerFunction: (layer?: Layer) => Layer): Promise<Layer> {
    return new Promise((resolve, reject) => {
      const layerName = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      const existingLayer = this.getLayer(layerName, lookInGroups);
      if (existingLayer !== null && ! options.allowMergeThruSameLayerName) {
        reject(`Cannot create layer with same name "${layerName}"`);
      }

      const layer = createNewLayerFunction(existingLayer);
      if (existingLayer) {
        resolve(existingLayer);
      }
      layer.set('layerName', layerName);
      layer.set('title', layerName);
      if (options.layerGroupName) {
        let group = this.getGroup(options.layerGroupName) as LayerGroup;
        if (group === null) {
          // create Group
          group = new LayerGroup();
          group.set('groupName', options.layerGroupName);
          group.set('isGroup', 'true');
          group.set('title', options.layerGroupName);
          this.map.addLayer(group);
        }
        const groupLayers = group.getLayersArray();
        groupLayers.push(layer);
        group.setLayers(new Collection<BaseLayer>(groupLayers));
        layer.set('groupName', options.layerGroupName);
      } else {
        this.map.addLayer(layer);
      }

      resolve(layer);
    });
  }

  /**
   * Return the layer with the given 'layerName' property.  Descend in to groups if given doLookInGroups is true.
   *
   * @param layerName to look for
   * @param doLookInGroups if true then descend in to searching the layers in groups
   * @param layersArrayToSearch is the array of layers to look through.  If not supplied then `this.map.getLayers().getArray()` will be used
   */
  getLayer(layerName: string, doLookInGroups: boolean = true, layersArrayToSearch?: BaseLayer[]): Layer {
    let layersToSearch;

    if (doLookInGroups) {
      layersToSearch = this.getAllLayers(this.map.getLayers().getArray());
    } else {
      layersToSearch = this.map.getLayers().getArray().filter(l => l.constructor.name !== 'LayerGroup');
    }

    const layersWithName = layersToSearch.filter(l => {
      return l.get('layerName') === layerName;
    });
    if (layersWithName.length > 1) {
      throw new Error(`More than one layer with name: ${layerName}`);
    }
    return layersWithName && layersWithName.length > 0 ? layersWithName[0] as Layer : null;
  }

  /**
   * Recursively descend in to groups and extract all non-group layers
   *
   * @param layersArrayToSearch is the input layers to search through
   */
  getAllLayers(layersArrayToSearch: BaseLayer[]): Layer[] {
    const layers = layersArrayToSearch.filter(l => l.constructor.name !== 'LayerGroup');
    const groups = layersArrayToSearch.filter(l => l.constructor.name === 'LayerGroup');
    const groupLayersRaw = groups.map(g => g.get('layers').getArray()).reduce((acc, val) => acc.concat(val), []);
    const groupLayers = groups.length > 0 ? this.getAllLayers(groupLayersRaw) : [];

    return [].concat(layers, groupLayers);
  }

  getGroup(groupName: string): BaseLayer {
    const layersWithName = this.map.getLayers().getArray().filter(l => {
      return l.get('groupName') === groupName && l.constructor.name === 'LayerGroup';
    });
    if (layersWithName.length > 1) {
      throw new Error(`More than one layer with group name: ${groupName}`);
    }
    return layersWithName && layersWithName.length > 0 ? layersWithName[0] : null;
  }

  /**
   * Such as from a file.
   *
   * @param url to source that returns a geojson.
   * @param options for creating the layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromGeoJSON(url, options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<BaseLayer> {
    // return new Promise(async (resolve, reject) => {
    const createNewLayer = (layer?: Layer): Layer => {
      // const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      // const response = await fetch(url);
      // if (!response.ok) {
      //   throw new Error(`createLayerFromWFSURL - Fetch Network response not ok for Name: "${name}", URL: ${url} - status: ${response.status}`);
      // }
      const newLayer = new VectorLayer(Object.assign(options, {
        source: new VectorSource({
          url,
          format: new GeoJSON(),
          // projection: 'EPSG:4326'
        })
      }));
      // newLayer.set('name', name);
      // const index = this.addLayer(newLayer, name);
      // This waterBodiesLayers.addInfo() needs to be done here in the promise
      waterBodiesLayers.addInfo(name, 999, url, options);
      // resolve(newLayer
      // );
      return newLayer;
    };
    return this.createLayer(options, createNewLayer);
  }

  /**
   * Such as from a geo service.  Allows for a query to be passed in the options, or dynamicQuery to programatically set the value of $
   * in the string.
   *
   * @param url to source that returns a geojson.
   * @param options for creating the layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromWFS(urlForWFS, options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<BaseLayer> {
    // return new Promise((resolve, reject) => {
    if (!options.layerOrFeatureName) {
      throw new Error('options.featureName expected');
    }
    const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
    const createNewLayer = (layer?: Layer): Layer => {
      const buildQuery = ({extent, resolution, projection}): string | null => {
        if (options.dynamicQuery) {
          return options.dynamicQuery({options, extent, resolution, projection});
        } else if (options.query) {
          return options.query;
        } else {
          return null;
        }
      };
      const buildQueryNbbox = ({extent, resolution, projection}): string | null => {
        const proj = projection.getCode();
        const normalBBox = `&bbox=${extent.join(',')},${proj}`;
        const queryBBox = `BBOX(geom, ${extent.join(',')},'${proj}')`;
        const theQuery = buildQuery({extent, resolution, projection});
        const bboxOrQuery = theQuery ? `&cql_filter=${theQuery}%20AND%20${queryBBox}` : normalBBox;
        if (theQuery) {
          this.log.verbose(theClass, `Dynamic query: ${theQuery}`);
        }
        return bboxOrQuery;
      };
      const vectorSource = new VectorSource({
        format: new GeoJSON(),
        loader: (extent, resolution, projection) => {
          const proj = projection.getCode();
          const feature = options.featurePrefix ? options.featurePrefix + ':' + options.layerOrFeatureName : options.layerOrFeatureName;
          // const normalBBox = `&bbox=${extent.join(',')},${proj}`;
          // const queryBBox = `BBOX(geom, ${extent.join(',')},'${proj}')`;
          const bboxOrQuery = buildQueryNbbox({extent, resolution, projection});
          // options.query ? `&cql_filter=${options.query}%20AND%20${queryBBox}` : normalBBox;
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
              vectorSource.clear(true);
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
      // newLayer.set('name', name);
      // const index = this.addLayer(newLayer, name);
      // This waterBodiesLayers.addInfo() needs to be done here in the promise
      const behaviourSubject = new BehaviorSubject<VectorSource>(vectorSource);
      waterBodiesLayers.addInfo(name, 99, urlForWFS, options, behaviourSubject);  // TODO I shouldn't need this now have rewritten layers.ts
      return newLayer;
    };
    return this.createLayer(options, createNewLayer);
  }

  /**
   * Such as from a geo service.
   *
   * @param url to source that returns a geojson.
   * @param options for creating the layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromWMS(url, options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<BaseLayer> {
    // return new Promise((resolve) => {
    const createNewLayer = (layer?: Layer): Layer => {
      options.opacity = options.opacity || 0.6;
      const newLayer = new TileLayer(Object.assign(options, {
        source: new TileWMS({
          url,
          params: Object.assign(options, {
            LAYERS: options.layerOrFeatureName
          })
        })
      }));
      // const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      // newLayer.set('name', name);
      // this.addLayer(newLayer, name);
      // resolve(newLayer);
      return newLayer;
    };
    return this.createLayer(options, createNewLayer);
  }

  /**
   * Create a new layer and set the features or append features to an existing layer with the same name (title)
   * @param title / name
   * @param features to set / append to layer
   * @param options when creating layer
   * @param waterBodiesLayers class instance to update for the client
   */
  async createLayerFromWFSFeatures(features: Feature[], options: LayersSourceSetup, waterBodiesLayers: LayersInfoManager): Promise<Layer> {
    // return new Promise((resolve) => {
    const createNewLayer = (layer?: Layer): Layer => {

      const name = options.layerDisplayName ? options.layerDisplayName : options.layerOrFeatureName;
      let newLayer;
      // if (existingLayerIndex > -1) {
      if (layer) {  // Because we allow this we set options.allowMergeThruSameLayerName to true
        const source: VectorSource = (layer as VectorLayer).getSource() as VectorSource;
        if (options.clear) {
          source.clear(true);
        }
        source.addFeatures(features);
      } else {
        const featureSource = new VectorSource();
        featureSource.addFeatures(features);
        options.opacity = options.opacity || 0.6;
        this.log.verbose(`Lines layer: ${name} - # lines added: ${features.length}`);
        newLayer = new VectorLayer(Object.assign(options, {
          source: featureSource,
          title: name,
          group: 'Features'
        }));
        // newLayer.set('name', name);
        // this.addLayer(newLayer, name);
        // newLayer.get('name');
      }
      // resolve(newLayer);
      return newLayer;
    };
    return this.createLayer(Object.assign(options, {allowMergeThruSameLayerName: true}), createNewLayer);
  }

  /**
   * Remove all features from a layer with the given name.  NoOp if layer with name doesn't exist
   *
   * @param layerName to clear
   */
  public clearLayerOfWFSFeatures(layerName: string) {
    const layer = (this.getLayer(layerName) as VectorLayer);
    if (layer) {
      layer.getSource().clear(true);
    } else {
      console.error(`clearLayerOfWFSFeatures - layer doesnt exist: ${layerName}`);
    }
  }
}
