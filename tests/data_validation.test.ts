import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Normalized Data Validation against normalization_summary.json', () => {
  const rootDir = path.resolve(__dirname, '..');
  const normalizedDir = path.join(rootDir, 'data', 'normalized');
  const summaryPath = path.join(normalizedDir, 'normalization_summary.json');

  it('summary file exists and contains expected counts', () => {
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    expect(summary.street_trees).toBe(90393);
    expect(summary.park_trees).toBe(72011);
    expect(summary.tree_holes_raw).toBe(2260);
    expect(summary.tree_holes_deduplicated).toBe(1309);
    expect(summary.parks).toBe(813);
    expect(summary.sidewalk_features).toBe(15053);
  });

  it('trees_street.json matches summary count and schema', () => {
    const filePath = path.join(normalizedDir, 'trees_street.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(data.count).toBe(90393);
    expect(data.items.length).toBe(90393);

    const first = data.items[0];
    expect(first).toHaveProperty('tree_id');
    expect(first).toHaveProperty('district');
    expect(first).toHaveProperty('species');
    expect(first).toHaveProperty('x_twd97');
    expect(first).toHaveProperty('y_twd97');
    expect(first).toHaveProperty('source', 'taipei_street_tree');
  });

  it('trees_park.json matches summary count and schema', () => {
    const filePath = path.join(normalizedDir, 'trees_park.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(data.count).toBe(72011);
    expect(data.items.length).toBe(72011);

    const first = data.items[0];
    expect(first).toHaveProperty('tree_id');
    expect(first).toHaveProperty('district');
    expect(first).toHaveProperty('species');
    expect(first).toHaveProperty('park_name');
    expect(first).toHaveProperty('x_twd97');
    expect(first).toHaveProperty('y_twd97');
    expect(first).toHaveProperty('source', 'taipei_park_tree');
  });

  it('tree_holes.json matches summary count and schema', () => {
    const filePath = path.join(normalizedDir, 'tree_holes.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(data.raw_count).toBe(2260);
    expect(data.count).toBe(1309);
    expect(data.items.length).toBe(1309);

    const first = data.items[0];
    expect(first).toHaveProperty('tree_hole_id');
    expect(first).toHaveProperty('shape_type');
    expect(first).toHaveProperty('x_twd97');
    expect(first).toHaveProperty('y_twd97');
    expect(first).toHaveProperty('source', 'taipei_tree_hole');
  });

  it('parks.json matches summary count and schema', () => {
    const filePath = path.join(normalizedDir, 'parks.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(data.count).toBe(813);
    expect(data.items.length).toBe(813);

    const first = data.items[0];
    expect(first).toHaveProperty('pm_name');
    expect(first).toHaveProperty('pm_regions');
    expect(first).toHaveProperty('pm_Longitude');
    expect(first).toHaveProperty('pm_Latitude');
  });

  it('sidewalks.geojson matches summary count and schema', () => {
    const filePath = path.join(normalizedDir, 'sidewalks.geojson');
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(data.type).toBe('FeatureCollection');
    expect(data.features.length).toBe(15053);

    const first = data.features[0];
    expect(first.geometry.type).toBe('MultiPolygon');
    expect(first.properties).toHaveProperty('ID');
    expect(first.properties).toHaveProperty('Town_N');
    expect(first.properties).toHaveProperty('NAME_Road');
  });

  it('derived shade_gap_candidates.json has 1309 items and valid fields', () => {
    const derivedPath = path.join(rootDir, 'public', 'data', 'shade_gap_candidates.json');
    expect(fs.existsSync(derivedPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(derivedPath, 'utf-8'));

    expect(data.count).toBe(1309);
    expect(data.items.length).toBe(1309);

    const first = data.items[0];
    expect(first).toHaveProperty('candidate_id');
    expect(first).toHaveProperty('tier');
    expect(first).toHaveProperty('why_candidate');
    expect(first).toHaveProperty('field_check_checklist');
    expect(first.field_check_checklist.length).toBeGreaterThan(0);
    expect(first).toHaveProperty('provenance');
    expect(first.provenance.is_official).toBe(false);
  });
});
