import React from 'react';

export const Legend: React.FC = () => {
  return (
    <div className="legend-panel">
      <div className="legend-title">圖例說明</div>

      <div className="legend-item">
        <span className="chip-dot shade-gaps" />
        <span>補植候選點（陶土紅・民間推估）</span>
      </div>

      <div className="legend-item">
        <span className="chip-dot street-trees" />
        <span>行道樹（鬱杉綠・官方快照）</span>
      </div>

      <div className="legend-item">
        <span className="chip-dot park-trees" />
        <span>公園樹木（苔原綠・官方快照）</span>
      </div>

      <div className="legend-item">
        <span className="chip-dot tree-holes" />
        <span>樹穴設施（沃土褐・官方登記）</span>
      </div>

      <div className="legend-item">
        <span className="chip-dot parks" />
        <span>公園綠地（邊框環・官方快照）</span>
      </div>

      <div className="legend-item">
        <span className="chip-dot sidewalks" />
        <span>人行道鋪面（鋪石灰・官方快照）</span>
      </div>

      <div className="legend-note">
        點擊地圖物件可展開詳細空間履歷與現勘查核清單。
      </div>
    </div>
  );
};
