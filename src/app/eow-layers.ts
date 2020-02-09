import {
  Brolog,
} from 'brolog';
import {fillStyle, iconStyle, Layers} from './layers';

const theClass = 'Layers';

export class EowLayers {
  constructor(private layers: Layers, private log: Brolog) {
  }

  async init() {
    await this.addLayers();

    return this;
  }

  async addLayers() {
    await this.addShapeFiles();
    this.addGADEAWOFS();
  }

  private async addShapeFiles() {
    const layerPromises = [];
    layerPromises.push(this.layers.createLayerFromWFSURL('Waterbodies shape', 'assets/waterbodies/Australia/aus25wgd_l.geojson'));
    layerPromises.push(this.layers.createLayerFromWFSURL('Waterbodies fill', 'assets/waterbodies/Australia/aus25wgd_r.geojson', {style: fillStyle}));
    layerPromises.push(this.layers.createLayerFromWFSURL('Waterbodies name', 'assets/waterbodies/Australia/aus25wgd_p.geojson', {style: iconStyle, minZoom: 8}));

    // new data but that only covers ACT + ~ 100kms square
    layerPromises.push(this.layers.createLayerFromWFSURL('i5516 flats', 'assets/waterbodies/Canberra/i5516_flats.geojson'));
    layerPromises.push(this.layers.createLayerFromWFSURL('i5516 pondages', 'assets/waterbodies/Canberra/i5516_pondageareas.geojson'));
    layerPromises.push(this.layers.createLayerFromWFSURL('i5516 waterCourseLines', 'assets/waterbodies/Canberra/i5516_watercourselines.geojson', {visible: false}));
    layerPromises.push(this.layers.createLayerFromWFSURL('i5516 waterCourseAreas', 'assets/waterbodies/Canberra/i5516_watercourseareas.geojson'));
    layerPromises.push(this.layers.createLayerFromWFSURL('i5516 lakes', 'assets/waterbodies/Canberra/i5516_waterholes.geojson'));
    layerPromises.push(this.layers.createLayerFromWFSURL('i5516 reservoirs', 'assets/waterbodies/Canberra/i5516_reservoirs.geojson'));

    return Promise.all(layerPromises);
  }

  // Water Observations from Space 25m Filtered Summary (WOfS Filtered Statistics)
  // http://terria-cube.terria.io/ > Add data > DEA Production > Water Observations from Space > All time summaries
  // Discussed problem with rendering from DEA server with OpenDataCube slack group and worked out a solution.
  // Feedback also was that https://ows.services.dea.ga.gov.au has caching but https://ows.dea.ga.gov.au doesn't.  Use the later.
  private addGADEAWOFS() { // map: Map) {
    this.layers.createLayerFromWMSURL('WOFS', 'https://ows.dea.ga.gov.au', {params: {
        LAYERS: 'wofs_filtered_summary',
        TILED: true
      }});
  }
}
