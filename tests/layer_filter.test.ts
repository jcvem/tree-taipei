import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DistrictSummary, LayerVisibilityState } from '../src/types';

describe('Layer and District Filtering Logic', () => {
  const rootDir = path.resolve(__dirname, '..');
  const distSummaryPath = path.join(rootDir, 'public', 'data', 'districts_summary.json');
  const distData = JSON.parse(fs.readFileSync(distSummaryPath, 'utf-8'));
  const districts: DistrictSummary[] = distData.districts;

  it('contains all 12 Taipei administrative districts', () => {
    expect(districts.length).toBe(12);
    const names = districts.map((d) => d.district).sort();
    const expected = [
      '中山區', '中正區', '信義區', '內湖區', '北投區', '南港區',
      '士林區', '大同區', '大安區', '文山區', '松山區', '萬華區',
    ].sort();
    expect(names).toEqual(expected);
  });

  it('district tree counts aggregate to the total street and park tree count', () => {
    const totalStreet = districts.reduce((acc, d) => acc + d.counts.street_trees, 0);
    const totalPark = districts.reduce((acc, d) => acc + d.counts.park_trees, 0);
    const totalHoles = districts.reduce((acc, d) => acc + d.counts.tree_holes, 0);
    const totalSidewalks = districts.reduce((acc, d) => acc + d.counts.sidewalks, 0);

    expect(totalStreet).toBe(90393);
    expect(totalPark).toBe(72011);
    expect(totalHoles).toBe(1309);
    expect(totalSidewalks).toBe(15053);
  });

  it('filters layer state predictably when toggled', () => {
    const initialState: LayerVisibilityState = {
      streetTrees: true,
      parkTrees: true,
      treeHoles: true,
      parks: true,
      sidewalks: true,
      shadeGaps: true,
    };

    const toggle = (
      state: LayerVisibilityState,
      key: keyof LayerVisibilityState
    ): LayerVisibilityState => ({
      ...state,
      [key]: !state[key],
    });

    const withoutStreet = toggle(initialState, 'streetTrees');
    expect(withoutStreet.streetTrees).toBe(false);
    expect(withoutStreet.shadeGaps).toBe(true);

    const toggledBack = toggle(withoutStreet, 'streetTrees');
    expect(toggledBack.streetTrees).toBe(true);
  });
});
