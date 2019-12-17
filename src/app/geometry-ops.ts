import LayerGeometries from './layers-geometries';
import {Feature, FeatureCollection, Point, Polygon, point as turfPoint} from '@turf/helpers';
import centroid from '@turf/centroid';
import pointsWithinPolygon from '@turf/points-within-polygon';
import {
  Brolog,
} from 'brolog';

const theClass = 'GeometryOps';
type Coords = [number, number];

export default class GeometryOps {
  /**
   * Calculate the intersection between the polygons from layerName and the EOW Data Points
   * @param eowDataGeometry - EOW Data Points
   * @param layerGeometries - all layers
   * @param layerName - name of layer with vectors (polygons) to peform intersection with
   * @return an array of Turf.js FeatureCollection<Point>s, where the FeatureCollection is a collection of Feature<Point>s where each
   * Point is EOW Data and the collection is all the data that sits within the same waterbody (TBD - within the same polygon at least).
   * The array is all the interesections for all the water bodies (ie. Polygons) in the layer.
   * There may be no EOW Data within a water body, in which case the FeatureCollection<Point> data object will be:
   * {
   *    "type": "FeatureCollection",
   *    "features": []
   * }
   *
   * If there is EOW Data then the data object (each Feature<Point> within the FeatureCollection<Point>) will be something like:
   * {
   *       "type": "Feature",
   *       "properties": {
   *         <Eye On Water data>
   *       },
   *       "geometry": {
   *         "type": "Point",
   *         "coordinates": [
   *           16602522.815381201,
   *           -4204738.690739388
   *         ]
   * }
   */
  static calculateIntersections(eowDataGeometry: FeatureCollection<Point>, layerGeometries: LayerGeometries, layerName: string):
    FeatureCollection<Point>[] {
    const layerGeometry: Feature<Polygon>[] = layerGeometries.getLayer(layerName);
    const featureCollections: FeatureCollection<Point>[] = [];

    Brolog.verbose(theClass, `GeometryOps / calculateIntersection for ${layerName}`);
    // layerGeometry.forEach(layerPolygon => {
    for (const layerPolygon of layerGeometry) {
      const intersection: FeatureCollection<Point> = pointsWithinPolygon(eowDataGeometry, layerPolygon) as FeatureCollection<Point>;
      Brolog.silly(theClass, `intersection: ${JSON.stringify(intersection, null, 2)}`);
      featureCollections.push(intersection);
    }
    return featureCollections;
  }

  /**
   * I don't think the Turf version of centroid, or k-means-cluster (clusterSize=1), is correct.  Hence my own below.
   *
   * @param featurePoints that makes a polygon to get he centroid for
   */
  static calculateCentroidTurfVer(featurePoints: FeatureCollection<Point>): Feature<Point> {
    return centroid(featurePoints);
  }

  /**
   * https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
   * @param featurePoints of points forming a polygon to return the centroid for
   */
  static calculateCentroidFromFeatureCollection(featurePoints: FeatureCollection<Point>): Feature<Point> {
    Brolog.verbose(`featurePoints: FeatureCollection<Point>: ${JSON.stringify(featurePoints)}`);
    const points = featurePoints.features.map(f => f.geometry.coordinates);
    return GeometryOps.calculateCentroidFromPoints(points);
  }

  static calculateCentroidFromPoints(points: number[][]) {
    Brolog.verbose(`  points: ${JSON.stringify(points)}`);
    // let i = 0;
    let area = 0;
    let cx = 0;
    let cy = 0;
    // Although the input is meant to be a polygon (3+ points), error handle to return correct values for points and lines
    if (points.length === 1) {
      return turfPoint(points[0]);
    }
    if (points.length === 2) {
      return turfPoint([(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2]);
    }
    for (let i = 0; i < points.length; ++i) {
      const iP1 = (i + 1) % points.length;
      const xI = points[i][0];
      const xIp1 = points[iP1][0];
      const yI = points[i][1];
      const yIp1 = points[iP1][1];
      const currentArea = xI * yIp1 - xIp1 * yI;
      area += currentArea;
      cx += (xI + xIp1) * currentArea;
      cy += (yI + yIp1) * currentArea;
      Brolog.verbose(`iteration: ${i} - area: ${area}, cx: ${cx}, cy: ${cy}`);
    }
    area *= 1 / 2;
    cx = Math.round(cx / (6 * area));
    cy = Math.round(cy / (6 * area));
    Brolog.verbose(`finished - area: ${area}, cx: ${cx}, cy: ${cy}`);
    return turfPoint([cx, cy]);
  }
}
