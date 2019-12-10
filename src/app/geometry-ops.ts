import LayerGeometries from './layers-geometries';
import {Feature, FeatureCollection, Point, Polygon} from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';
import {
  Brolog,
} from 'brolog';

const theClass = 'GeometryOps';

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

    Brolog.silly(theClass, `GeometryOps / calculateIntersection for ${layerName}`);
    layerGeometry.forEach(layerPolygon => {
      const intersection: FeatureCollection<Point> = pointsWithinPolygon(eowDataGeometry, layerPolygon) as FeatureCollection<Point>;
      Brolog.silly(theClass, `intersection: ${JSON.stringify(intersection, null, 2)}`);
      featureCollections.push(intersection);
    });
    return featureCollections;
  }
}
