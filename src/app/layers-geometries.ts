import {Feature as turfFeature, lineString, LineString, multiLineString, Polygon, polygon, multiPolygon} from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';
import GeoJSONFeature from 'ol/format/Feature';
import OLGeoJson from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';

import {
  Brolog,
} from 'brolog';
import {FeatureLike} from 'ol/Feature';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

const theClass = 'LayerGeometries';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the Geometries of the layers that define water bodies.
 */

export default class LayerGeometries {
  layerFeatures: { [name: string]: turfFeature<Polygon>[] } = {};  // Each Layer passed to createGeometry() has multiple polygons

  constructor(private log: Brolog) {
  }

  async init() {
    // TODO this is a reuse of the layer data - combine in to one use
    await this.createGeometry('Waterbodies shape', 'assets/waterbodies/Australia/aus25wgd_l.geojson');
    await this.createGeometry('Waterbodies fill', 'assets/waterbodies/Australia/aus25wgd_r.geojson');
    await this.createGeometry('Waterbodies name', 'assets/waterbodies/Australia/aus25wgd_p.geojson');

    // new data but that only covers ACT + ~ 100kms square
    await this.createGeometry('i5516 flats', 'assets/waterbodies/Canberra/i5516_flats.geojson');
    await this.createGeometry('i5516 pondages', 'assets/waterbodies/Canberra/i5516_pondageareas.geojson');
    await this.createGeometry('i5516 waterCourseLines', 'assets/waterbodies/Canberra/i5516_watercourselines.geojson');
    await this.createGeometry('i5516 waterCourseAreas', 'assets/waterbodies/Canberra/i5516_watercourseareas.geojson');
    await this.createGeometry('i5516 lakes', 'assets/waterbodies/Canberra/i5516_waterholes.geojson');
    await this.createGeometry('i5516 reservoirs', 'assets/waterbodies/Canberra/i5516_reservoirs.geojson');

    this.log.verbose(theClass, `Layer geometries: ${Object.keys(this.layerFeatures)}`);
  }

  async createGeometry(name, layerUrl) {
    let json: any;
    this.log.verbose(theClass, `CreateGeomety - name: ${name}`);
    try {
      const response = await fetch(layerUrl);
      if (!response.ok) {
        throw new Error(`Fetch Network response not ok for Name: "${name}", URL: ${layerUrl}`);
      }
      json = await response.json();
    } catch (error) {
      this.log.error(theClass, `Fetch Network error - ${error}`);
    }

    try {
      const format = new OLGeoJson();
      const geoJSONFeatures = format.readFeatures(json, {featureProjection: 'EPSG:3857'});
      if (! geoJSONFeatures) {
        return;
      }

      this.layerFeatures[this.mapNames(name)] = [];
      geoJSONFeatures.forEach(feature => {
        this.log.verbose(theClass, `feature: ${feature.getGeometry().getType()}`);
        const simpleGeometry = feature.getGeometry() as SimpleGeometry;
        switch (feature.getGeometry().getType().toLowerCase()) {
          case  'linestring':
            this.convertLineString(this.layerFeatures[this.mapNames(name)], simpleGeometry);
            break;
          case 'multilinestring':
            this.convertMultiLineString(this.layerFeatures[this.mapNames(name)], simpleGeometry);
            break;
          case 'polygon':
            this.convertPolygon(this.layerFeatures[this.mapNames(name)], simpleGeometry);
            break;
          case 'multipolygon':
            this.convertMultiPolygon(this.layerFeatures[this.mapNames(name)], simpleGeometry);
            break;
          case 'point':
            // ignore points
            break;
          default:
            throw new Error(`Unhandled type: ${feature.getGeometry().getType()}`);
        }
      });
      this.log.verbose(theClass, `LayerGeometries add new item at '${this.mapNames(name)}`);
    } catch (error) {
      this.log.error(theClass, `Turf Error - ${error}`);
    }
  }

  private convertLineString(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    // The difference between lineString and Polygon is that a Polygon is explicitly closed (ie. the first and last coords are same) ???
    const turfLine = lineString(coordinates);
    if (turfLine.geometry.coordinates.length >= 3) {
      const polygonObj = lineToPolygon(turfLine);
      dataDestination.push(polygonObj);
    } else {
      this.log.verbose(theClass, `Turfline has < 3 coords: ${turfLine.geometry.coordinates.length} - `
        + `${JSON.stringify(turfLine.geometry.coordinates)}`);
    }
  }

  private convertMultiLineString(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const turfLine = multiLineString(coordinates.filter(c => c.length > 2));
    turfLine.geometry.coordinates.forEach(c => {
      this.log.silly(theClass, `convertMultilineString - size of arrays: ${c.length} -> ${JSON.stringify(c)}`);
    });
    const polygonObj = lineToPolygon(turfLine);
    dataDestination.push(polygonObj);
  }

  private convertPolygon(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const polygonObj = polygon(coordinates);
    dataDestination.push(polygonObj);
  }

  private convertMultiPolygon(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const multiPolygon1 = multiPolygon(coordinates);
    dataDestination.push(multiPolygon1);
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
