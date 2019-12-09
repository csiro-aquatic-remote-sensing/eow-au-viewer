import LayerGeometries from './layers-geometries';
import {Feature, FeatureCollection, Point, Polygon} from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';

export default class GeometryOps {
  static calculateIntersections(eowDataGeometry: FeatureCollection<Point>, layerGeometries: LayerGeometries, layerName: string) {
    const layerGeometry: Feature<Polygon>[] = layerGeometries.getLayer(layerName);

    console.log(`%cGeometryOps / calculateIntersection for ${layerName}`, 'color:purple');
    layerGeometry.forEach(layerPolygon => {
      const intersection = pointsWithinPolygon(eowDataGeometry, layerPolygon);
      console.log(`%c  intersection: ${JSON.stringify(intersection)}`, 'color:orange');
    });
  }
}
