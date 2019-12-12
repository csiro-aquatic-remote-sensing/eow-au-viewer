import {point as turfPoint, Point, feature as turfFeature, featureCollection as turfFeatureCollection} from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import Chai from 'chai';
const expect = Chai.expect;

describe('eow-data-piechart', () => {
  describe('plot', () => {
    it('median of only 1 point is the point itself', () => {
      const point = turfFeatureCollection([turfPoint([-1000, 1000])]);
      const value = EOWDataPieChart.plot([point]);

    });
  })
})
