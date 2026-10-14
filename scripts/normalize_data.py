from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "normalized"
OUT.mkdir(parents=True, exist_ok=True)


def num(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def csv_rows(name: str) -> list[dict[str, str]]:
    with (RAW / name).open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write(name: str, value: object) -> None:
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def normalize_trees(rows: list[dict[str, str]], source: str, park: bool = False) -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    seen: set[tuple[str, float | None, float | None]] = set()
    for row in rows:
        x, y = num(row.get("TWD97X")), num(row.get("TWD97Y"))
        tree_id = (row.get("TreeID") or "").strip()
        key = (tree_id, x, y)
        if key in seen:
            continue
        seen.add(key)
        item: dict[str, object] = {
            "tree_id": tree_id,
            "district": (row.get("Dist") or "").strip(),
            "species": (row.get("TreeType") or "").strip(),
            "diameter_cm": num(row.get("Diameter")),
            "height_m": num(row.get("TreeHeight")),
            "survey_date": (row.get("SurveyDate") or "").strip() or None,
            "updated_at": (row.get("UpdDate") or "").strip() or None,
            "x_twd97": x,
            "y_twd97": y,
            "source": source,
        }
        if park:
            item["park_name"] = (row.get("ParkName") or "").strip()
        else:
            item["road_name"] = (row.get("Region") or "").strip()
            item["road_context"] = (row.get("RegionRemark") or "").strip()
        result.append(item)
    return result


def main() -> None:
    street = normalize_trees(csv_rows("TaipeiTree.csv"), "taipei_street_tree")
    park = normalize_trees(csv_rows("TaipeiParkTree.csv"), "taipei_park_tree", True)
    raw_holes = csv_rows("TaipeiTreeHole.csv")
    holes: list[dict[str, object]] = []
    seen: set[tuple[str, float | None, float | None, str]] = set()
    for row in raw_holes:
        x, y = num(row.get("TWD97X")), num(row.get("TWD97Y"))
        hole_id = (row.get("TreeHoleID") or "").strip()
        shape = (row.get("ShapeType") or "").strip()
        key = (hole_id, x, y, shape)
        if key in seen:
            continue
        seen.add(key)
        holes.append({
            "tree_hole_id": hole_id,
            "shape_type": shape,
            "length_m": num(row.get("Length")),
            "area_sqm": num(row.get("Area")),
            "road_name": (row.get("Region") or "").strip(),
            "remark": (row.get("Remark") or "").strip() or None,
            "x_twd97": x,
            "y_twd97": y,
            "updated_at": (row.get("UpdDate") or "").strip() or None,
            "source": "taipei_tree_hole",
        })
    sidewalks = json.loads((RAW / "sidewalks.json").read_text(encoding="utf-8"))
    parks = json.loads((RAW / "parks.json").read_text(encoding="utf-8"))
    write("trees_street.json", {"count": len(street), "items": street})
    write("trees_park.json", {"count": len(park), "items": park})
    write("tree_holes.json", {"raw_count": len(raw_holes), "count": len(holes), "items": holes})
    write("sidewalks.geojson", sidewalks)
    write("parks.json", {"count": len(parks), "items": parks})
    write("normalization_summary.json", {
        "street_trees": len(street),
        "park_trees": len(park),
        "tree_holes_raw": len(raw_holes),
        "tree_holes_deduplicated": len(holes),
        "parks": len(parks),
        "sidewalk_features": len(sidewalks.get("features", [])),
    })


if __name__ == "__main__":
    main()
    print(json.dumps(json.loads((OUT / "normalization_summary.json").read_text()), ensure_ascii=False, indent=2))
