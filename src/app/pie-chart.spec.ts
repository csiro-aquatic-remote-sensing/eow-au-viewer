import { PieChart } from './pie-chart';
import * as chai from 'chai';

const expect = chai.expect;

describe('PieChart', () => {
  it('should create an instance', () => {
    expect(new PieChart(null)).is.not.undefined;  // tslint:disable-line
  });
});
