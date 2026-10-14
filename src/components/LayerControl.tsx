import React from 'react';
import { LayerVisibilityState } from '../types';

interface LayerControlProps {
  layers: LayerVisibilityState;
  onToggleLayer: (layerName: keyof LayerVisibilityState) => void;
  counts: {
    streetTrees: number;
    parkTrees: number;
    treeHoles: number;
    parks: number;
    sidewalks: number;
    shadeGaps: number;
  };
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer,
  counts,
}) => {
  return (
    <div className="quiet-card">
      <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>圖層:</span>
      <div className="layer-toggles-wrap">
        <button
          className={`layer-chip ${layers.shadeGaps ? 'active shade-gaps' : ''}`}
          onClick={() => onToggleLayer('shadeGaps')}
          title="顯示民間推估之遮蔭缺口與潛在補植候選點"
        >
          <span className="chip-dot shade-gaps" />
          <span>補植候選點</span>
          <span className="chip-count">({counts.shadeGaps})</span>
        </button>

        <button
          className={`layer-chip ${layers.streetTrees ? 'active' : ''}`}
          onClick={() => onToggleLayer('streetTrees')}
          title="顯示臺北市公有登記行道樹"
        >
          <span className="chip-dot street-trees" />
          <span>行道樹</span>
          <span className="chip-count">({counts.streetTrees.toLocaleString()})</span>
        </button>

        <button
          className={`layer-chip ${layers.parkTrees ? 'active' : ''}`}
          onClick={() => onToggleLayer('parkTrees')}
          title="顯示臺北市公有登記公園樹木"
        >
          <span className="chip-dot park-trees" />
          <span>公園樹木</span>
          <span className="chip-count">({counts.parkTrees.toLocaleString()})</span>
        </button>

        <button
          className={`layer-chip ${layers.treeHoles ? 'active' : ''}`}
          onClick={() => onToggleLayer('treeHoles')}
          title="顯示人行道固定設施物＿樹穴"
        >
          <span className="chip-dot tree-holes" />
          <span>樹穴設施</span>
          <span className="chip-count">({counts.treeHoles.toLocaleString()})</span>
        </button>

        <button
          className={`layer-chip ${layers.parks ? 'active' : ''}`}
          onClick={() => onToggleLayer('parks')}
          title="顯示臺北市公園綠地"
        >
          <span className="chip-dot parks" />
          <span>公園綠地</span>
          <span className="chip-count">({counts.parks})</span>
        </button>

        <button
          className={`layer-chip ${layers.sidewalks ? 'active' : ''}`}
          onClick={() => onToggleLayer('sidewalks')}
          title="顯示臺北市人行道範圍"
        >
          <span className="chip-dot sidewalks" />
          <span>人行道</span>
          <span className="chip-count">({counts.sidewalks.toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
