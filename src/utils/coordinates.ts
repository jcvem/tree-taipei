/**
 * Coordinate transformation utilities between TWD97 (EPSG:3826) TM2 and WGS84 (EPSG:4326).
 *
 * Parameters for Taiwan TM2 zone 121:
 * Ellipsoid: GRS80
 * a = 6378137.0 m
 * b = 6356752.314245 m
 * central meridian = 121 degrees E
 * false easting = 250,000.0 m
 * false northing = 0.0 m
 * scale factor k0 = 0.9999
 */

const A = 6378137.0;
const B = 6356752.314245;
const LON0 = (121.0 * Math.PI) / 180.0;
const K0 = 0.9999;
const DX = 250000.0;
const DY = 0.0;

export function twd97ToWgs84(x: number, y: number): [number, number] {
  const e = Math.sqrt(1.0 - (B * B) / (A * A));
  const e2 = (e * e) / (1.0 - e * e);

  const xAdj = x - DX;
  const yAdj = y - DY;

  const m = yAdj / K0;
  const mu =
    m /
    (A *
      (1.0 -
        (e * e) / 4.0 -
        (3.0 * Math.pow(e, 4)) / 64.0 -
        (5.0 * Math.pow(e, 6)) / 256.0));
  const e1 = (1.0 - Math.sqrt(1.0 - e * e)) / (1.0 + Math.sqrt(1.0 - e * e));

  const j1 = (3.0 * e1) / 2.0 - (27.0 * Math.pow(e1, 3)) / 32.0;
  const j2 = (21.0 * Math.pow(e1, 2)) / 16.0 - (55.0 * Math.pow(e1, 4)) / 32.0;
  const j3 = (151.0 * Math.pow(e1, 3)) / 96.0;
  const j4 = (1097.0 * Math.pow(e1, 4)) / 512.0;

  const fp =
    mu +
    j1 * Math.sin(2.0 * mu) +
    j2 * Math.sin(4.0 * mu) +
    j3 * Math.sin(6.0 * mu) +
    j4 * Math.sin(8.0 * mu);

  const c1 = e2 * Math.pow(Math.cos(fp), 2);
  const t1 = Math.pow(Math.tan(fp), 2);
  const r1 =
    (A * (1.0 - e * e)) /
    Math.pow(1.0 - e * e * Math.pow(Math.sin(fp), 2), 1.5);
  const n1 = A / Math.sqrt(1.0 - e * e * Math.pow(Math.sin(fp), 2));

  const d = xAdj / (n1 * K0);

  const latRad =
    fp -
    ((n1 * Math.tan(fp)) / r1) *
      ((d * d) / 2.0 -
        (5.0 + 3.0 * t1 + 10.0 * c1 - 4.0 * (c1 * c1) - 9.0 * e2) *
          ((d * d * d * d) / 24.0) +
        (61.0 +
          90.0 * t1 +
          298.0 * c1 +
          45.0 * (t1 * t1) -
          252.0 * e2 -
          3.0 * (c1 * c1)) *
          (Math.pow(d, 6) / 720.0));

  const lonRad =
    LON0 +
    (d -
      (1.0 + 2.0 * t1 + c1) * ((d * d * d) / 6.0) +
      (5.0 -
        2.0 * c1 +
        28.0 * t1 -
        3.0 * (c1 * c1) +
        8.0 * e2 +
        24.0 * (t1 * t1)) *
        (Math.pow(d, 5) / 120.0)) /
      Math.cos(fp);

  const lon = Number(((lonRad * 180.0) / Math.PI).toFixed(6));
  const lat = Number(((latRad * 180.0) / Math.PI).toFixed(6));

  return [lon, lat];
}

export function formatWgs84(lon: number, lat: number): string {
  return `${lon.toFixed(5)}°E, ${lat.toFixed(5)}°N`;
}

export function formatTwd97(x?: number, y?: number): string {
  if (x === undefined || y === undefined) return '未記錄';
  return `X: ${x.toFixed(1)}, Y: ${y.toFixed(1)} (TWD97 / TM2)`;
}
