import React from 'react';

interface HeaderProps {
  onOpenShadeEquity: () => void;
  onOpenDataSources: () => void;
  offlineMode: boolean;
  onToggleOfflineMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenShadeEquity,
  onOpenDataSources,
  offlineMode,
  onToggleOfflineMode,
}) => {
  return (
    <header className="editorial-header">
      <div className="header-brand">
        <div className="brand-title-wrap">
          <h1 className="brand-title">台北樹跡</h1>
          <span className="brand-badge">遮蔭平權地圖</span>
        </div>
        <p className="brand-subtitle">
          把三千棵樹種回來・盤點人行道、空樹穴與清涼缺口
        </p>
      </div>

      <nav className="header-nav">
        <button
          className="nav-btn primary"
          onClick={onOpenShadeEquity}
          title="閱讀遮蔭平權論述與空間推估方法"
        >
          <span>平權論述</span>
        </button>
        <button
          className="nav-btn"
          onClick={onOpenDataSources}
          title="查看官方快照來源與開放資料履歷"
        >
          <span>資料來源</span>
        </button>
        <button
          className={`nav-btn ${offlineMode ? 'active' : ''}`}
          onClick={onToggleOfflineMode}
          title="切換離線簡約紙圖／線上圖磚底圖"
        >
          <span>{offlineMode ? '離線紙圖' : '線上圖磚'}</span>
        </button>
      </nav>
    </header>
  );
};
