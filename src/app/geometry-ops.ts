import LayerGeometries from './layers-geometries';
import {
  Feature,
  FeatureCollection,
  Point,
  Polygon,
  point as turfPoint,
  featureCollection,
  featureCollection as turfFeatureCollection, Geometry
} from '@turf/helpers';
import centroid from '@turf/centroid';
import pointsWithinPolygon from '@turf/points-within-polygon';
import {Brolog} from 'brolog';
import {EowDataStruct, EowWaterBodyIntersection, PointsMap} from './eow-data-struct';

const theClass = 'GeometryOps';

export default class GeometryOps {
  constructor(private log: Brolog) {
  }

  /**
   * Calculate the intersection between the polygons from layerName and the EOW Data Points
   * @param eowDataGeometry - EOW Data Points object -
   *        { type: "FeatureCollection",
   *            features: [{
   *              geometry: {
   *                type: "Point",
   *                coordinates: [x,y]
   *                },
   *              properties: {
   *                  EOW Data properties
   *                }
   *            }
   *            ...
   *          ]
   *        }
   * @param errorMarginPoints - data struct of {
   *                              sourcePoint: Feature<Point> - original EOWData Points;
   *                              margins: FeatureCollection<Point> - circle of points around that point;
   *                            }
   *      This can be null to mean that no error margin is being  used
   * @param layerGeometries - all layers - object
   *        {
   *          layerFeatures: [{
   *            <layerName>: [
   *              {
   *                geometry: {
   *                   coordinates: [
   *                     [3+ points forming a polygon] # Yes an array with one item, an array of the points
   *                   ]
   *                }
   *              }
   *              ...
   *            ]
   *          }]
   *        }
   * @param layerName - name of layer with vectors (polygons) to perform intersection with.  It should be in layerGeometries
   * @param options - radius: number (metres) - if given then a ring of points at radius from given points in eowDataGeometry are used to determine
   * an intersection for the 'parent' point
   * @return an array of objects, where the array is all waterbodies (polygons) that contain EOWData and each array item is an object
   *        containing:
   *          waterBody: {
   *            polygon: FeatureCollection<Point>s
   *            name: Waterbody name (TODO)
   *          },
   *          eowData: The EOWData (as returned by Maris (defined elsewhere)) that are contained within the waterbody
   * If the waterBody has no intersection with the EOWData it will return:
   *          waterBody: null,
   *          eowData: null
   */
  async calculateLayerIntersections(eowDataGeometry: FeatureCollection<Point>, errorMarginPoints: FeatureCollection<Point>,
                                    allPointsMap: PointsMap, waterBodyLayerPolygons: FeatureCollection<Polygon>, layerName: string):
    Promise<EowWaterBodyIntersection[]> {
    return new Promise<EowWaterBodyIntersection[]>(resolve => {
      const layerGeometry: Feature<Polygon>[] = waterBodyLayerPolygons.features;
      const eowWaterBodyIntersections: EowWaterBodyIntersection[] = [];
      const pointsToUse = errorMarginPoints ? errorMarginPoints : eowDataGeometry;

      this.log.info(theClass, `GeometryOps / calculateIntersection for "${layerName}"`);
      const details = layerGeometry.length > 0 ? layerGeometry[0].geometry.coordinates[0][0] : 'no polygons';
      this.log.verbose(theClass, `layerPolygons - there are: ${layerGeometry.length} - coords of first is: ${details}`);
      for (const layerPolygon of layerGeometry) {
        const intersection: FeatureCollection<Point> = pointsWithinPolygon(pointsToUse, layerPolygon) as FeatureCollection<Point>;
        // TODO - now build a FeatureCollection<Point> from allPointsMapObs
        const intersectionSourcePoints = this.filterSourcePoints(intersection, allPointsMap);
        eowWaterBodyIntersections.push(EowDataStruct.createEoWFormat(intersectionSourcePoints, layerPolygon));
      }
      this.log.silly(theClass, `intersections: ${JSON.stringify(eowWaterBodyIntersections, null, 2)}`);
      resolve(eowWaterBodyIntersections);
    });
  }

  // Mainly for debug purposes so I can see something happening!  I don't think the EOW Data is intersecting the polygons and want to know more.
  async convertLayerToDataFormat(layerGeometries: LayerGeometries, layerName: string):
    Promise<EowWaterBodyIntersection[]> {
    return new Promise<EowWaterBodyIntersection[]>(resolve => {
      const layerGeometry: Feature<Polygon>[] = layerGeometries.getLayer(layerName);
      const eowWaterBodyPoints: EowWaterBodyIntersection[] = [];

      this.log.verbose(theClass, `GeometryOps / calculateIntersection for "${layerName}"`);
      for (const layerPolygon of layerGeometry) {
        const thePoints: Feature<Point>[] = layerPolygon.geometry.coordinates[0].map(c => turfPoint(c));
        const theFeatureCollection = featureCollection(thePoints);
        eowWaterBodyPoints.push(EowDataStruct.createEoWFormat(theFeatureCollection, layerPolygon));
      }
      this.log.silly(theClass, `convertLayerToDataForamt: ${JSON.stringify(eowWaterBodyPoints, null, 2)}`);
      resolve(eowWaterBodyPoints);
    });
  }


  /**
   * I don't think the Turf version of centroid, or k-means-cluster (clusterSize=1), is correct.  Hence my own below.
   *
   * @param featurePoints that makes a polygon to get he centroid for
   */
  calculateCentroidTurfVer(featurePoints: FeatureCollection<Point>): Feature<Point> {
    return centroid(featurePoints);
  }

  calculateCentroidTurfVerUsingPoints(points: number[][]): Feature<Point> {
    const featurePoints = turfFeatureCollection(points.map(c => turfPoint(c)));
    return centroid(featurePoints);
  }

  /**
   * https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
   * @param featurePoints of points forming a polygon to return the centroid for
   */
  calculateCentroidFromFeatureCollection(featurePoints: FeatureCollection<Point>): Feature<Point> {
    this.log.silly(`calculateCentroidFromFeatureCollection - featurePoints: FeatureCollection<Point>: ${JSON.stringify(featurePoints)}`);
    const points = featurePoints.features.map(f => f.geometry.coordinates);
    return this.calculateCentroidFromPoints(points);
  }

  calculateCentroidFromPoints(points: number[][]): Feature<Point> {
    this.log.verbose('calculateCentroidFromPoints', `  points: ${JSON.stringify(points)}`);
    return this.calculateCentroidTurfVerUsingPoints(points);

    // I'm happy to let my code go and use the library version for now

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
      this.log.silly('calculateCentroidFromPoints', `iteration: ${i} - area: ${area}, cx: ${cx}, cy: ${cy}`);
    }
    area *= 1 / 2;
    cx = Math.round(cx / (6 * area));
    cy = Math.round(cy / (6 * area));
    this.log.verbose('calculateCentroidFromPoints', `finished - area: ${area}, (centroid) cx: ${cx}, cy: ${cy}`);
    return turfPoint([cx, cy]);
  }


  private appendFeatureFeatureCollection(f1: FeatureCollection<Point>, f2: Feature<Point>): FeatureCollection<Point> {
    if (f1) {
      if (f2) {
        f1.features.push(f2);
      }
    } else {
      throw new Error(`Can't append to a null FeatureCollection`);
    }
    return f1;
  }


  private filterSourcePoints(allPointsIntersection: FeatureCollection<Point>, allPointsMap: PointsMap): FeatureCollection<Point> {
    const filteredPoints: FeatureCollection<Point> = {
      features: [],  // Array<Feature<Point, Properties>>,
      type: 'FeatureCollection'
    };
    const pointsAlreadyFiltered: PointsMap = {};
    allPointsIntersection.features.forEach(api => {
      const coords = api.geometry.coordinates;
      const pointString = EowDataStruct.createPointMapString(turfPoint(api.geometry.coordinates));
      if (allPointsMap.hasOwnProperty(pointString) && !pointsAlreadyFiltered.hasOwnProperty(pointString)) {
        pointsAlreadyFiltered[pointString] = null;
        filteredPoints.features.push(allPointsMap[pointString]);
      }
    });
    return filteredPoints;
  }
}
