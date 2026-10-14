import React from 'react';

interface ShadeEquityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShadeEquityModal: React.FC<ShadeEquityModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="modal-title">遮蔭平權論述・為何樹木數量不等於平權？</h2>
          <button className="drawer-close-btn" onClick={onClose} aria-label="關閉">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal-body">
          <div className="editorial-lead">
            2025 年台北有超過 3,000 棵樹木因各種因素被移除。我們要如何找出城市空間把樹種回來，達到遮蔭平權？
          </div>

          <p className="editorial-paragraph">
            臺北市官方資料庫中登記有超過 16 萬棵公有樹木（90,393 棵行道樹、72,011 棵公園樹木）。表面上看，綠意數字看似龐大；然而在台北街頭行走的每個人，都能切身體會盛夏時分人行道上「走幾步就毫無遮蔽、烈日直射」的酷熱窒礙。
          </p>

          <h3 className="essay-section-title">樹木的數量，不等於遮蔭的公平</h3>
          <p className="editorial-paragraph">
            單看行政區的樹木總量，會產生嚴重的錯覺。士林區與北投區因包含陽明山郊區與廣闊公園綠地，樹木總量超過兩萬棵；然而在大同區、萬華區或市中心高密度商業街廓，行道樹分佈斷續、人行道狹小且既有樹穴長期缺株。
          </p>
          <p className="editorial-paragraph">
            <strong>遮蔭平權（Shade Equity）</strong>的核心理念在於：享有連續綠蔭、降低日常步行熱壓迫，是每一位市民（長者、推嬰兒車的家長、輪椅使用者、通學學童、公車轉乘通勤族）基本的步行權利。樹木不該只是豪宅大道或大型公園的專利，而應該深入每一條日常人行廊道。
          </p>

          <h3 className="essay-section-title">本圖台的透明推估原則（Heuristic Explanation）</h3>
          <p className="editorial-paragraph">
            為避免虛構官方推薦清單，本圖台採取<strong>透明、可驗證的空間啟發式規則</strong>：
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>以官方登載之樹穴為基礎：</strong> 取用 2026/10 臺北市「人行道固定設施物＿樹穴」共 1,309 處去重實體設施。這些位置在法規與都市設計上已屬合法植穴。
            </li>
            <li>
              <strong>比對行道樹空間鄰近度：</strong> 透過空間網格運算，查核該樹穴周邊 5 公尺內是否已有公有樹木編號。若無，則列為空穴缺口候選。
            </li>
            <li>
              <strong>疊合人行道淨寬與縱深：</strong> 結合 15,053 段人行道實測寬度，篩選出符合無障礙淨通行（大於 1.5 公尺）之優質補植點，並依據帶狀綠帶長度估算容納潛力。
            </li>
            <li>
              <strong>嚴格誠實聲明：</strong> 我們絕不宣稱「降溫幾度」等未經驗證的模擬數字，亦不將民間分析偽造成市府法定工程，所有點位皆明確標記「待公民與專家現地勘查」。
            </li>
          </ul>

          <h3 className="essay-section-title">未來演進展望（Next Steps for Shade Equity）</h3>
          <p className="editorial-paragraph">
            本版本為台北樹跡第一版互動地圖。真正的都市遮蔭平權評估，未來將陸續納入：
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>高齡人口與幼兒學區空間分佈疊圖（脆弱族群步行庇護優先區）</li>
            <li>都市熱島效應地表高溫感測（Landsat / Sentinel 地表溫度 LST 資料）</li>
            <li>大眾運輸站點（捷運出入口、公車站、YouBike）最後五百公尺遮蔭連續性評估</li>
            <li>民間現勘回報機制：邀請市民親自走訪標記殘留樹樁、地下箱涵與實際日照角度</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
