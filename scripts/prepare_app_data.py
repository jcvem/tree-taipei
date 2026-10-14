from __future__ import annotations

import json
import math
import shutil
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NORMALIZED = ROOT / "data" / "normalized"
DERIVED = ROOT / "data" / "derived"
PUBLIC_DATA = ROOT / "public" / "data"
PUBLIC_DISTRICTS = PUBLIC_DATA / "districts"

DERIVED.mkdir(parents=True, exist_ok=True)
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
PUBLIC_DISTRICTS.mkdir(parents=True, exist_ok=True)


def twd97_to_wgs84(x: float, y: float) -> tuple[float, float]:
    """Convert TWD97 (EPSG:3826) TM2 to WGS84 (EPSG:4326) degrees.

    Central meridian 121 E, false easting 250,000m, false northing 0m,
    scale factor 0.9999, GRS80 ellipsoid.
    """
    a = 6378137.0
    b = 6356752.314245
    long0 = 121.0 * math.pi / 180.0
    k0 = 0.9999
    dx = 250000.0
    dy = 0.0

    e = math.sqrt(1.0 - (b**2) / (a**2))
    e2 = e**2 / (1.0 - e**2)

    x_adj = x - dx
    y_adj = y - dy

    m = y_adj / k0
    mu = m / (a * (1.0 - (e**2) / 4.0 - 3.0 * (e**4) / 64.0 - 5.0 * (e**6) / 256.0))
    e1 = (1.0 - math.sqrt(1.0 - e**2)) / (1.0 + math.sqrt(1.0 - e**2))

    j1 = 3.0 * e1 / 2.0 - 27.0 * (e1**3) / 32.0
    j2 = 21.0 * (e1**2) / 16.0 - 55.0 * (e1**4) / 32.0
    j3 = 151.0 * (e1**3) / 96.0
    j4 = 1097.0 * (e1**4) / 512.0

    fp = mu + j1 * math.sin(2.0 * mu) + j2 * math.sin(4.0 * mu) + j3 * math.sin(6.0 * mu) + j4 * math.sin(8.0 * mu)

    c1 = e2 * (math.cos(fp) ** 2)
    t1 = math.tan(fp) ** 2
    r1 = a * (1.0 - e**2) / ((1.0 - (e**2) * (math.sin(fp) ** 2)) ** 1.5)
    n1 = a / math.sqrt(1.0 - (e**2) * (math.sin(fp) ** 2))

    d = x_adj / (n1 * k0)

    lat = fp - (n1 * math.tan(fp) / r1) * (
        (d**2) / 2.0
        - (5.0 + 3.0 * t1 + 10.0 * c1 - 4.0 * (c1**2) - 9.0 * e2) * (d**4) / 24.0
        + (61.0 + 90.0 * t1 + 298.0 * c1 + 45.0 * (t1**2) - 252.0 * e2 - 3.0 * (c1**2)) * (d**6) / 720.0
    )

    lon = long0 + (
        d
        - (1.0 + 2.0 * t1 + c1) * (d**3) / 6.0
        + (5.0 - 2.0 * c1 + 28.0 * t1 - 3.0 * (c1**2) + 8.0 * e2 + 24.0 * (t1**2)) * (d**5) / 120.0
    ) / math.cos(fp)

    return round(math.degrees(lon), 6), round(math.degrees(lat), 6)


TOWN_CODE_TO_NAME: dict[str, str] = {
    "63000010": "松山區",
    "63000020": "信義區",
    "63000030": "大安區",
    "63000040": "中山區",
    "63000050": "中正區",
    "63000060": "大同區",
    "63000070": "萬華區",
    "63000080": "文山區",
    "63000090": "南港區",
    "63000100": "內湖區",
    "63000110": "士林區",
    "63000120": "北投區",
}
NAME_TO_TOWN_CODE = {v: k for k, v in TOWN_CODE_TO_NAME.items()}


def main() -> None:
    print("Preparing Tree Taipei app data...")

    summary_file = NORMALIZED / "normalization_summary.json"
    summary = json.loads(summary_file.read_text(encoding="utf-8"))
    shutil.copyfile(summary_file, PUBLIC_DATA / "normalization_summary.json")

    # Load normalized source datasets
    street_trees_raw = json.loads((NORMALIZED / "trees_street.json").read_text(encoding="utf-8"))["items"]
    park_trees_raw = json.loads((NORMALIZED / "trees_park.json").read_text(encoding="utf-8"))["items"]
    tree_holes_raw = json.loads((NORMALIZED / "tree_holes.json").read_text(encoding="utf-8"))["items"]
    parks_raw = json.loads((NORMALIZED / "parks.json").read_text(encoding="utf-8"))["items"]
    sidewalks_raw = json.loads((NORMALIZED / "sidewalks.geojson").read_text(encoding="utf-8"))["features"]

    assert len(street_trees_raw) == summary["street_trees"], f"Mismatch street trees: {len(street_trees_raw)}"
    assert len(park_trees_raw) == summary["park_trees"], f"Mismatch park trees: {len(park_trees_raw)}"
    assert len(tree_holes_raw) == summary["tree_holes_deduplicated"], f"Mismatch tree holes: {len(tree_holes_raw)}"
    assert len(parks_raw) == summary["parks"], f"Mismatch parks: {len(parks_raw)}"
    assert len(sidewalks_raw) == summary["sidewalk_features"], f"Mismatch sidewalks: {len(sidewalks_raw)}"

    print("Source counts verified against normalization_summary.json:")
    print(f"  Street trees: {len(street_trees_raw)}")
    print(f"  Park trees: {len(park_trees_raw)}")
    print(f"  Deduplicated tree holes: {len(tree_holes_raw)}")
    print(f"  Parks: {len(parks_raw)}")
    print(f"  Sidewalk features: {len(sidewalks_raw)}")

    # 1. Process Parks (normalize swapped coordinates, build clean list)
    clean_parks: list[dict[str, object]] = []
    parks_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    for p in parks_raw:
        district = (p.get("pm_regions") or "").strip()
        raw_lon = float(p.get("pm_Longitude") or 0.0)
        raw_lat = float(p.get("pm_Latitude") or 0.0)
        # Coordinate swap fix for known anomaly (e.g. 華江二號公園)
        if 24.0 < raw_lon < 26.0 and 120.0 < raw_lat < 123.0:
            lon, lat = raw_lat, raw_lon
            coord_note = "經緯度原始資料對調，已校正"
        else:
            lon, lat = raw_lon, raw_lat
            coord_note = "官方標準經緯度"

        park_item = {
            "id": str(p.get("SeqNo") or ""),
            "name": (p.get("pm_name") or "").strip(),
            "name_en": (p.get("pm_name_eng") or "").strip(),
            "district": district,
            "location": (p.get("pm_location") or "").strip(),
            "area_sqm": float(p.get("pm_LandPublicArea") or 0.0) if p.get("pm_LandPublicArea") else None,
            "year_opened": (p.get("pm_const_year") or "").strip(),
            "unit": (p.get("pm_unit") or "").strip(),
            "lon": round(lon, 6),
            "lat": round(lat, 6),
            "coord_note": coord_note,
            "overview": (p.get("pm_overview") or "").strip(),
            "sports": (p.get("pm_sports") or "").strip(),
            "recreation": (p.get("pm_recreation") or "").strip(),
            "service": (p.get("pm_service") or "").strip(),
            "transit": (p.get("pm_transit") or "").strip(),
            "source": "taipei_parks_api",
            "snapshot_date": "2026-10-14",
        }
        clean_parks.append(park_item)
        if district:
            parks_by_district[district].append(park_item)

    # 2. Build spatial indexes for street trees and sidewalks
    print("Building spatial grid for street trees and sidewalks...")
    tree_grid: dict[tuple[int, int], list[dict[str, object]]] = defaultdict(list)
    trees_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    cell_tree = 200

    for t in street_trees_raw:
        x, y = t["x_twd97"], t["y_twd97"]
        gx = int(x // cell_tree)
        gy = int(y // cell_tree)
        tree_grid[(gx, gy)].append(t)
        trees_by_district[t["district"]].append(t)

    park_trees_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    for pt in park_trees_raw:
        park_trees_by_district[pt["district"]].append(pt)

    # Sidewalk index
    sw_grid: dict[tuple[int, int], list[tuple[float, float, str]]] = defaultdict(list)
    sw_dict: dict[str, dict[str, object]] = {}
    sidewalks_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    cell_sw = 500

    for sw in sidewalks_raw:
        props = sw["properties"]
        sw_id = props["ID"]
        sw_dict[sw_id] = props
        town_code = props.get("Town_N") or ""
        dist_name = TOWN_CODE_TO_NAME.get(town_code, "未知行政區")

        poly = sw["geometry"]["coordinates"][0][0]
        cx = sum(p[0] for p in poly) / len(poly)
        cy = sum(p[1] for p in poly) / len(poly)
        gx = int(cx // cell_sw)
        gy = int(cy // cell_sw)
        sw_grid[(gx, gy)].append((cx, cy, sw_id))

        # Convert sidewalk coords to WGS84 for district file
        wgs_coords = []
        for polygon in sw["geometry"]["coordinates"]:
            wgs_poly = []
            for ring in polygon:
                wgs_ring = [list(twd97_to_wgs84(pt[0], pt[1])) for pt in ring]
                wgs_poly.append(wgs_ring)
            wgs_coords.append(wgs_poly)

        sidewalk_feature = {
            "type": "Feature",
            "properties": {
                "id": sw_id,
                "district": dist_name,
                "road": props.get("NAME_Road"),
                "start": props.get("PSTART"),
                "end": props.get("PEND"),
                "side": props.get("SW_DIRECT"),
                "len_m": props.get("SW_LENG_ItemValue"),
                "wth_m": props.get("SW_WTH_ItemValue"),
                "clear_wth_m": props.get("SWW_WTH"),
                "code": props.get("code"),
                "area_sqm": props.get("Shape_AR_ItemValue"),
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": wgs_coords,
            },
        }
        sidewalks_by_district[dist_name].append(sidewalk_feature)

    # 3. Process Tree Holes and Compute Derived Shade Gap Candidates
    print("Computing derived shade gap candidates from deduplicated tree holes...")
    clean_holes: list[dict[str, object]] = []
    shade_candidates: list[dict[str, object]] = []
    holes_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    candidates_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)

    tier_counts = Counter()

    for idx, h in enumerate(tree_holes_raw):
        hx, hy = h["x_twd97"], h["y_twd97"]
        lon, lat = twd97_to_wgs84(hx, hy)

        # Nearest street tree lookup
        gx, gy = int(hx // cell_tree), int(hy // cell_tree)
        nearby_trees = []
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nearby_trees.extend(tree_grid.get((gx + dx, gy + dy), []))

        min_tree_dist = float("inf")
        nearest_tree = None
        for t in nearby_trees:
            d = math.hypot(t["x_twd97"] - hx, t["y_twd97"] - hy)
            if d < min_tree_dist:
                min_tree_dist = d
                nearest_tree = t

        # Nearest sidewalk lookup
        sgx, sgy = int(hx // cell_sw), int(hy // cell_sw)
        nearby_sws = []
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nearby_sws.extend(sw_grid.get((sgx + dx, sgy + dy), []))

        min_sw_dist = float("inf")
        nearest_sw_id = None
        for cx, cy, sw_id in nearby_sws:
            d = math.hypot(cx - hx, cy - hy)
            if d < min_sw_dist:
                min_sw_dist = d
                nearest_sw_id = sw_id

        sw_props = sw_dict.get(nearest_sw_id, {})
        sw_town_code = str(sw_props.get("Town_N") or "")
        dist_from_sw = TOWN_CODE_TO_NAME.get(sw_town_code)
        dist_from_tree = nearest_tree["district"] if nearest_tree else None
        district = dist_from_sw or dist_from_tree or "中正區"

        road_from_sw = sw_props.get("NAME_Road")
        road_from_hole = h.get("road_name")
        road_from_tree = nearest_tree.get("road_name") if nearest_tree else None
        road_name = road_from_hole or road_from_sw or road_from_tree or "臺北市人行道路段"

        sw_wth = float(sw_props.get("SW_WTH_ItemValue") or 0.0)
        sw_clear = float(sw_props.get("SWW_WTH") or 0.0)
        shape_type = h.get("shape_type") or "未知樹穴"
        is_strip = (shape_type == "帶狀樹穴")
        length_m = float(h.get("length_m") or 0.0)
        area_sqm = float(h.get("area_sqm") or 0.0)

        # Build clean tree hole record
        hole_record = {
            "hole_id": h["tree_hole_id"],
            "district": district,
            "road_name": road_name,
            "shape_type": shape_type,
            "length_m": length_m,
            "area_sqm": area_sqm,
            "x_twd97": hx,
            "y_twd97": hy,
            "lon": lon,
            "lat": lat,
            "updated_at": h.get("updated_at"),
            "source": "taipei_tree_hole",
            "snapshot_date": "2026-10-14",
        }
        clean_holes.append(hole_record)
        holes_by_district[district].append(hole_record)

        # Derived Heuristic Classification
        if min_tree_dist >= 5.0 and (sw_wth >= 2.0 or sw_clear >= 1.5):
            tier = "高潛力獨立空穴"
            priority = 1
            confidence = "高（具備淨寬與空穴）"
            why = f"官方登記{shape_type}，半徑 5 公尺內查無現存行道樹登錄（最近樹距 {min_tree_dist:.1f}m），人行道總寬 {sw_wth:.1f}m、淨寬 {sw_clear:.1f}m，具備優先補植遮蔭喬木空間。"
            recommended_capacity = 1
        elif is_strip and length_m >= 8.0:
            tier = "帶狀綠帶連續補植空間"
            priority = 2
            confidence = "中高（連續帶狀綠穴）"
            est_capacity = max(1, int(length_m // 6.0))
            why = f"官方登記長度 {length_m:.1f}m、面積 {area_sqm:.1f}m² 之帶狀樹穴，縱深充裕，具備增補 {est_capacity} 株遮蔭喬木或複層植栽潛力（周邊最近樹距 {min_tree_dist:.1f}m）。"
            recommended_capacity = est_capacity
        elif min_tree_dist >= 5.0:
            tier = "狹窄人行道樹穴複查"
            priority = 3
            confidence = "中（需查核人行動線）"
            why = f"登記為{shape_type}且周邊 5 公尺內無有效樹木紀錄，但相鄰人行道總寬度較窄（{sw_wth:.1f}m），需現地評估推車與輪椅無障礙淨寬至少 1.5m 後再行補植。"
            recommended_capacity = 1
        else:
            tier = "既有樹穴維護盤點"
            priority = 4
            confidence = "維護追蹤（既有樹穴）"
            sp = nearest_tree["species"] if nearest_tree else "行道樹"
            why = f"此樹穴半徑 5 公尺內已有登記樹木（樹種：{sp}，距離 {min_tree_dist:.1f}m）。建議現勘確認該植株健康生長狀況、浮根處理及樹穴土壤透水狀態。"
            recommended_capacity = 0

        tier_counts[tier] += 1

        candidate_item = {
            "candidate_id": f"CAND-{h['tree_hole_id']}-{idx+1}",
            "tier": tier,
            "priority": priority,
            "confidence": confidence,
            "district": district,
            "road_name": road_name,
            "shape_type": shape_type,
            "length_m": length_m,
            "area_sqm": area_sqm,
            "lon": lon,
            "lat": lat,
            "x_twd97": hx,
            "y_twd97": hy,
            "why_candidate": why,
            "recommended_capacity": recommended_capacity,
            "source_tree_hole_id": h["tree_hole_id"],
            "nearest_tree": {
                "tree_id": nearest_tree["tree_id"] if nearest_tree else None,
                "species": nearest_tree["species"] if nearest_tree else None,
                "distance_m": round(min_tree_dist, 1) if nearest_tree else None,
            },
            "sidewalk_context": {
                "sidewalk_id": nearest_sw_id,
                "road_name": sw_props.get("NAME_Road"),
                "section": f"{sw_props.get('PSTART', '')} 至 {sw_props.get('PEND', '')}".strip(" 至 "),
                "side": sw_props.get("SW_DIRECT"),
                "total_width_m": sw_wth,
                "clear_width_m": sw_clear,
                "land_use_code": sw_props.get("code"),
            },
            "field_check_checklist": [
                "1. 現地確認樹穴現況：是否有未登錄之既存樹木、幼苗或樹樁殘留",
                "2. 人行淨寬核對：補植後維持無障礙通行淨寬至少 1.5 公尺",
                "3. 地下公共管線避讓：查核台電、瓦斯、自來水等淺埋管線",
                "4. 冠層安全淨空：確認生長範圍不抵觸招牌、公車站牌與路燈照明",
            ],
            "provenance": {
                "is_official": False,
                "dataset_basis": "2026-10 臺北市人行道樹穴與行道樹開放資料快照",
                "methodology": "民間推估遮蔭補植啟發式規則 v1.0",
                "disclaimer": "本資料僅供遮蔭平權空間分析與志工現勘參考，非臺北市政府法定工程或推薦補植清冊。",
            },
        }
        shade_candidates.append(candidate_item)
        candidates_by_district[district].append(candidate_item)

    print("Candidate tier breakdown:", dict(tier_counts))

    # 4. Generate District Summaries & Metrics
    print("Generating district summaries...")
    all_districts = sorted(TOWN_CODE_TO_NAME.values())
    district_summaries: list[dict[str, object]] = []

    for dist in all_districts:
        st_count = len(trees_by_district[dist])
        pt_count = len(park_trees_by_district[dist])
        th_count = len(holes_by_district[dist])
        cand_list = candidates_by_district[dist]
        pk_count = len(parks_by_district[dist])
        sw_list = sidewalks_by_district[dist]
        sw_count = len(sw_list)

        total_sw_length_km = round(sum(f["properties"].get("len_m") or 0.0 for f in sw_list) / 1000.0, 2)
        total_sw_area_sqm = round(sum(f["properties"].get("area_sqm") or 0.0 for f in sw_list), 1)

        # Top tree species
        species_counter = Counter(t["species"] for t in trees_by_district[dist] if t.get("species"))
        top_species = [{"species": sp, "count": c} for sp, c in species_counter.most_common(5)]

        # Candidate breakdown
        c_high = sum(1 for c in cand_list if c["tier"] == "高潛力獨立空穴")
        c_strip = sum(1 for c in cand_list if c["tier"] == "帶狀綠帶連續補植空間")
        c_const = sum(1 for c in cand_list if c["tier"] == "狹窄人行道樹穴複查")
        c_audit = sum(1 for c in cand_list if c["tier"] == "既有樹穴維護盤點")
        total_planting_opportunities = c_high + c_strip + c_const

        # Calculate bounding box from street trees and sidewalks
        xs = [t["x_twd97"] for t in trees_by_district[dist]]
        ys = [t["y_twd97"] for t in trees_by_district[dist]]
        if xs and ys:
            min_lon, min_lat = twd97_to_wgs84(min(xs), min(ys))
            max_lon, max_lat = twd97_to_wgs84(max(xs), max(ys))
            center_lon = round((min_lon + max_lon) / 2, 6)
            center_lat = round((min_lat + max_lat) / 2, 6)
            bounds = [[min_lat, min_lon], [max_lat, max_lon]]
        else:
            center_lon, center_lat = 121.53, 25.04
            bounds = [[25.0, 121.5], [25.1, 121.6]]

        trees_per_km_sw = round(st_count / total_sw_length_km, 1) if total_sw_length_km > 0 else 0.0

        summary_entry = {
            "district": dist,
            "center": [center_lat, center_lon],
            "bounds": bounds,
            "counts": {
                "street_trees": st_count,
                "park_trees": pt_count,
                "total_trees": st_count + pt_count,
                "tree_holes": th_count,
                "parks": pk_count,
                "sidewalks": sw_count,
                "candidates_total": len(cand_list),
                "candidates_planting_opportunities": total_planting_opportunities,
                "candidate_high_empty": c_high,
                "candidate_strip_opportunity": c_strip,
                "candidate_narrow_review": c_const,
                "candidate_existing_audit": c_audit,
            },
            "sidewalk_metrics": {
                "total_length_km": total_sw_length_km,
                "total_area_sqm": total_sw_area_sqm,
                "street_trees_per_km": trees_per_km_sw,
            },
            "top_species": top_species,
        }
        district_summaries.append(summary_entry)

    # 5. Build 500m Citywide Tree Density Grid for performant macro overview
    print("Building 500m city-wide density grid...")
    grid_500: dict[tuple[int, int], dict[str, object]] = {}
    for t in street_trees_raw:
        gx = int(t["x_twd97"] // 500)
        gy = int(t["y_twd97"] // 500)
        if (gx, gy) not in grid_500:
            cx_twd = (gx + 0.5) * 500
            cy_twd = (gy + 0.5) * 500
            w_lon, w_lat = twd97_to_wgs84(cx_twd, cy_twd)
            grid_500[(gx, gy)] = {
                "gx": gx,
                "gy": gy,
                "lon": w_lon,
                "lat": w_lat,
                "street_trees": 0,
                "park_trees": 0,
                "tree_holes": 0,
                "candidates": 0,
                "district": t["district"],
            }
        grid_500[(gx, gy)]["street_trees"] += 1

    for pt in park_trees_raw:
        gx = int(pt["x_twd97"] // 500)
        gy = int(pt["y_twd97"] // 500)
        if (gx, gy) not in grid_500:
            cx_twd = (gx + 0.5) * 500
            cy_twd = (gy + 0.5) * 500
            w_lon, w_lat = twd97_to_wgs84(cx_twd, cy_twd)
            grid_500[(gx, gy)] = {
                "gx": gx,
                "gy": gy,
                "lon": w_lon,
                "lat": w_lat,
                "street_trees": 0,
                "park_trees": 0,
                "tree_holes": 0,
                "candidates": 0,
                "district": pt["district"],
            }
        grid_500[(gx, gy)]["park_trees"] += 1

    for cand in shade_candidates:
        gx = int(cand["x_twd97"] // 500)
        gy = int(cand["y_twd97"] // 500)
        if (gx, gy) in grid_500:
            grid_500[(gx, gy)]["candidates"] += 1

    for h in clean_holes:
        gx = int(h["x_twd97"] // 500)
        gy = int(h["y_twd97"] // 500)
        if (gx, gy) in grid_500:
            grid_500[(gx, gy)]["tree_holes"] += 1

    density_cells = list(grid_500.values())

    # 6. Build District-sliced Compact Tree and Sidewalk files
    print("Writing per-district datasets for fast on-demand loading...")
    for dist in all_districts:
        st_items = []
        for t in trees_by_district[dist]:
            lon, lat = twd97_to_wgs84(t["x_twd97"], t["y_twd97"])
            st_items.append({
                "id": t["tree_id"],
                "sp": t["species"],
                "d_cm": t["diameter_cm"],
                "h_m": t["height_m"],
                "road": t.get("road_name"),
                "ctx": t.get("road_context"),
                "s_date": t.get("survey_date"),
                "u_date": t.get("updated_at"),
                "x": t["x_twd97"],
                "y": t["y_twd97"],
                "lon": lon,
                "lat": lat,
            })

        pt_items = []
        for t in park_trees_by_district[dist]:
            lon, lat = twd97_to_wgs84(t["x_twd97"], t["y_twd97"])
            pt_items.append({
                "id": t["tree_id"],
                "sp": t["species"],
                "d_cm": t["diameter_cm"],
                "h_m": t["height_m"],
                "park": t.get("park_name"),
                "s_date": t.get("survey_date"),
                "u_date": t.get("updated_at"),
                "x": t["x_twd97"],
                "y": t["y_twd97"],
                "lon": lon,
                "lat": lat,
            })

        dist_data = {
            "district": dist,
            "street_trees_count": len(st_items),
            "park_trees_count": len(pt_items),
            "sidewalks_count": len(sidewalks_by_district[dist]),
            "street_trees": st_items,
            "park_trees": pt_items,
            "sidewalks": {
                "type": "FeatureCollection",
                "features": sidewalks_by_district[dist],
            },
        }

        dist_filename = f"{dist}.json"
        dist_json_str = json.dumps(dist_data, ensure_ascii=False)
        (PUBLIC_DISTRICTS / dist_filename).write_text(dist_json_str, encoding="utf-8")

    # 7. Build GeoJSON for Taipei 12 district boundary convex hulls / polygons for basemap
    print("Generating Taipei district polygons for editorial basemap & offline fallback...")
    district_features = []
    for d_summary in district_summaries:
        dist_name = d_summary["district"]
        dist_trees = trees_by_district[dist_name]
        # Generate representative boundary points using grid convex envelope
        b = d_summary["bounds"]
        min_lat, min_lon = b[0]
        max_lat, max_lon = b[1]
        c_lat, c_lon = d_summary["center"]

        # Simple polygon bounding box envelope
        district_poly = [
            [min_lon, min_lat],
            [max_lon, min_lat],
            [max_lon, max_lat],
            [min_lon, max_lat],
            [min_lon, min_lat],
        ]
        district_features.append({
            "type": "Feature",
            "properties": {
                "district": dist_name,
                "total_trees": d_summary["counts"]["total_trees"],
                "street_trees": d_summary["counts"]["street_trees"],
                "park_trees": d_summary["counts"]["park_trees"],
                "candidates": d_summary["counts"]["candidates_planting_opportunities"],
                "center": [c_lat, c_lon],
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [district_poly],
            },
        })

    districts_geojson = {
        "type": "FeatureCollection",
        "features": district_features,
    }

    # 8. Build Taipei Main River waterways for editorial basemap
    rivers_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "淡水河", "name_en": "Tamsui River"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [121.4925, 25.0180],
                        [121.4910, 25.0350],
                        [121.4980, 25.0550],
                        [121.5070, 25.0850],
                        [121.4950, 25.1150],
                        [121.4650, 25.1300],
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {"name": "基隆河", "name_en": "Keelung River"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [121.6150, 25.0550],
                        [121.5950, 25.0600],
                        [121.5750, 25.0580],
                        [121.5550, 25.0750],
                        [121.5300, 25.0800],
                        [121.5180, 25.0880],
                        [121.5050, 25.1100],
                        [121.4700, 25.1250],
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {"name": "新店溪", "name_en": "Xindian River"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [121.5400, 24.9850],
                        [121.5320, 25.0050],
                        [121.5150, 25.0200],
                        [121.4925, 25.0180],
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {"name": "景美溪", "name_en": "Jingmei River"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [121.6000, 24.9950],
                        [121.5750, 24.9900],
                        [121.5480, 24.9880],
                        [121.5400, 24.9850],
                    ],
                },
            },
        ],
    }

    # Save to data/derived/ and public/data/
    def save_both(filename: str, obj: object) -> None:
        content = json.dumps(obj, ensure_ascii=False, indent=2)
        (DERIVED / filename).write_text(content, encoding="utf-8")
        (PUBLIC_DATA / filename).write_text(content, encoding="utf-8")

    save_both("shade_gap_candidates.json", {
        "count": len(shade_candidates),
        "snapshot_date": "2026-10-14",
        "heuristic_version": "1.0",
        "tier_summary": dict(tier_counts),
        "items": shade_candidates,
    })

    save_both("districts_summary.json", {
        "city": "臺北市",
        "snapshot_date": "2026-10-14",
        "total_summary": summary,
        "districts": district_summaries,
    })

    save_both("parks.json", {
        "count": len(clean_parks),
        "snapshot_date": "2026-10-14",
        "source": "taipei_parks_api",
        "items": clean_parks,
    })

    save_both("tree_holes.json", {
        "count": len(clean_holes),
        "snapshot_date": "2026-10-14",
        "source": "taipei_tree_hole",
        "items": clean_holes,
    })

    save_both("density_grid.json", {
        "cell_size_m": 500,
        "cells": density_cells,
    })

    save_both("taipei_districts.geojson", districts_geojson)
    save_both("taipei_rivers.geojson", rivers_geojson)

    print("Data preparation complete!")
    print(f"Generated {len(shade_candidates)} derived shade gap candidates.")
    print(f"Generated {len(clean_parks)} clean parks.")
    print(f"Generated {len(clean_holes)} clean deduplicated tree holes.")
    print(f"Generated {len(density_cells)} 500m density grid cells.")
    print(f"Generated per-district datasets for {len(all_districts)} districts in public/data/districts/.")


if __name__ == "__main__":
    main()
