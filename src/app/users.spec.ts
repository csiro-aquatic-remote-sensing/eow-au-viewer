import { UserStore } from './user-store';

describe('Users', () => {
  it('should create an instance', () => {
    expect(new UserStore(null)).toBeTruthy();
  });
});
