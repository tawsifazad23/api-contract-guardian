import { version } from './index';

describe('CLI Package', () => {
  it('should export version', () => {
    expect(version).toBe('1.0.0');
  });
});
