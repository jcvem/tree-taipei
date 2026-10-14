import React from 'react';
import { DistrictSummary } from '../types';

interface DistrictFilterProps {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  districtSummaries: DistrictSummary[];
}

export const DistrictFilter: React.FC<DistrictFilterProps> = ({
  selectedDistrict,
  onSelectDistrict,
  districtSummaries,
}) => {
  return (
    <div className="quiet-card" style={{ padding: '4px 6px' }}>
      <label htmlFor="district-select" style={{ fontSize: '12px', color: 'var(--ink-muted)', paddingLeft: '4px' }}>
        行政區:
      </label>
      <select
        id="district-select"
        className="district-selector"
        value={selectedDistrict}
        onChange={(e) => onSelectDistrict(e.target.value)}
      >
        <option value="all">全臺北市 (12 個行政區)</option>
        {districtSummaries.map((d) => (
          <option key={d.district} value={d.district}>
            {d.district} (樹木 {d.counts.total_trees.toLocaleString()} · 候選 {d.counts.candidates_planting_opportunities})
          </option>
        ))}
      </select>
    </div>
  );
};
