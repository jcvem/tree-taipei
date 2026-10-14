import { describe, it, expect } from 'vitest';
import { evaluatePlantingOpportunity } from '../src/utils/heuristics';

describe('Heuristic Determinism and Planting Opportunity Logic', () => {
  it('classifies isolated empty tree pit with wide sidewalk as Tier 1 (高潛力獨立空穴)', () => {
    const result = evaluatePlantingOpportunity({
      shapeType: '單一樹穴',
      lengthM: 1.5,
      areaSqm: 1.5,
      minTreeDistanceM: 8.5,
      sidewalkTotalWidthM: 3.2,
      sidewalkClearWidthM: 2.1,
      nearestTreeSpecies: '樟樹',
    });

    expect(result.tier).toBe('高潛力獨立空穴');
    expect(result.priority).toBe(1);
    expect(result.recommendedCapacity).toBe(1);
    expect(result.confidence).toContain('高');
    expect(result.whyCandidate).toContain('半徑 5 公尺內查無現存行道樹');
    expect(result.fieldCheckChecklist.length).toBe(4);
  });

  it('classifies continuous strip planting verge >= 8m as Tier 2 (帶狀綠帶連續補植空間)', () => {
    const result = evaluatePlantingOpportunity({
      shapeType: '帶狀樹穴',
      lengthM: 18.0,
      areaSqm: 5.4,
      minTreeDistanceM: 3.2,
      sidewalkTotalWidthM: 4.0,
      sidewalkClearWidthM: 2.5,
      nearestTreeSpecies: '榕樹',
    });

    expect(result.tier).toBe('帶狀綠帶連續補植空間');
    expect(result.priority).toBe(2);
    expect(result.recommendedCapacity).toBe(3); // 18 / 6 = 3
    expect(result.whyCandidate).toContain('長度 18.0m');
  });

  it('classifies narrow sidewalk tree pit as Tier 3 (狹窄人行道樹穴複查)', () => {
    const result = evaluatePlantingOpportunity({
      shapeType: '單一樹穴',
      lengthM: 1.2,
      areaSqm: 1.2,
      minTreeDistanceM: 6.0,
      sidewalkTotalWidthM: 1.4,
      sidewalkClearWidthM: 0.9,
    });

    expect(result.tier).toBe('狹窄人行道樹穴複查');
    expect(result.priority).toBe(3);
    expect(result.whyCandidate).toContain('人行道總寬度較窄');
  });

  it('classifies tree hole with existing tree within 5m as Tier 4 (既有樹穴維護盤點)', () => {
    const result = evaluatePlantingOpportunity({
      shapeType: '單一樹穴',
      lengthM: 1.2,
      areaSqm: 1.2,
      minTreeDistanceM: 2.1,
      sidewalkTotalWidthM: 2.5,
      sidewalkClearWidthM: 1.6,
      nearestTreeSpecies: '楓香',
    });

    expect(result.tier).toBe('既有樹穴維護盤點');
    expect(result.priority).toBe(4);
    expect(result.recommendedCapacity).toBe(0);
    expect(result.whyCandidate).toContain('已有登記樹木');
    expect(result.whyCandidate).toContain('楓香');
  });

  it('guarantees deterministic output for identical inputs', () => {
    const input = {
      shapeType: '帶狀樹穴',
      lengthM: 12.0,
      areaSqm: 3.6,
      minTreeDistanceM: 7.2,
      sidewalkTotalWidthM: 3.0,
      sidewalkClearWidthM: 1.8,
      nearestTreeSpecies: '欒樹',
    };

    const res1 = evaluatePlantingOpportunity(input);
    const res2 = evaluatePlantingOpportunity(input);
    expect(res1).toEqual(res2);
  });
});
