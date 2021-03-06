import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import CircleStyle from 'ol/style/Circle';
import {
  Style,
  Stroke,
  Fill
} from 'ol/style';

import colors from './colors.json';
import {BehaviorSubject} from 'rxjs';
import {EOWMap} from './eow-map';
import Feature from 'ol/Feature';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {writeAllEOWDataImageUrls} from './globals';
import {Injectable} from '@angular/core';
import {EowBaseService} from './eow-base-service';
import {Debug} from './debug';

const WFS_URL = 'https://geoservice.maris.nl/wms/project/eyeonwater_australia';
const title = 'eow_australia';
const LOG2 = Math.log2(2);

/**
 * This is for drawing the EOW Data on the map.
 */
@Injectable()
export class EowDataLayer extends EowBaseService {
  private _allDataSourceObs: BehaviorSubject<VectorSource> = new BehaviorSubject<VectorSource>(null);  // Observers that outside subscribers can use to know when data ready
  private _allDataSourceNumber = 0;
  private _dataLayerObs: BehaviorSubject<VectorLayer> = new BehaviorSubject<VectorLayer>(null);
  private _dataLayerNumber = 0;
  private styleCache = {};

  constructor(private eowMap: EOWMap) {
    super();
  }

  destroy() {
    super.destroy();
  }

  init() {
    const allDataSource = new VectorSource({
      format: new GeoJSON(),
      loader: (extent, resolution, projection) => {
        const proj = projection.getCode();
        const url = `${WFS_URL}?service=WFS&version=1.1.0&request=GetFeature&typename=${title}&` +
          `outputFormat=application/json&srsname=${proj}&bbox=${extent.join(',')},${proj}`;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        const onError = () => {
          allDataSource.removeLoadedExtent(extent);
        };
        xhr.onerror = onError;
        xhr.onload = () => {
          if (xhr.status === 200) {
            const features = allDataSource.getFormat().readFeatures(xhr.responseText, {
              dataProjection: proj,
              featureProjection: 'EPSG:4326'
            }) as Feature[];
            // debug (for Corp Affairs)
            if (writeAllEOWDataImageUrls) {
              console.log(`EOWData images (before): #${features.length}`);
              Debug.debugFeaturesByImages(features);
              features.sort((fa, fb) => (fa.getProperties().image - fb.getProperties().image)).forEach(f => console.log(f.getProperties().image));
              console.log(`EOWData images (after): #${features.length}`);
            }
            allDataSource.clear(true);
            allDataSource.addFeatures(features);
          } else {
            onError();
          }
        };
        xhr.send();
      },
      strategy: bboxStrategy
    });

    allDataSource.on('addfeature', (evt) => {
        if (this._allDataSourceNumber !== allDataSource.getFeatures().length) {
          this._allDataSourceNumber = allDataSource.getFeatures().length;
          this._allDataSourceObs.next(allDataSource);
        }
    });

    this.subscriptions.push(this.eowMap.getMap().subscribe(map => {
      const basicStyle = (feature, resolution) => {
        const fuValue = feature.get('fu_value');
        const styleKey = `${fuValue}_${resolution}`;
        // Avoid some unnecessary computation
        if (this.styleCache[styleKey]) {
          return this.styleCache[styleKey];
        }
        feature.set('visible', true);
        const styleOptions = {
          image: new CircleStyle({
            radius: map.getView().getZoom() * LOG2,
            stroke: new Stroke({
              color: 'white'
            }),
            fill: new Fill({
              color: colors[fuValue]
            })
          })
        };

        this.styleCache[styleKey] = new Style(styleOptions);
        return this.styleCache[styleKey];
      };
      const dataLayer = new VectorLayer({
        source: allDataSource,
        style: basicStyle
      });
      dataLayer.set('title', 'EOW Data');
      this._dataLayerObs.next(dataLayer);
      map.addLayer(dataLayer);
    }));

    this.setupEventHandlers();

    return this;
  }

  get allDataSourceObs() {
    return this._allDataSourceObs.asObservable();
  }

  get dataLayerObs() {
    return this._dataLayerObs.asObservable();
  }

  setupEventHandlers() {
  }
}
