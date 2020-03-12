import { MeasurementStore } from './measurement-store';
import * as chai from 'chai';

const expect = chai.expect;

describe('MeasurementStore', () => {
  it('should create an instance', () => {
    expect(new MeasurementStore(null)).is.not.undefined;  // tslint:disable-line
  });
});
