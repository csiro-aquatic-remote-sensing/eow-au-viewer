import LayerGeometries from './layers-geometries';
import {Feature, FeatureCollection, Point, Polygon, point as turfPoint} from '@turf/helpers';
import centroid from '@turf/centroid';
import pointsWithinPolygon from '@turf/points-within-polygon';
import {
  Brolog,
} from 'brolog';

const theClass = 'GeometryOps';
type Coords = [number, number];

export interface Waterbody {
  polygon: FeatureCollection<Point>;
  name: string;
}

export interface EowWaterbodyIntersection {
  waterBody: Waterbody;
  eowData: any;  // TBD
}

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
   * @param layerName - name of layer with vectors (polygons) to peform intersection with.  It should be in layerGeometries
   * @return an array of objects, where the array is all waterbodies (polygons) that contain EOWData and each array item is an object
   *        containing:
   *          waterBody: {
   *            polygon: FeatureCollection<Point>s
   *            name: Waterbody name (TODO)
   *          },
   *          eowData: as returned by Maris (defined elsewhere)
   * If the waterbody has no EOWData that field will be null.
   */
  calculateLayerIntersections(eowDataGeometry: FeatureCollection<Point>, layerGeometries: LayerGeometries, layerName: string):
    EowWaterbodyIntersection[] {
    const layerGeometry: Feature<Polygon>[] = layerGeometries.getLayer(layerName);
    const eowWaterbodyIntersections: EowWaterbodyIntersection[] = [];

    this.log.verbose(theClass, `GeometryOps / calculateIntersection for "${layerName}"`);
    // layerGeometry.forEach(layerPolygon => {
    for (const layerPolygon of layerGeometry) {
      const intersection: FeatureCollection<Point> = pointsWithinPolygon(eowDataGeometry, layerPolygon) as FeatureCollection<Point>;
      this.log.silly(theClass, `intersection: ${JSON.stringify(intersection, null, 2)}`);
      eowWaterbodyIntersections.push(this.createEoWFormat(intersection));
    }
    return eowWaterbodyIntersections;
  }

  /**
   * Modify in to format as specified in calculateLayerIntersections().
   *
   * @param intersection - the data from the Turfjs pointsWithinPolygon()
   */
  private createEoWFormat(intersection: FeatureCollection<Point>): EowWaterbodyIntersection {
    const eowWaterbodyIntersection: EowWaterbodyIntersection = {
      waterBody: {
        polygon: intersection,
        name: 'TBD'
      },
      eowData: intersection.features[0].properties
    };
    intersection.features[0].properties = {'now in eowData field': true};
    return eowWaterbodyIntersection;
  }

  /**
   * I don't think the Turf version of centroid, or k-means-cluster (clusterSize=1), is correct.  Hence my own below.
   *
   * @param featurePoints that makes a polygon to get he centroid for
   */
  calculateCentroidTurfVer(featurePoints: FeatureCollection<Point>): Feature<Point> {
    return centroid(featurePoints);
  }

  /**
   * https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
   * @param featurePoints of points forming a polygon to return the centroid for
   */
  calculateCentroidFromFeatureCollection(featurePoints: FeatureCollection<Point>): Feature<Point> {
    this.log.verbose(`featurePoints: FeatureCollection<Point>: ${JSON.stringify(featurePoints)}`);
    const points = featurePoints.features.map(f => f.geometry.coordinates);
    return this.calculateCentroidFromPoints(points);
  }

  calculateCentroidFromPoints(points: number[][]) {
    this.log.verbose(`  points: ${JSON.stringify(points)}`);
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
      this.log.verbose(`iteration: ${i} - area: ${area}, cx: ${cx}, cy: ${cy}`);
    }
    area *= 1 / 2;
    cx = Math.round(cx / (6 * area));
    cy = Math.round(cy / (6 * area));
    this.log.verbose(`finished - area: ${area}, cx: ${cx}, cy: ${cy}`);
    return turfPoint([cx, cy]);
  }
}
