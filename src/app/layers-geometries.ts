import GeoJSON from 'ol/format/GeoJSON';
import {Feature as GeoJsonFeature} from 'ol/format/GeoJSON';
import {Feature, lineString, LineString, multiLineString, Polygon, polygon} from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the Geometries of the layers that define water bodies.
 */

export default class LayerGeometries {
  layerFeatures: { [name: string]: Feature<Polygon>[] } = {};  // Each Layer passed to createGeometry() has multiple polygons

  constructor() {
  }

  async init() {
    await this.createGeometry('Waterbodies shape', '../assets/waterbodies/Australia/aus25wgd_l.geojson');
    await this.createGeometry('Waterbodies fill', '../assets/waterbodies/Australia/aus25wgd_r.geojson');
    await this.createGeometry('Waterbodies name', '../assets/waterbodies/Australia/aus25wgd_p.geojson');

    // new data but that only covers ACT + ~ 100kms square
    await this.createGeometry('i5516 flats', '../assets/waterbodies/Canberra/i5516_flats.geojson');
    await this.createGeometry('i5516 pondages', '../assets/waterbodies/Canberra/i5516_pondageareas.geojson');
    await this.createGeometry('i5516 waterCourseLines', '../assets/waterbodies/Canberra/i5516_watercourselines.geojson');
    await this.createGeometry('i5516 waterCourseAreas', '../assets/waterbodies/Canberra/i5516_watercourseareas.geojson');
    await this.createGeometry('i5516 lakes', '../assets/waterbodies/Canberra/i5516_waterholes.geojson');
    await this.createGeometry('i5516 reservoirs', '../assets/waterbodies/Canberra/i5516_reservoirs.geojson');

    console.log(`Layer geometries: ${Object.keys(this.layerFeatures)}`);
  }

  async createGeometry(name, layerUrl) {
    let features: any;
    let json: any;
    console.log(`%cCreateGeomety - name: ${name}`, 'font-weight: bold');
    try {
      const response = await fetch(layerUrl);
      if (!response.ok) {
        throw new Error(`Fetch Network response not ok for Name: "${name}", URL: ${layerUrl}`);
      }
      json = await response.json();
    } catch (error) {
      console.error(`Fetch Network error - ${error}`);
    }

    try {
      const format = new GeoJSON();
      features = format.readFeatures(json, {featureProjection: 'EPSG:3857'});
      if (! features) {
        return;
      }

      this.layerFeatures[this.mapNames(name)] = [];
      features.forEach(feature => {
        console.log(`%c  feature: ${feature.getGeometry().getType()}`, 'font-weight: bold; color: green');
        switch (feature.getGeometry().getType().toLowerCase()) {
          case  'linestring':
            this.convertLineString(this.layerFeatures[this.mapNames(name)], feature);
            break;
          case 'multilinestring':
            this.convertMultiLineString(this.layerFeatures[this.mapNames(name)], feature);
            break;
          case 'polygon':
            this.convertPolygon(this.layerFeatures[this.mapNames(name)], feature);
            break;
          case 'point':
            // ignore points
            break;
          default:
            throw new Error(`Unhandled type: ${feature.getGeometry().getType()}`);
        }
      });
      console.log(`LayerGeometries add new item at '${this.mapNames(name)}`);
    } catch (error) {
      console.error(`Turf Error - ${error}`);
    }
  }

  private convertLineString(dataDestination, feature: GeoJsonFeature) {
    const data = feature.getGeometry().getCoordinates();
    // The difference between lineString and Polygon is that a Polygon is explicitly closed (ie. the first and last coords are same) ???
    const turfLine = lineString(data);
    if (turfLine.geometry.coordinates.length >= 3) {
      const polygonObj = lineToPolygon(turfLine);
      dataDestination.push(polygonObj);
    } else {
      console.warn(`Turfline has < 3 coords: ${turfLine.geometry.coordinates.length} - `
        + `${JSON.stringify(turfLine.geometry.coordinates)}`);
    }
  }

  private convertMultiLineString(dataDestination, feature: GeoJsonFeature) {
    const data = feature.getGeometry().getCoordinates();
    const turfLine = multiLineString(data);
    const polygonObj = lineToPolygon(turfLine);
    dataDestination.push(polygonObj);
  }

  private convertPolygon(dataDestination, feature: GeoJsonFeature) {
    const data = feature.getGeometry().getCoordinates();
    const polygonObj = polygon(data);
    dataDestination.push(polygonObj);
  }

  private mapNames(name: string): string {
    return name.replace(/\s+/, '_');
  }

  getLayer(name: string): any {
    const newName = this.mapNames(name);

    if (this.layerFeatures.hasOwnProperty(newName)) {
      return this.layerFeatures[newName];
    } else {
      throw new Error(`Requested layer doesnt exist: "${name}"`);
    }
  }
}
