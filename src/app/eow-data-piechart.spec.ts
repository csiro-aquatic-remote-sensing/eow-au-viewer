import {point as turfPoint, Point, feature as turfFeature, featureCollection as turfFeatureCollection} from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import * as chai from 'chai';
import GeometryOps from './geometry-ops';

const expect = chai.expect;

describe('eow-data-piechart', () => {
  /**
   * Used http://eguruchela.com/math/Calculator/polygon-centroid-point to calculate centroid
   * to determine the values for more complex polygons (hand verified also)
   */
  describe('centroid', () => {
    it('centroid of only 1 point is the point itself', () => {
      const coordinate = [-1000, 1000];
      const point = turfFeatureCollection([turfPoint(coordinate)]);
      const value = EOWDataPieChart.findCentroid([point]);
      const centroid = value.features[0].properties.centroid;
      expect(centroid[0]).to.equal(coordinate[0]);
      expect(centroid[1]).to.equal(coordinate[1]);
    });

    it('centroid of only 2 points is the middle of the line', () => {
      const coordinate1 = [-1000, 1000];
      const coordinate2 = [-1000, 2000];
      const expectedCentroid = [-1000, 1500];

      const point = turfFeatureCollection([turfPoint(coordinate1), turfPoint(coordinate2)]);
      const value = EOWDataPieChart.findCentroid([point]);
      const centroid = value.features[0].properties.centroid;
      expect(centroid[0]).to.equal(expectedCentroid[0]);
      expect(centroid[1]).to.equal(expectedCentroid[1]);
    });

    // Used https://brilliant.org/wiki/triangles-centroid/
    it('centroid of 3 points is the middle of the triangle', () => {
      const coordinate1 = [0, 0];
      const coordinate2 = [2000, 0];
      const coordinate3 = [1000, 1732];

      const expectedCentroid = [(0 + 2000 + 1000) / 3, (0 + 0 + 1732) / 3]; // 1000, 1732

      const point = turfFeatureCollection([turfPoint(coordinate1), turfPoint(coordinate2), turfPoint(coordinate3)]);
      const value = EOWDataPieChart.findCentroid([point]);
      const centroid = value.features[0].properties.centroid;

      expect(centroid[0]).to.equal(expectedCentroid[0]);
      expect(centroid[1]).to.equal(expectedCentroid[1]);
    });

    it('centroid of 4 points is the middle of the square', () => {
      const coordinate1 = [0, 0];
      const coordinate2 = [2000, 0];
      const coordinate3 = [2000, 2000];
      const coordinate4 = [0, 2000];

      const expectedCentroid = [1000, 1000];

      const point = turfFeatureCollection([turfPoint(coordinate1), turfPoint(coordinate2), turfPoint(coordinate3), turfPoint(coordinate4)]);
      const value = EOWDataPieChart.findCentroid([point]);
      const centroid = value.features[0].properties.centroid;

      expect(centroid[0]).to.equal(expectedCentroid[0]);
      expect(centroid[1]).to.equal(expectedCentroid[1]);
    });

    it('centroid of 8 points is the middle of the octogon', () => {
      const coordinate1 = [4000, 3200];
      const coordinate2 = [3200, 4000];
      const coordinate3 = [800, 4000];
      const coordinate4 = [0, 3200];
      const coordinate5 = [0, 800];
      const coordinate6 = [800, 0];
      const coordinate7 = [3200, 0];
      const coordinate8 = [4000, 800];

      const expectedCentroid = [2000, 2000];

      const point = turfFeatureCollection([turfPoint(coordinate1), turfPoint(coordinate2), turfPoint(coordinate3),
                                                    turfPoint(coordinate4), turfPoint(coordinate5), turfPoint(coordinate6),
                                                    turfPoint(coordinate7), turfPoint(coordinate8)]);
      const value = EOWDataPieChart.findCentroid([point]);
      const centroid = value.features[0].properties.centroid;

      console.log(`Centroid of polygon: ${JSON.stringify(centroid)}`);
      console.log(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

      expect(centroid[0]).to.equal(expectedCentroid[0]);
      expect(centroid[1]).to.equal(expectedCentroid[1]);
    });

    it('centroid of 5 points is the middle of the pentagram', () => {
      const coordinate1 = [2000, 0];
      const coordinate2 = [4000, 2000];
      const coordinate3 = [2200, 4000];
      const coordinate4 = [1800, 4000];
      const coordinate5 = [0, 2000];

      const expectedCentroid = [2000, 2063];

      const point = turfFeatureCollection([turfPoint(coordinate1), turfPoint(coordinate2), turfPoint(coordinate3),
                                            turfPoint(coordinate4), turfPoint(coordinate5)]);
      const value = GeometryOps.calculateCentroid(point);  //EOWDataPieChart.findCentroid([point]);
      const centroid = value.geometry.coordinates;
        // [-1, -1]; // value.features[0].properties.centroid;

      // console.log(`Centroid of polygon: ${JSON.stringify(centroid)}`);
      // console.log(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

      expect(centroid[0]).to.equal(expectedCentroid[0]);
      expect(centroid[1]).to.equal(expectedCentroid[1]);
    });
  });
});
