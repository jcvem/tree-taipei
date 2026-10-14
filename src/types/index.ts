export interface NormalizationSummary {
  street_trees: number;
  park_trees: number;
  tree_holes_raw: number;
  tree_holes_deduplicated: number;
  parks: number;
  sidewalk_features: number;
}

export interface TopSpecies {
  species: string;
  count: number;
}

export interface DistrictSummary {
  district: string;
  center: [number, number]; // [lat, lon]
  bounds: [[number, number], [number, number]]; // [[minLat, minLon], [maxLat, maxLon]]
  counts: {
    street_trees: number;
    park_trees: number;
    total_trees: number;
    tree_holes: number;
    parks: number;
    sidewalks: number;
    candidates_total: number;
    candidates_planting_opportunities: number;
    candidate_high_empty: number;
    candidate_strip_opportunity: number;
    candidate_narrow_review: number;
    candidate_existing_audit: number;
  };
  sidewalk_metrics: {
    total_length_km: number;
    total_area_sqm: number;
    street_trees_per_km: number;
  };
  top_species: TopSpecies[];
}

export interface ShadeGapCandidate {
  candidate_id: string;
  tier: '高潛力獨立空穴' | '帶狀綠帶連續補植空間' | '狹窄人行道樹穴複查' | '既有樹穴維護盤點';
  priority: number;
  confidence: string;
  district: string;
  road_name: string;
  shape_type: string;
  length_m: number;
  area_sqm: number;
  lon: number;
  lat: number;
  x_twd97: number;
  y_twd97: number;
  why_candidate: string;
  recommended_capacity: number;
  source_tree_hole_id: string;
  nearest_tree: {
    tree_id: string | null;
    species: string | null;
    distance_m: number | null;
  };
  sidewalk_context: {
    sidewalk_id: string | null;
    road_name: string | null;
    section: string | null;
    side: string | null;
    total_width_m: number;
    clear_width_m: number;
    land_use_code: string | null;
  };
  field_check_checklist: string[];
  provenance: {
    is_official: boolean;
    dataset_basis: string;
    methodology: string;
    disclaimer: string;
  };
}

export interface ParkItem {
  id: string;
  name: string;
  name_en: string;
  district: string;
  location: string;
  area_sqm: number | null;
  year_opened: string;
  unit: string;
  lon: number;
  lat: number;
  coord_note: string;
  overview: string;
  sports: string;
  recreation: string;
  service: string;
  transit: string;
  source: string;
  snapshot_date: string;
}

export interface TreeHoleItem {
  hole_id: string;
  district: string;
  road_name: string;
  shape_type: string;
  length_m: number;
  area_sqm: number;
  x_twd97: number;
  y_twd97: number;
  lon: number;
  lat: number;
  updated_at: string | null;
  source: string;
  snapshot_date: string;
}

export interface CompactStreetTree {
  id: string;
  sp: string;
  d_cm: number | null;
  h_m: number | null;
  road: string | null;
  ctx: string | null;
  s_date: string | null;
  u_date: string | null;
  x: number;
  y: number;
  lon: number;
  lat: number;
}

export interface CompactParkTree {
  id: string;
  sp: string;
  d_cm: number | null;
  h_m: number | null;
  park: string | null;
  s_date: string | null;
  u_date: string | null;
  x: number;
  y: number;
  lon: number;
  lat: number;
}

export interface SidewalkProperties {
  id: string;
  district: string;
  road: string | null;
  start: string | null;
  end: string | null;
  side: string | null;
  len_m: number | null;
  wth_m: number | null;
  clear_wth_m: number | null;
  code: string | null;
  area_sqm: number | null;
}

export interface SidewalkFeature {
  type: 'Feature';
  properties: SidewalkProperties;
  geometry: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  };
}

export interface DistrictData {
  district: string;
  street_trees_count: number;
  park_trees_count: number;
  sidewalks_count: number;
  street_trees: CompactStreetTree[];
  park_trees: CompactParkTree[];
  sidewalks: {
    type: 'FeatureCollection';
    features: SidewalkFeature[];
  };
}

export interface DensityCell {
  gx: number;
  gy: number;
  lon: number;
  lat: number;
  street_trees: number;
  park_trees: number;
  tree_holes: number;
  candidates: number;
  district: string;
}

export interface LayerVisibilityState {
  streetTrees: boolean;
  parkTrees: boolean;
  treeHoles: boolean;
  parks: boolean;
  sidewalks: boolean;
  shadeGaps: boolean;
}

export type FeatureType =
  | 'street_tree'
  | 'park_tree'
  | 'tree_hole'
  | 'park'
  | 'sidewalk'
  | 'shade_gap';

export interface SelectedFeature {
  type: FeatureType;
  title: string;
  subtitle: string;
  isOfficial: boolean;
  coordinates: {
    lon: number;
    lat: number;
    x_twd97?: number;
    y_twd97?: number;
  };
  fields: Array<{ label: string; value: string | number | null | undefined }>;
  candidateInfo?: ShadeGapCandidate;
  sourceAttribution: {
    datasetName: string;
    url: string;
    snapshotDate: string;
    license: string;
  };
}
