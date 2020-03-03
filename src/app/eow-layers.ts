import {Brolog} from 'brolog';
import {Layers} from './layers';
import {BehaviorSubject} from 'rxjs';
import VectorSource from 'ol/source/Vector';
import { interval } from 'rxjs';
import { debounce } from 'rxjs/operators';

const theClass = 'Layers';

export interface LayersSourceSetup {
  /**
   * If to create this layer.  More for debug purposes.
   */
  createLayer?: boolean;
  /**
   * If to use as a waterBody definition (if createLayer is true) - VectorLayers (WFS) only
   */
  useAsWaterBodySource?: boolean;
  /**
   * layerFeature is the layer name (wms) or feature name (wfs) to pass to OpenLayers
   */
  layerOrFeatureName?: string;
  /**
   * Prefixes layerFeature for WFS.  Optional.  DO NOT include the ':' that WFS uses as the separator.
   */
  featurePrefix?: string;
  /**
   * layerDisplayName is the name to display on the map (if a layers menu is displayed).  It will default to featureName
   */
  layerDisplayName?: string;
  /**
   * Initial value of if to show the layer.  Corresponds to a checkbox or similar in the UI to turn the layer on and off.
   */
  visible?: boolean;
  /**
   * Style for WFS features
   */
  style?: any;
  /**
   * Tiled for WMS layers - if to request TILES or not
   */
  TILED?: boolean;
  /**
   * If to delete any existing features first
   */
  clear?: boolean;
  /**
   * Query string to pass in with requests.  It is appended to the GET request with `cql_filter=<the query> AND BBOX(geom, <extent>, 'EPSG:4326')`.
   * This query is used to filter at the server eg. `area>100000` (meters square)
   */
  query?: string;
  /**
   * Zoom and resolution.  The resolution values are more accurate but if not given the zoom ones (coarser) will be used
   */
  minZoom?: number;
  maxZoom?: number;
  maxResolution?: number;
  minResolution?: number;
  opacity?: number;
}

export interface LayersInfo {
  name: string;
  index: number;        // of the layer in the map's layers array
  url: string;
  options: LayersSourceSetup;
  observable: BehaviorSubject<VectorSource>;  // so can watch for changes in the data that happens due to BBoxStrategy
}

/**
 * Class for the management of the LayersInfo.  Only WFS that define Waterbodies will be stored.
 */
export class LayersInfoManager {
  private _layersInfo = new BehaviorSubject<LayersInfo[]>([]);
  private layersInfo: LayersInfo[] = [];

  public addInfo(name, index, url, options, observable?) {
    this.layersInfo.push({name, index, url, options, observable});
    // subscribers will get the lot each time the subscription updates.  Using Object.assign to send a copy.
    this._layersInfo.next(Object.assign([], this.layersInfo));
  }

  /**
   * @Return observable of the layers information to subscribe to
   */
  public getLayersInfo() {
    return this._layersInfo.asObservable().pipe(debounce(() => interval(10)));
  }

  /**
   * @param layerName to lookup
   * @return the layersInfo for the layer with the given name or null if it doesnt exist
   */
  public getLayerInfo(layerName: string): LayersInfo {
    const layerInfo = this.layersInfo.filter(l => l.name === layerName);
    return layerInfo.length > 0 ? layerInfo[0] : null;
  }
}

export class EowLayers {
  waterBodiesLayers = new LayersInfoManager();

  constructor(private layers: Layers, private log: Brolog) {
  }

  async init() {
    await this.addLayers();

    return this;
  }

  async addLayers() {
    const layerPromises = [];

    this.setupGeoJSONLayer(layerPromises, 'assets/waterbodies/Australia/aus25wgd_l.geojson',
      {createLayer: false, useAsWaterBodySource: false, layerDisplayName: 'Waterbodies shape'});

    this.setupGeoJSONLayer(layerPromises, 'assets/waterbodies/Canberra/i5516_reservoirs.geojson',
      {createLayer: false, useAsWaterBodySource: false, layerDisplayName: 'i5516 reservoirs'});

    this.setupWFSLayer(layerPromises, 'https://hotspots.dea.ga.gov.au/geoserver/public/wfs',
      {
        createLayer: true, useAsWaterBodySource: true, layerOrFeatureName: 'DigitalEarthAustraliaWaterbodies', featurePrefix: 'public',
        layerDisplayName: 'Waterbodies Features', maxResolution: 0.05, query: 'area>500000'
      });

    this.setupWMSLayer(layerPromises, 'https://hotspots.dea.ga.gov.au/geoserver/public/wms',
      {
        createLayer: true, useAsWaterBodySource: false, layerOrFeatureName: 'DigitalEarthAustraliaWaterbodies',
        TILED: true, layerDisplayName: 'Waterbodies Map'
      });

    this.setupWMSLayer(layerPromises, 'https://ows.services.dea.ga.gov.au/wms?',  // https://ows.dea.ga.gov.au',
      {
        createLayer: true, useAsWaterBodySource: false,  TILED: true,
        layerOrFeatureName: 'wofs_filtered_summary', layerDisplayName: 'WOFS', visible: true
      }); // minResolution: 0.00069,

    return Promise.all(layerPromises);
  }

  private setupGeoJSONLayer(layerPromises: Promise<any>[], url: string, options: LayersSourceSetup) {
    if (options.createLayer) {
      layerPromises.push(this.layers.createLayerFromGeoJSON(url, options, this.waterBodiesLayers));
    }
  }

  private setupWFSLayer(layerPromises: Promise<any>[], url: string, options: LayersSourceSetup) {
    if (options.createLayer) {
      // layerPromises.push(this.layers.createLayerFromWFS(name, url, featurePrefix, options));
      layerPromises.push(this.layers.createLayerFromWFS(url, options, this.waterBodiesLayers));
    }
  }

  private setupWMSLayer(layerPromises: Promise<any>[], url: string, options: LayersSourceSetup) {
    if (options.createLayer) {
      layerPromises.push(this.layers.createLayerFromWMS(url, options, this.waterBodiesLayers));
    }
  }

  /**
   * LayerInfo has a field 'index' that needs to come from Layers.layerNames, which is a mapping from layer name to index in Maps layers array
   */
  private getLayerIndex(layerInfo: LayersSourceSetup) {
    const layerName = layerInfo.layerDisplayName || layerInfo.layerOrFeatureName;
    if (this.layers.layerNames.hasOwnProperty(layerName)) {
      return this.layers.layerNames.getName(layerName);
    } else {
      throw new Error(`layers.layerNames doesnt have layer with name: ${layerName}`);
    }
  }
}
