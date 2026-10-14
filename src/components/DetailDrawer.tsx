import React from 'react';
import { SelectedFeature } from '../types';
import { formatTwd97, formatWgs84 } from '../utils/coordinates';

interface DetailDrawerProps {
  feature: SelectedFeature | null;
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({ feature, onClose }) => {
  if (!feature) return null;

  const {
    title,
    subtitle,
    isOfficial,
    coordinates,
    fields,
    candidateInfo,
    sourceAttribution,
  } = feature;

  return (
    <aside className="detail-drawer" aria-label="空間物件詳情">
      <div className="mobile-drag-handle" />

      <header className="drawer-header">
        <div className="drawer-title-group">
          <span className={`drawer-badge ${isOfficial ? 'official' : 'derived'}`}>
            {isOfficial ? '官方開放資料快照' : '民間推估候選點'}
          </span>
          <h2 className="drawer-title">{title}</h2>
          <span className="drawer-subtitle">{subtitle}</span>
        </div>

        <button
          className="drawer-close-btn"
          onClick={onClose}
          aria-label="關閉詳情面板"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="drawer-body">
        {/* If Derived Shade Gap Candidate, highlight Opportunity Box & Checklist */}
        {candidateInfo && (
          <>
            <div className="candidate-rationale-box">
              <div className="box-title">
                【{candidateInfo.tier}】補植評估依據
              </div>
              <p className="box-content">{candidateInfo.why_candidate}</p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--ink-secondary)' }}>
                信心度：<strong>{candidateInfo.confidence}</strong> · 建議補植容納量：<strong>{candidateInfo.recommended_capacity} 株</strong>
              </div>
            </div>

            <div className="checklist-section">
              <div className="checklist-title">志工／公民現勘查核清單 (Ground Truth)</div>
              <ul className="checklist-items">
                {candidateInfo.field_check_checklist.map((item, idx) => (
                  <li key={idx} className="checklist-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Normalized Fields Table */}
        <table className="data-fields-table">
          <tbody>
            {fields.map((f, idx) => (
              <tr key={idx}>
                <th>{f.label}</th>
                <td>{f.value !== null && f.value !== undefined && f.value !== '' ? String(f.value) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Coordinates Box */}
        <div className="coords-provenance-box">
          <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>空間坐標（雙系統保存）</span>
          <div className="coord-line">WGS84: {formatWgs84(coordinates.lon, coordinates.lat)}</div>
          {coordinates.x_twd97 !== undefined && coordinates.y_twd97 !== undefined && (
            <div className="coord-line">{formatTwd97(coordinates.x_twd97, coordinates.y_twd97)}</div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '2px' }}>
            坐標轉換依據 EPSG:3826 (TWD97 TM2 二度分帶) 精確換算至 EPSG:4326 (WGS84)。
          </div>
        </div>

        {/* Data Provenance & Source Attribution */}
        <div className="coords-provenance-box">
          <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>資料來源履歷</span>
          <div>原始資料集：{sourceAttribution.datasetName}</div>
          <div>快照日期：{sourceAttribution.snapshotDate}</div>
          <div>授權：{sourceAttribution.license}</div>
          <div>
            官方連結：{' '}
            <a
              href={sourceAttribution.url}
              target="_blank"
              rel="noreferrer noopener"
              className="source-link"
            >
              檢視政府開放資料平台
            </a>
          </div>
        </div>

        <p className="disclaimer-quiet">
          本平台資料取自 2026/10 官方開放資料快照。民間推估候選點非市府正式施工規劃，實際種植須現地評估公共管線、無障礙通行與樹冠採光。
        </p>
      </div>
    </aside>
  );
};
