/**
 * Heuristics for the Tree Taipei derived Shade Gap / Planting Opportunity candidates.
 *
 * This heuristic is an open, civic-oriented algorithm that correlates:
 * 1. Deduplicated official tree holes (TaipeiTreeHole.csv)
 * 2. Spatial proximity to officially surveyed street trees (TaipeiTree.csv)
 * 3. Spatial context from Taipei sidewalk polygons (sidewalks.json)
 *
 * IMPORTANT CIVIC DISCLAIMER:
 * These candidates are derived analytical opportunities for community inspection
 * and field validation. They are NOT official municipal engineering plans or city orders.
 */

export interface CandidateEvaluationInput {
  shapeType: string;
  lengthM: number;
  areaSqm: number;
  minTreeDistanceM: number;
  sidewalkTotalWidthM: number;
  sidewalkClearWidthM: number;
  nearestTreeSpecies?: string | null;
}

export interface CandidateEvaluationResult {
  tier: '高潛力獨立空穴' | '帶狀綠帶連續補植空間' | '狹窄人行道樹穴複查' | '既有樹穴維護盤點';
  priority: number;
  confidence: string;
  whyCandidate: string;
  recommendedCapacity: number;
  fieldCheckChecklist: string[];
}

export function evaluatePlantingOpportunity(
  input: CandidateEvaluationInput
): CandidateEvaluationResult {
  const isStrip = input.shapeType === '帶狀樹穴';
  const minTreeDist = input.minTreeDistanceM;
  const swWth = input.sidewalkTotalWidthM;
  const swClear = input.sidewalkClearWidthM;
  const length = input.lengthM;
  const area = input.areaSqm;

  const checklist = [
    '1. 現地確認樹穴現況：是否有未登錄之既存樹木、幼苗或樹樁殘留',
    '2. 人行淨寬核對：補植後維持無障礙通行淨寬至少 1.5 公尺',
    '3. 地下公共管線避讓：查核台電、瓦斯、自來水等淺埋管線',
    '4. 冠層安全淨空：確認生長範圍不抵觸招牌、公車站牌與路燈照明',
  ];

  if (minTreeDist >= 5.0 && (swWth >= 2.0 || swClear >= 1.5)) {
    return {
      tier: '高潛力獨立空穴',
      priority: 1,
      confidence: '高（具備淨寬與空穴）',
      whyCandidate: `官方登記${input.shapeType}，半徑 5 公尺內查無現存行道樹登錄（最近樹距 ${minTreeDist.toFixed(1)}m），人行道總寬 ${swWth.toFixed(1)}m、淨寬 ${swClear.toFixed(1)}m，具備優先補植遮蔭喬木空間。`,
      recommendedCapacity: 1,
      fieldCheckChecklist: checklist,
    };
  }

  if (isStrip && length >= 8.0) {
    const estCapacity = Math.max(1, Math.floor(length / 6.0));
    return {
      tier: '帶狀綠帶連續補植空間',
      priority: 2,
      confidence: '中高（連續帶狀綠穴）',
      whyCandidate: `官方登記長度 ${length.toFixed(1)}m、面積 ${area.toFixed(1)}m² 之帶狀樹穴，縱深充裕，具備增補 ${estCapacity} 株遮蔭喬木或複層植栽潛力（周邊最近樹距 ${minTreeDist.toFixed(1)}m）。`,
      recommendedCapacity: estCapacity,
      fieldCheckChecklist: checklist,
    };
  }

  if (minTreeDist >= 5.0) {
    return {
      tier: '狹窄人行道樹穴複查',
      priority: 3,
      confidence: '中（需查核人行動線）',
      whyCandidate: `登記為${input.shapeType}且周邊 5 公尺內無有效樹木紀錄，但相鄰人行道總寬度較窄（${swWth.toFixed(1)}m），需現地評估推車與輪椅無障礙淨寬至少 1.5m 後再行補植。`,
      recommendedCapacity: 1,
      fieldCheckChecklist: checklist,
    };
  }

  const sp = input.nearestTreeSpecies || '行道樹';
  return {
    tier: '既有樹穴維護盤點',
    priority: 4,
    confidence: '維護追蹤（既有樹穴）',
    whyCandidate: `此樹穴半徑 5 公尺內已有登記樹木（樹種：${sp}，距離 ${minTreeDist.toFixed(1)}m）。建議現勘確認該植株健康生長狀況、浮根處理及樹穴土壤透水狀態。`,
    recommendedCapacity: 0,
    fieldCheckChecklist: checklist,
  };
}
