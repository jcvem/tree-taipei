import { describe, it, expect } from 'vitest';
import { formatTwd97, formatWgs84, twd97ToWgs84 } from '../src/utils/coordinates';

describe('Coordinate Conversion and Formatting', () => {
  it('accurately converts known Taipei landmarks from TWD97 TM2 to WGS84', () => {
    // Shilin Wenlin Rd tree: x=302404.92, y=2777358.41
    const [lon1, lat1] = twd97ToWgs84(302404.92, 2777358.41);
    expect(lon1).toBeCloseTo(121.5196, 3);
    expect(lat1).toBeCloseTo(25.1036, 3);

    // Shezi / Yanping N Rd Sec 6 tree hole: x=300743.05, y=2776005.15
    const [lon2, lat2] = twd97ToWgs84(300743.05, 2776005.15);
    expect(lon2).toBeCloseTo(121.5031, 3);
    expect(lat2).toBeCloseTo(25.0915, 3);

    // Daan Forest Park area: x=304500, y=2769500
    const [lon3, lat3] = twd97ToWgs84(304500.0, 2769500.0);
    expect(lon3).toBeGreaterThan(121.53);
    expect(lon3).toBeLessThan(121.55);
    expect(lat3).toBeGreaterThan(25.02);
    expect(lat3).toBeLessThan(25.04);
  });

  it('formats WGS84 coordinates cleanly with degree symbols', () => {
    const formatted = formatWgs84(121.519601, 25.103645);
    expect(formatted).toBe('121.51960°E, 25.10365°N');
  });

  it('formats TWD97 coordinates with units and projection note', () => {
    const formatted = formatTwd97(302404.92, 2777358.41);
    expect(formatted).toBe('X: 302404.9, Y: 2777358.4 (TWD97 / TM2)');
  });
});
