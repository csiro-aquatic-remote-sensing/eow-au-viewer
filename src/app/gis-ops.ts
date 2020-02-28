import Feature from 'ol/Feature';
import {
  featureCollection as turfFeatureCollection,
  FeatureCollection,
  lineString,
  multiLineString,
  multiPolygon,
  polygon,
  Polygon
} from '@turf/helpers';
import {Feature as turfFeature} from '@turf/helpers/lib/geojson';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import lineToPolygon from '@turf/line-to-polygon';
import {brologLevel} from './globals';
import Brolog from 'brolog';

const theClass = 'GisOps';
const log = Brolog.instance(brologLevel);

export class GisOps {
  public static createFeatureCollection(features: Feature[]): FeatureCollection<Polygon> {
    const theTurfFeatures: turfFeature<Polygon>[] = GisOps.createFeatures(features);
    const featureCollection: FeatureCollection<Polygon> = turfFeatureCollection<Polygon>(theTurfFeatures);
    return featureCollection;
  }

  public static createFeatures(features: Feature[]): turfFeature<Polygon>[] {
    const theTurfFeatures: turfFeature<Polygon>[] = [];

    features.forEach(feature => {
      const simpleGeometry = feature.getGeometry() as SimpleGeometry;
      switch (feature.getGeometry().getType().toLowerCase()) {
        case  'linestring':
          this.convertLineString(theTurfFeatures, simpleGeometry);
          break;
        case 'multilinestring':
          this.convertMultiLineString(theTurfFeatures, simpleGeometry);
          break;
        case 'polygon':
          this.convertPolygon(theTurfFeatures, simpleGeometry);
          break;
        case 'multipolygon':
          this.convertMultiPolygon(theTurfFeatures, simpleGeometry);
          break;
        case 'point':
          // ignore points
          break;
        default:
          throw new Error(`Unhandled type: ${feature.getGeometry().getType()}`);
      }
    });
    return theTurfFeatures;
  }

  private static convertLineString(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    // The difference between lineString and Polygon is that a Polygon is explicitly closed (ie. the first and last coords are same) ???
    const turfLine = lineString(coordinates);
    if (turfLine.geometry.coordinates.length >= 3) {
      const polygonObj = lineToPolygon(turfLine);
      dataDestination.push(polygonObj);
    } else {
      log.verbose(theClass, `Turfline has < 3 coords: ${turfLine.geometry.coordinates.length} - `
        + `${JSON.stringify(turfLine.geometry.coordinates)}`);
    }
  }

  private static convertMultiLineString(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const turfLine = multiLineString(coordinates.filter(c => c.length > 2));
    turfLine.geometry.coordinates.forEach(c => {
      log.silly(theClass, `convertMultilineString - size of arrays: ${c.length} -> ${JSON.stringify(c)}`);
    });
    const polygonObj = lineToPolygon(turfLine);
    dataDestination.push(polygonObj);
  }

  private static convertPolygon(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const polygonObj = polygon(coordinates);
    dataDestination.push(polygonObj);
  }

  private static convertMultiPolygon(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const multiPolygon1 = multiPolygon(coordinates);
    dataDestination.push(multiPolygon1);
  }
}
