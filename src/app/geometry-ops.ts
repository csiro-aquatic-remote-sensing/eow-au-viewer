import LayerGeometries from './layers-geometries';
import {Feature, FeatureCollection, Point, Polygon} from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';
import {
  Brolog,
} from 'brolog';

const theClass = 'GeometryOps';

export default class GeometryOps {
  static calculateIntersections(eowDataGeometry: FeatureCollection<Point>, layerGeometries: LayerGeometries, layerName: string) {
    const layerGeometry: Feature<Polygon>[] = layerGeometries.getLayer(layerName);

    Brolog.verbose(theClass, `GeometryOps / calculateIntersection for ${layerName}`);
    layerGeometry.forEach(layerPolygon => {
      const intersection = pointsWithinPolygon(eowDataGeometry, layerPolygon);
      Brolog.verbose(theClass, `intersection: ${JSON.stringify(intersection)}`);
    });
  }
}
