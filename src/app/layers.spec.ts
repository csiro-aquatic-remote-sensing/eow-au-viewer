import { Layers } from './layers';
import * as chai from 'chai';

const expect = chai.expect;

describe('Layers', () => {
  it('should create an instance', () => {
    expect(new Layers(null, null, null, null)).is.not.undefined;  // tslint:disable-line
  });
});
