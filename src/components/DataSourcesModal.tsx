import React from 'react';
import { NormalizationSummary } from '../types';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: NormalizationSummary | null;
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="modal-title">開放資料來源與資料履歷 (Data Provenance)</h2>
          <button className="drawer-close-btn" onClick={onClose} aria-label="關閉">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal-body">
          <p className="editorial-paragraph">
            本平台嚴格遵守開放資料精神，所有資料皆源自政府公開資料平台於 <strong>2026-10-14</strong> 擷取之真實快照，不採用未驗證之即時爬蟲或黑箱資料。
          </p>

          <table className="data-provenance-table">
            <thead>
              <tr>
                <th>資料集名稱</th>
                <th>快照筆數</th>
                <th>原始坐標</th>
                <th>來源與授權</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>臺北市行道樹分布圖</strong></td>
                <td>{summary ? summary.street_trees.toLocaleString() : '90,393'} 筆</td>
                <td>TWD97 TM2</td>
                <td>
                  <a href="https://data.gov.tw/dataset/128274" target="_blank" rel="noreferrer" className="source-link">
                    政府資料開放平台 #128274
                  </a>
                  <br />政府資料開放授權條款第一版
                </td>
              </tr>
              <tr>
                <td><strong>臺北市公園樹木分布圖</strong></td>
                <td>{summary ? summary.park_trees.toLocaleString() : '72,011'} 筆</td>
                <td>TWD97 TM2</td>
                <td>
                  <a href="https://data.gov.tw/dataset/128274" target="_blank" rel="noreferrer" className="source-link">
                    政府資料開放平台 #128274
                  </a>
                  <br />政府資料開放授權條款第一版
                </td>
              </tr>
              <tr>
                <td><strong>人行道固定設施物＿樹穴</strong></td>
                <td>{summary ? summary.tree_holes_deduplicated.toLocaleString() : '1,309'} 處 (去重前 {summary ? summary.tree_holes_raw.toLocaleString() : '2,260'})</td>
                <td>TWD97 TM2</td>
                <td>
                  <a href="https://data.gov.tw/dataset/134908" target="_blank" rel="noreferrer" className="source-link">
                    政府資料開放平台 #134908
                  </a>
                  <br />政府資料開放授權條款第一版
                </td>
              </tr>
              <tr>
                <td><strong>臺北市人行道範圍圖</strong></td>
                <td>{summary ? summary.sidewalk_features.toLocaleString() : '15,053'} 筆多邊形</td>
                <td>EPSG:3826</td>
                <td>
                  <a href="https://data.taipei/dataset/detail?id=715d3a83-8445-4496-b6bf-b0900538b7e7" target="_blank" rel="noreferrer" className="source-link">
                    台北市政府資料大平台
                  </a>
                  <br />政府資料開放授權條款第一版
                </td>
              </tr>
              <tr>
                <td><strong>臺北市公園基本資料</strong></td>
                <td>{summary ? summary.parks.toLocaleString() : '813'} 座公園</td>
                <td>WGS84 經緯度</td>
                <td>
                  <a href="https://data.taipei/dataset/detail?id=ea732fb5-4bec-4be7-93f2-8ab91e74a6c6" target="_blank" rel="noreferrer" className="source-link">
                    台北市政府資料大平台
                  </a>
                  <br />政府資料開放授權條款第一版
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="essay-section-title">坐標系統與轉換說明 (CRS Transformation)</h3>
          <p className="editorial-paragraph">
            原始市府資料中之行道樹、公園樹、樹穴與人行道，皆以臺灣二度分帶投影坐標系統 <code>TWD97 / TM2 zone 121 (EPSG:3826)</code> 紀錄。本平台為確保地圖展示相容性，使用嚴格之 GRS80 橢球反算投影公式轉換為 <code>WGS84 (EPSG:4326)</code>，並在詳情面板中同時保留原始 TWD97 公尺制坐標以供工程查驗。
          </p>

          <h3 className="essay-section-title">移除樹木資料聲明 (Tree Removal Notice)</h3>
          <p className="editorial-paragraph">
            臺北市政府歷年樹木移除履歷（如行道樹路燈資訊網 https://geopkl.gov.taipei/）因資料介面尚未完整公開，且本期下載快照期間伺服器逾時，因此本 MVP 版本<strong>未納入虛構或模擬之樹木移除資料</strong>，僅呈現 2026/10 官方盤點快照之實存物件，恪守學術與公眾誠實原則。
          </p>
        </div>
      </div>
    </div>
  );
};
