import { UserStore } from './user-store';
import * as chai from 'chai';

const expect = chai.expect;

describe('Users', () => {
  it('should create an instance', () => {
    expect(new UserStore(null, null, null)).is.not.undefined;  // tslint:disable-line
  });
});
