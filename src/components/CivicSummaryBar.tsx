import React from 'react';
import { DistrictSummary, NormalizationSummary } from '../types';

interface CivicSummaryBarProps {
  summary: NormalizationSummary | null;
  selectedDistrict: string;
  districtSummary: DistrictSummary | null;
  plantingOpportunityCount: number;
}

export const CivicSummaryBar: React.FC<CivicSummaryBarProps> = ({
  summary,
  selectedDistrict,
  districtSummary,
  plantingOpportunityCount,
}) => {
  if (!summary) {
    return (
      <div className="quiet-card civic-summary-bar">
        <span>載入資料中...</span>
      </div>
    );
  }

  const isAll = selectedDistrict === 'all';

  const streetTrees = isAll
    ? summary.street_trees
    : districtSummary?.counts.street_trees ?? 0;
  const parkTrees = isAll
    ? summary.park_trees
    : districtSummary?.counts.park_trees ?? 0;
  const totalTrees = streetTrees + parkTrees;
  const treeHoles = isAll
    ? summary.tree_holes_deduplicated
    : districtSummary?.counts.tree_holes ?? 0;
  const opportunities = isAll
    ? plantingOpportunityCount
    : districtSummary?.counts.candidates_planting_opportunities ?? 0;
  const parks = isAll
    ? summary.parks
    : districtSummary?.counts.parks ?? 0;
  const sidewalks = isAll
    ? summary.sidewalk_features
    : districtSummary?.counts.sidewalks ?? 0;

  return (
    <div className="quiet-card civic-summary-bar">
      <div className="stat-metric">
        <span className="stat-label">範圍:</span>
        <span className="stat-val">{isAll ? '全臺北市' : selectedDistrict}</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-metric">
        <span className="stat-label">公有樹木:</span>
        <span className="stat-val">{totalTrees.toLocaleString()}</span>
        <span className="stat-label">(行道 {streetTrees.toLocaleString()} / 公園 {parkTrees.toLocaleString()})</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-metric">
        <span className="stat-label">現有樹穴:</span>
        <span className="stat-val">{treeHoles.toLocaleString()}</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-metric">
        <span className="stat-label">補植潛力候選:</span>
        <span className="stat-val accent">{opportunities.toLocaleString()} 處</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-metric">
        <span className="stat-label">公園綠地:</span>
        <span className="stat-val">{parks.toLocaleString()}</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-metric">
        <span className="stat-label">人行道:</span>
        <span className="stat-val">{sidewalks.toLocaleString()} 段</span>
        {!isAll && districtSummary?.sidewalk_metrics && (
          <span className="stat-label">
            ({districtSummary.sidewalk_metrics.total_length_km}km · 每公里 {districtSummary.sidewalk_metrics.street_trees_per_km} 棵)
          </span>
        )}
      </div>
    </div>
  );
};
