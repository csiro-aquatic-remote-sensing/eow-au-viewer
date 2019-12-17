import {point as turfPoint, Point, feature as turfFeature, featureCollection as turfFeatureCollection} from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import * as chai from 'chai';
import GeometryOps from './geometry-ops';
import Brolog from 'brolog';

const expect = chai.expect;

describe('geometry-ops', () => {
  beforeEach(() => {
    Brolog.level('silly');
  });
  /**
   * Used http://eguruchela.com/math/Calculator/polygon-centroid-point to calculate centroid
   * to determine the values for more complex polygons (hand verified also)
   */
  describe('centroid', () => {
    describe('using calculateCentroidFromFeatureCollection()', () => {
      it('centroid of only 1 point is the point itself', () => {
        const coordinates = [[-1000, 1000]];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(coordinates[0][0]);
        expect(centroid[1]).to.equal(coordinates[0][1]);
      });

      it('centroid of only 2 points is the middle of the line', () => {
        const coordinates = [[-1000, 1000], [-1000, 2000]];
        const expectedCentroid = [-1000, 1500];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      // Used https://brilliant.org/wiki/triangles-centroid/
      it('centroid of 3 points is the middle of the triangle', () => {
        const coordinates = [[0, 0], [2000, 0], [1000, 1732]];

        const expectedCentroid = [Math.round((0 + 2000 + 1000) / 3), Math.round((0 + 0 + 1732) / 3)]; // 1000, 1732

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 4 points is the middle of the square', () => {
        const coordinates = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]];

        const expectedCentroid = [1000, 1000];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 8 points is the middle of the octogon', () => {
        const coordinates = [[4000, 3200], [3200, 4000], [800, 4000], [0, 3200], [0, 800], [800, 0], [3200, 0], [4000, 800]];

        const expectedCentroid = [2000, 2000];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 5 points is the middle of the pentagram', () => {
        const coordinates = [[2000, 0], [4000, 2000], [2200, 4000], [1800, 4000], [0, 2000]];

        const expectedCentroid = [2000, 2063];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });
    });

    describe('using calculateCentroidFromPoints()', () => {
      it('centroid of only 1 point is the point itself', () => {
        const coordinates = [[-1000, 1000]];
        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(coordinates[0][0]);
        expect(centroid[1]).to.equal(coordinates[0][1]);
      });

      it('centroid of only 2 points is the middle of the line', () => {
        const coordinates = [[-1000, 1000], [-1000, 2000]];
        const expectedCentroid = [-1000, 1500];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      // Used https://brilliant.org/wiki/triangles-centroid/
      it('centroid of 3 points is the middle of the triangle', () => {
        const coordinates = [[0, 0], [2000, 0], [1000, 1732]];

        const expectedCentroid = [Math.round((0 + 2000 + 1000) / 3), Math.round((0 + 0 + 1732) / 3)]; // 1000, 1732

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 4 points is the middle of the square', () => {
        const coordinates = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]];

        const expectedCentroid = [1000, 1000];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 8 points is the middle of the octogon', () => {
        const coordinates = [[4000, 3200], [3200, 4000], [800, 4000], [0, 3200], [0, 800], [800, 0], [3200, 0], [4000, 800]];

        const expectedCentroid = [2000, 2000];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 5 points is the middle of the pentagram', () => {
        const coordinates = [[2000, 0], [4000, 2000], [2200, 4000], [1800, 4000], [0, 2000]];

        const expectedCentroid = [2000, 2063];

        const value = GeometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });
    });
  });
});
