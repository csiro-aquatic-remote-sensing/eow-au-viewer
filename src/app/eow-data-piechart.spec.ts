import { point as turfPoint, Point, feature as turfFeature, featureCollection as turfFeatureCollection } from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import * as chai from 'chai';
const expect = chai.expect;

describe('eow-data-piechart', () => {
  describe('plot', () => {
    it('median of only 1 point is the point itself', () => {
      const coordinate = [-1000, 1000];
      const point = turfFeatureCollection([turfPoint(coordinate)]);
      const value = EOWDataPieChart.plot([point]);
      expect(value).to.equal(coordinate);
    });
  });
});
