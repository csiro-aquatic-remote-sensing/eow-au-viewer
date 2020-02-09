import { Popup } from './popup';
import * as chai from 'chai';

const expect = chai.expect;

describe('Popup', () => {
  it('should create an instance', () => {
    expect(new Popup(null, null, null)).is.not.undefined;  // tslint:disable-line
  });
});
