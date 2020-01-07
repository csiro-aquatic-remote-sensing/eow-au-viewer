import {Feature, FeatureCollection, Point} from '@turf/helpers';
import {featureEach, featureReduce} from '@turf/meta';
import clustersKmeans from '@turf/clusters-kmeans';
import Brolog from 'brolog';
import GeometryOps, {EowWaterbodyIntersection} from './geometry-ops';

type Coords = [number, number];

export default class EOWDataPieChart {
  log: Brolog;
  geometryOps: GeometryOps;

  constructor(geometryOps: GeometryOps, log: Brolog) {
    this.geometryOps = geometryOps;
    this.log = log;
  }

  /**
   * Perform some action on the EOW Data in waterbodies.  By default it is to draw a Pie Graph at the centroid of the polygon that
   * represents the water body.  The Pie chart is the FU values in that water body.
   * @param eowDataInWaterbodies - Polygons of waterbodies that contain EOW Points data
   */
  plot(eowDataInWaterbodies: EowWaterbodyIntersection[]) { // FeatureCollection<Point>[]) {
    /*
      1. Loop through array of Waterbody polygons
      2. If the FeatureCollection has property 'geometry'
      3. Get the centroid of the polygon
      4. Draw something at that point
     */
    for (const eowWaterbodyIntersection of eowDataInWaterbodies) {
      // These eowWaterbodyIntersection are between the EOW Data Points and the polygons in the chosen layer (selected outside of here with
      //  the result being passed in as EowWaterbodyIntersection[].
      // Each Object is:
      //  waterBody: <the polygon that represents the waterbody>
      //  eowData: <the EOW Data points within that waterbody>
      //
      // If there is no EOWData within the waterbody, both fields will be null

      const points: Coords[] = [];
      if (eowWaterbodyIntersection.waterBody) {
        featureEach(eowWaterbodyIntersection.waterBody.polygon, (feature: Feature<Point>) => {
          if (feature.hasOwnProperty('geometry')) {
            points.push(feature.geometry.coordinates as Coords);
          }
        });
        if (points.length > 1) {
          this.log.verbose('EOWDataPieChart.plot', `EOWDatum points: ${JSON.stringify(points)}`);
          const median = this.geometryOps.calculateCentroidFromPoints(points);
          this.log.verbose('EOWDataPieChart.plot', `Median: ${JSON.stringify(median)}`);
        }
      }
    }
  }
}
