import {Feature, FeatureCollection, Point} from '@turf/helpers';
import {featureEach, featureReduce} from '@turf/meta';
import clustersKmeans from '@turf/clusters-kmeans';

type Coords = [number, number];

export default class EOWDataPieChart {
  static plot0(eowDataInWaterbodies: FeatureCollection<Point>[]) {
    /*
      1. Loop through array
      2. If the FeatureCollection has property 'geometry'
      3. Gather all the geometries and perform KMeansClustering with cluster size of 1 to find the middle point
      4. Draw something at that point
     */
    for (const eowDatum of eowDataInWaterbodies) {
      // console.log(`%cEOWDatum: ${JSON.stringify(eowDatum)}`, 'color:red');
      const points: Coords[] = [];
      featureEach(eowDatum, (feature: Feature<Point>) => {
        if (feature.hasOwnProperty('geometry')) {
          // const points = featureReduce(feature, (prevValue: Feature<Point>[], point: Feature<Point>) => {
          //   prevValue.push(point);
          //   return prevValue;
          // }, []);
          // {
          //   numberOfClusters: 1;
          // }
          points.push(feature.geometry.coordinates as Coords);  //  getGeometry());
        }
      });
      if (points.length > 1) {
        console.log(`%cEOWDatum points: ${JSON.stringify(points)}`, 'color:red');
        const median = clustersKmeans(points, {numberOfClusters: 1});
        console.log(`%cMedian: ${JSON.stringify(median)}`, 'color:purple');
      }
    }
  }

  static plot(eowDataInWaterbodies: FeatureCollection<Point>[]) {
    /*
      1. Loop through array
      2. If the FeatureCollection has property 'geometry'
      3. Gather all the geometries and perform KMeansClustering with cluster size of 1 to find the middle point
      4. Draw something at that point
     */
    for (const eowDatum of eowDataInWaterbodies) {
      if (eowDatum.hasOwnProperty('features') && eowDatum.features.length > 0) {
        // console.log(`%cEOWDatum: ${JSON.stringify(eowDatum)}`, 'color:red');
        const median = clustersKmeans(eowDatum, {numberOfClusters: 1});
        console.log(`%cMedian: ${JSON.stringify(median)}`, 'color:purple');
      }
    }
  }
}
