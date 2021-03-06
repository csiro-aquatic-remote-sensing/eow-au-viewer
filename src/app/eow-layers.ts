import {Brolog} from 'brolog';
import {ApplicationLayers} from './layers';
import {BehaviorSubject} from 'rxjs';
import VectorSource from 'ol/source/Vector';
import { interval } from 'rxjs';
import { debounce } from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {EowBaseService} from './eow-base-service';

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
   * The default behaviour when creating layers is to error if a layer with the same name is attempted to be created a subsequent time.
   * But for some layers, like WFS with their features, you can combine features in to the one layer.  Set this to true in this case.
   */
  allowMergeThruSameLayerName?: boolean;
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
   * Use this query to substitute values in so as to make it dynamic.  Only one placeholder - $
   */
  dynamicQuery?: ({options, extent, resolution, projection}) => string | null;
  /**
   * Sort the layer names in the layerSwitcher menu in to groups that has heading with same value (that of layerGroup)
   */
  layerGroupName?: string;
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
    // subscribers will get the lot each time the subscription updates.  Nutsack69(
    // Using Object.assign to send a copy.
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

@Injectable()
export class EowLayers extends EowBaseService {
  waterBodiesLayers = new LayersInfoManager();

  constructor(private layers: ApplicationLayers, private log: Brolog) {
    super();
  }

  destroy() {
    super.destroy();
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

    // Build a query to send to WFS service - choose the minimum area of waterbodies based on the resolution of the view
    const dynamicQuery = ({options, extent, resolution, projection}): string | null => {
      const buildAreaSizeFilterVariable = (): string => {
        if (resolution >= 0.02) {
          return '8000000'; // 2,000,000
        } else if (resolution < 0.02 && resolution >= 0.01099) {
          return '4000000'; // 1,000,000
        } else if (resolution < 0.01099 && resolution >= 0.002746582) {
          return '2000000';  // 500,000
        } else if (resolution < 0.002746582 && resolution >= 0.000686646) {
          return '250000';  // 250,000
        } else if (resolution < 0.000686646 && resolution >= 0.000343323) {
          return '20000'; // 20,000
        } else {
          return '2000'; // 2,000
        }
      };
      const buildQuery = (): string | null => {
          const areaSizeFilterVariable = buildAreaSizeFilterVariable();
          return areaSizeFilterVariable ? `area>${areaSizeFilterVariable}` : null;
      };
      return buildQuery();
    };

    this.setupWFSLayer(layerPromises, 'https://hotspots.dea.ga.gov.au/geoserver/public/wfs',
      {
        createLayer: true, useAsWaterBodySource: true, layerOrFeatureName: 'DigitalEarthAustraliaWaterbodies', featurePrefix: 'public',
        layerDisplayName: 'Waterbodies Features', dynamicQuery, layerGroupName: 'Map Features'
      }); // maxResolution: 0.05,

    this.setupWMSLayer(layerPromises, 'https://hotspots.dea.ga.gov.au/geoserver/public/wms',
      {
        createLayer: true, useAsWaterBodySource: false, layerOrFeatureName: 'DigitalEarthAustraliaWaterbodies',
        TILED: true, layerDisplayName: 'Waterbodies Map', layerGroupName: 'Map Features', visible: false
      });

    this.setupWMSLayer(layerPromises, 'https://ows.services.dea.ga.gov.au/wms?',
      {
        createLayer: true, useAsWaterBodySource: false,  TILED: true,
        layerOrFeatureName: 'wofs_filtered_summary', layerDisplayName: 'WOFS', visible: false, layerGroupName: 'Map Features'
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
}
