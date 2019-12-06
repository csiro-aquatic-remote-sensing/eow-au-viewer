import LayerGeometries from './layers-geometries';

// declare var jsts: any;  // https://github.com/bjornharrtell/jsts

export default class GeometryOps {
  static calculateIntersections(eowDataGeometry: any, layerGeometries: LayerGeometries, layerName: string) {
    const layerGeometry = layerGeometries.getLayer(layerName);

    const intersection = layerGeometry.intersection(eowDataGeometry);

    console.log(`GeometryOps - intersection: ${intersection}`);
  }
}
