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

  async createLayerFromGeoJSON(title, url, options: Options = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`createLayerFromWFSURL - Fetch Network response not ok for Name: "${title}", URL: ${url} - status: ${response.status}`);
        }
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
        this.log.verbose(`map.add layer "${title}" - there are now ${map.getLayers().getArray().length} layers`);
        newLayer.setVisible(options.hasOwnProperty('visible') ? options.visible : true);
        resolve(newLayer);
      });
    });
  }

  async createLayerFromWFS1(title, url, options: Options = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`createLayerFromWFSURL - Fetch Network response not ok for Name: "${title}", URL: ${url} - status: ${response.status}`);
        }
        const newLayer = new VectorLayer(Object.assign(options, {
          title,
          source: new VectorSource({
            url,
            format: new WFS()
            // projection: 'EPSG:4326'
          })
        }));
        newLayer.set('name', title);
        this.addLayer(newLayer, title);
        this.log.verbose(`map.add layer "${title}" - there are now ${map.getLayers().getArray().length} layers`);
        newLayer.setVisible(options.hasOwnProperty('visible') ? options.visible : true);
        resolve(newLayer);
      });
    });
  }

  async createLayerFromWFS2(title, url, options: Options = {}): Promise<any> {
    // from https://openlayers.org/en/latest/examples/vector-wfs-getfeature.html
    // featureNS: 'http://openstreemap.org',
    // featurePrefix: 'osm',
    // filter: andFilter(
    //   likeFilter('name', 'Mississippi*'),
    //   equalToFilter('waterway', 'riverbank')
    // )
    return new Promise((resolve, reject) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {
        // const responseCheck = await fetch(url);
        // if (!responseCheck.ok) {
        //   throw new Error(`createLayerFromWFSURL - Fetch Network response not ok for Name: "${title}", URL: ${url} - status: ${responseCheck.status}`);
        // }
        const vectorSource = new VectorSource({});
        const newLayer = new VectorLayer(Object.assign(options, {
          source: vectorSource
        }));
        const featureRequest = new WFS().writeGetFeature({
          srsName: 'EPSG:3857',
          featureTypes: [title],
          featureNS: 'http://www.opengis.net/wfs',
          featurePrefix: 'public',
          outputFormat: 'application/json',
          // bbox: map.getView().calculateExtent(map.getSize())
        });

// then post the request and add the received features to a layer
        console.log(`featureRequest: ${JSON.stringify(featureRequest)}`);
        fetch(url, {
          method: 'POST',
          body: new XMLSerializer().serializeToString(featureRequest)
        }).then((response) => {
          return response.json();
        }).then((json) => {
          const features = new GeoJSON().readFeatures(json);
          console.log(`features size: ${features.length}`)
          vectorSource.addFeatures(features);
          // map.getView().fit(vectorSource.getExtent());
        }).catch(error => {
          reject(`Unable to create layer 2: ${title} from ${url}`);
        });

        newLayer.set('name', title);
        this.addLayer(newLayer, title);
        this.log.verbose(`map.add layer "${title}" - there are now ${map.getLayers().getArray().length} layers`);
        newLayer.setVisible(options.hasOwnProperty('visible') ? options.visible : true);
        resolve(newLayer);
      });
    });
  }

  async createLayerFromWFS(title, url, featurePrefix, options: Options = {}): Promise<any> {
    // from https://openlayers.org/en/latest/examples/vector-wfs-getfeature.html
    // featureNS: 'http://openstreemap.org',
    // featurePrefix: 'osm',
    // filter: andFilter(
    //   likeFilter('name', 'Mississippi*'),
    //   equalToFilter('waterway', 'riverbank')
    // )
    return new Promise((resolve, reject) => {
      this.eowMap.mapObs.asObservable().subscribe(async map => {
        // const responseCheck = await fetch(url);
        // if (!responseCheck.ok) {
        //   throw new Error(`createLayerFromWFSURL - Fetch Network response not ok for Name: "${title}", URL: ${url} - status: ${responseCheck.status}`);
        // }
        const vectorSource = new VectorSource({
          format: new GeoJSON(),
          url: (extent) => {
            return `${url}?service=WFS&` +
              `version=1.1.0&request=GetFeature&typename=${featurePrefix}:${title}&` +
              'outputFormat=application/json&srsname=EPSG:3857&' +
              `bbox=${extent.join(',')},EPSG:3857`;
          },
          strategy: bboxStrategy
        });

        const newLayer = new VectorLayer(Object.assign(options, {
          source: vectorSource,
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(0, 64, 128, 1.0)',
              width: 2
            })
          })
        }));
//         const featureRequest = new WFS().writeGetFeature({
//           srsName: 'EPSG:3857',
//           featureTypes: [title],
//           featureNS: 'http://www.opengis.net/wfs',
//           featurePrefix: 'public',
//           outputFormat: 'application/json',
//           // bbox: map.getView().calculateExtent(map.getSize())
//         });
//
// // then post the request and add the received features to a layer
//         console.log(`featureRequest: ${JSON.stringify(featureRequest)}`);
//         fetch(url, {
//           method: 'POST',
//           body: new XMLSerializer().serializeToString(featureRequest)
//         }).then((response) => {
//           return response.json();
//         }).then((json) => {
//           const features = new GeoJSON().readFeatures(json);
//           console.log(`features size: ${features.length}`)
//           vectorSource.addFeatures(features);
//           // map.getView().fit(vectorSource.getExtent());
//         }).catch(error => {
//           reject(`Unable to create layer 2: ${title} from ${url}`);
//         });

        newLayer.set('name', title);
        this.addLayer(newLayer, title);
        this.log.verbose(`map.add layer "${title}" - there are now ${map.getLayers().getArray().length} layers`);
        newLayer.setVisible(options.hasOwnProperty('visible') ? options.visible : true);
        resolve(newLayer);
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
  async createLayerFromWFSFeatures(title, features: Feature[], options: Options = {}): Promise<any> {
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
          this.log.verbose(`Lines layer: ${name} - # lines added: ${features.length}`);
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
