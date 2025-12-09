import { version } from './index';

describe('Core Package', () => {
  it('should export version', () => {
    expect(version).toBe('1.0.0');
  });
});
