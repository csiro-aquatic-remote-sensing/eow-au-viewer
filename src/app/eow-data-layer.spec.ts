import { EowDataLayer } from './eow-data-layer';
import * as chai from 'chai';

const expect = chai.expect;

describe('EowData', () => {
  it('should create an instance', () => {
    expect(new EowDataLayer()).is.not.undefined;  // tslint:disable-line
  });
});
