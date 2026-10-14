# 臺北樹跡・設計系統規範 (Tree Taipei Design System)

> **風格定調：文青風格・沈穩公民地圖（Literary & Calm Civic Editorial Map）**
> 拒絕 AI Slop（拒絕通用科技儀表板、拒絕霓虹漸層、拒絕磨砂毛玻璃、拒絕浮誇假指標），回歸紙質出版品與臺灣地理雜誌的沈靜質感。

---

## 1. 核心設計哲學 (Design Philosophy)

1. **以地理真實與公民證據為核心 (Civic Evidence Centered)**
   地圖不是展示 UI 動畫的玩具，而是市民查驗空間公平的工具。介面控制項保持低調、克制、不遮蔽視線；樹木點位、人行道邊界與空樹穴是視覺焦點。
2. **宣紙與墨調的閱讀感 (Ink & Warm Paper Texture)**
   底色採用帶有纖維溫度的暖米色紙張（`#f6f3eb` / `#fbf9f4`），字體採用炭墨黑與鉛字階調，讓長時間閱讀與空間探勘不刺眼。
3. **臺灣傳統色系的自然克制 (Muted Natural Palette)**
   以杉綠（`#2b4d36`）、苔綠（`#42634d`）、陶土磚紅（`#b45731`）、沃土褐（`#785f49`）與鋪石灰（`#5a6b63`）建立嚴謹的空間語彙。
4. **誠實透明，拒絕虛構數據 (Honesty & Transparency)**
   不宣稱未經科學實測的「體感降溫 -3.5°C」等偽指標；所有推估點位皆標註「民間推估・待現地勘查」，清楚區隔官方資料快照與啟發式候選點。

---

## 2. 嚴格防範 AI-Slop 反模式 (Anti-Patterns Audit)

| 嚴格禁止 (Forbidden) | 採用之文青公民設計 (Adopted Editorial Design) |
| :--- | :--- |
| 紫色/靛藍/青色/霓虹漸層 (Purple/Indigo/Neon) | 暖宣紙底、炭黑濃墨、紅磚陶土與杉木深綠 |
| 毛玻璃效果 (`backdrop-filter: blur()`) | 96% 暖紙底、細緻毛邊線 (`1px solid #dcd5c7`) |
| 浮誇的通用 SaaS 卡片與巨大陰影 | 扁平貼地微陰影 (`0 1px 3px rgba(33,32,29,0.06)`) |
| 裝飾性表情符號 (Emoji 滿天飛) | 幾何色點 (●, ○) 或語意化向量幾何輪廓 |
| 儀表板過載 (10+ 旋轉儀表與圖表) | 安靜的單行空間指標列 (Quiet Civic Ticker) |
| Inter / Roboto / Arial 西文字型侵蝕 | 臺灣正體中文首選：Noto Serif TC / Songti TC / Noto Sans TC / PingFang TC |

---

## 3. 色彩語彙與 Token 定義 (Color Tokens)

```css
:root {
  /* 紙張基底 (Paper Surfaces) */
  --bg-canvas: #f6f3eb;           /* 暖宣紙地圖畫布 */
  --bg-paper: #fbf9f4;            /* 面板與抽屜主要紙色 */
  --bg-card: #fdfcfa;             /* 輸入卡片與次級底色 */
  --bg-subtle: #efeae0;           /* 滑過微深底色 */
  --bg-highlight: #e8e2d4;        /* 強調欄位紙色 */

  /* 墨調 (Ink & Typography) */
  --ink-primary: #21201d;         /* 焦墨主要字體 */
  --ink-secondary: #534e44;       /* 濃墨次要說明 */
  --ink-muted: #7d7568;           /* 淡墨標籤與單位 */
  --ink-faint: #aba394;           /* 游絲淡灰色 */
  --ink-hairline: #dcd5c7;        /* 紙張細毛線 */
  --ink-border-strong: #c2b9a7;   /* 重要邊界線 */

  /* 自然植被與都市設施強調色 (Natural & Civic Accents) */
  --accent-forest: #2b4d36;       /* 鬱蔥冷杉 - 官方行道樹 */
  --accent-forest-soft: #e5ece6;  /* 杉青襯底 */
  --accent-moss: #42634d;         /* 苔原深綠 - 公園樹木與綠地 */
  --accent-moss-soft: #ebf1ec;    /* 苔綠襯底 */
  --accent-terracotta: #b45731;   /* 磚紅陶土 - 補植候選點與遮蔭缺口 */
  --accent-terracotta-soft: #f7ebe6; /* 陶土襯底 */
  --accent-earth: #785f49;        /* 沃土灰褐 - 人行道樹穴設施 */
  --accent-earth-soft: #f2eee9;   /* 土褐襯底 */
  --accent-slate: #5a6b63;        /* 鋪石青灰 - 人行道幾何範圍 */
  --accent-slate-soft: #edf0ee;   /* 青灰襯底 */
  --accent-ochre: #aa772d;        /* 赭石黃 - 離線提示與重點標記 */
}
```

---

## 4. 排版階層與字型規範 (Typography Hierarchy)

- **專題標題 (Editorial Display Title)**
  `font-family: "Noto Serif TC", "Songti TC", "BiauKai", "Source Han Serif TC", "MingLiU", serif;`
  具有鉛字宋體/明體的典雅韻味，字重 700，字距微寬（`letter-spacing: 0.04em`）。
- **介面控制與指標 (UI & Controls Sans)**
  `font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;`
  字級 12px~14px，注重小螢幕與繁體中文筆畫的可讀性。
- **等寬坐標數據 (Coordinates & Metrics)**
  `font-family: ui-monospace, "SF Mono", "Menlo", monospace;`
  用於呈現 TWD97 X/Y 與 WGS84 經緯度，確保數字對齊不跳動。

---

## 5. 圖層與視覺隱喻 (Map Layers Metaphor)

1. **補植候選點 (Shade Gap Candidates / 陶土磚紅 `#b45731`)**
   半徑 5.0~6.5px 實心圓點。代表公民分析出來的「可補植空間缺口」，在綠意中醒目提醒空間可能性。
2. **行道樹 (Street Trees / 鬱蔥冷杉 `#2b4d36`)**
   半徑 3.5px 圓點。以 Canvas 批次繪製，呈现人行道路網兩側的綠色走廊。
3. **公園樹木 (Park Trees / 苔原深綠 `#42634d`)**
   半徑 3.2px 圓點。呈現公園綠地內部的喬木聚集。
4. **樹穴設施 (Tree Holes / 沃土灰褐 `#785f49`)**
   半徑 4.0px 方形或深褐圓點。標示人行道上實體登記的穴位。
5. **公園綠地 (Parks / 苔綠外環 `#42634d`)**
   半徑 5.5px 雙環標記，標示 813 座公有公園。
6. **人行道範圍 (Sidewalks / 鋪石青灰 `#5a6b63`)**
   半透明多邊形面（`fillOpacity: 0.35`），勾勒行人安全通行空間。

---

## 6. 響應式佈局與行動適配 (Responsive & 390px Mobile View)

- **桌面端 (Desktop >= 1024px)**
  - 頂部沈穩導覽列。
  - 左上方安靜卡片控制區（行政區下拉選單 + 單行指標列 + 圖層膠囊按鈕）。
  - 右側滑入式詳情抽屜（寬度 380px），可即時核對樹穴、人行道寬度與現勘查核清單。
- **行動端 (Mobile 390px Viewport)**
  - 嚴格維持 **0 水平溢位（No Horizontal Overflow）**。
  - 圖層開關支援橫向平滑滑動（Touch-friendly chips）。
  - 詳情面板自動轉換為 **底部上拉抽屜（Mobile Bottom Sheet）**，帶有圓角拖曳手柄，最大高度限制為 75vh，內容獨立捲動。
  - 觸控目標面積不小於 40x40px，便於戶外單手現地勘查操作。

---

## 7. 地圖底圖策略與離線備援 (Basemap & Offline Resilience)

- **線上圖磚底圖**：使用 Carto Positron，透過 CSS 濾鏡（`sepia(0.24) brightness(0.98) contrast(0.93) saturate(0.85)`）去藍光轉暖紙底，無縫融入宣紙畫布。
- **離線備援紙圖 (Offline Civic Basemap)**：
  當外部圖磚因網路或防火牆無法載入時，自動觸發離線備援，渲染臺北市 12 行政區向量輪廓與 4 大主要水系（淡水河、基隆河、新店溪、景美溪），確保地圖核心功能 100% 隨時可用。
