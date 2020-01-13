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

const theClass = 'Layers';

export class Layers {
  constructor(private htmlDocument: Document, private http: HttpClient, private log: Brolog) {
  }

  init(eowMap: EOWMap) {
    eowMap.mapObs.asObservable().subscribe(async map => {
      await this.addLayers(map);
    });

    return this;
  }

  async addLayers(map: Map) {
    await this.addShapeFiles(map);
    this.addGADEAWOFS(map);
    this.setupLayerSelectionMenu(map);
  }

  private async addShapeFiles(map: Map) {
    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 46],
        anchorXUnits: IconAnchorUnits.FRACTION,
        anchorYUnits: IconAnchorUnits.PIXELS,
        opacity: 0.75,
        scale: 0.02,
        src: '../assets/icon.png'
      })
    });
    const fillStyle = new Style({
      fill: new Fill({color: 'rgba(224, 255, 255, 0.33)'})
    });

    interface Options {
      style?: any;
      minZoom?: number;
      visible?: boolean;
    }

    const createLayer = async (title, url, options: Options = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
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
          map.addLayer(newLayer);
          this.log.verbose(`map.add layer "${title} - there are now ${map.getLayers().getArray().length} layers`);
          newLayer.setVisible(options.hasOwnProperty('visible') ? options.visible : true);
          resolve(newLayer);
        }).catch(e => {
          // reject() this?
          this.log.warn(theClass, `URL DOES NOT EXIST: ${url}`);
        });
      });
    };

    const layerPromises = [];
    layerPromises.push(createLayer('Waterbodies shape', '../assets/waterbodies/Australia/aus25wgd_l.geojson'));
    layerPromises.push(createLayer('Waterbodies fill', '../assets/waterbodies/Australia/aus25wgd_r.geojson', {style: fillStyle}));
    layerPromises.push(createLayer('Waterbodies name', '../assets/waterbodies/Australia/aus25wgd_p.geojson', {style: iconStyle, minZoom: 8}));

    // new data but that only covers ACT + ~ 100kms square
    layerPromises.push(createLayer('i5516 flats', '../assets/waterbodies/Canberra/i5516_flats.geojson'));
    layerPromises.push(createLayer('i5516 pondages', '../assets/waterbodies/Canberra/i5516_pondageareas.geojson'));
    layerPromises.push(createLayer('i5516 waterCourseLines', '../assets/waterbodies/Canberra/i5516_watercourselines.geojson', {visible: false}));
    layerPromises.push(createLayer('i5516 waterCourseAreas', '../assets/waterbodies/Canberra/i5516_watercourseareas.geojson'));
    layerPromises.push(createLayer('i5516 lakes', '../assets/waterbodies/Canberra/i5516_waterholes.geojson'));
    layerPromises.push(createLayer('i5516 reservoirs', '../assets/waterbodies/Canberra/i5516_reservoirs.geojson'));

    return Promise.all(layerPromises);

    // I tried this but i neeed help with ArcGIS server
    /*import TileArcGISRest from 'ol/source/TileArcGISRest';
      const layer = new TileLayer({
      opacity: 0.6,
      source: new TileArcGISRest({
        url: 'http://services.ga.gov.au/gis/rest/services/NM_Hydrology_and_Marine_Points/MapServer',
        params: {
          LAYERS: 'Bores',
          TILED: true
        },
        extent: [ -5687813.782846, 12530995.153909, -15894844.529378, 3585760.291316 ] // -13884991, -7455066, 2870341, 6338219]
      })
    });
    layer.set('name', 'Bores');  // 25m Filtered Summary (WOfS Filtered Statistics)');
    map.addLayer(layer);
    layer.setVisible(true);*/
  }

  // Water Observations from Space 25m Filtered Summary (WOfS Filtered Statistics)
  // http://terria-cube.terria.io/ > Add data > DEA Production > Water Observations from Space > All time summaries
  // Discussed problem with rendering from DEA server with OpenDataCube slack group and worked out a solution.
  // Feedback also was that https://ows.services.dea.ga.gov.au has caching but https://ows.dea.ga.gov.au doesn't.  Use the later.
  private addGADEAWOFS(map: Map) {
    const wofsWMS = new TileLayer({
      opacity: 0.6,
      source: new TileWMS({
        url: 'https://ows.dea.ga.gov.au',
        params: {
          LAYERS: 'wofs_filtered_summary',
          TILED: true
        },
        // extent: [-5687813.782846, 12530995.153909, -15894844.529378, 3585760.291316] // -13884991, -7455066, 2870341, 6338219]
      })
    });
    wofsWMS.set('name', 'Water Observations from Space');  // 25m Filtered Summary (WOfS Filtered Statistics)');
    map.addLayer(wofsWMS);
    wofsWMS.setVisible(true);
  }

  private setupLayerSelectionMenu(map: Map) {
    const generateCheckbox = (idCheckbox, labelName, htmlElement) => {
      const checkbox = this.htmlDocument.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = idCheckbox;
      const label = this.htmlDocument.createElement('label');
      label.htmlFor = idCheckbox;
      label.appendChild(this.htmlDocument.createTextNode(labelName));
      htmlElement.appendChild(checkbox);
      htmlElement.appendChild(label);
      return checkbox;
    };

    const layers = map.getLayers().getArray();
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const layerId = 'layer_id_' + layers[i].get('id');
      const name = layers[i].get('name');
      const checkbox = generateCheckbox(i, name, this.htmlDocument.querySelector('.layersSwitch'));

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
}
