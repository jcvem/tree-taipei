# Tree Taipei downloaded data

Downloaded from the official public-data links listed in the repository README on 2026-10-14.

## Files

- `data/raw/TaipeiTree.csv` — Taipei street trees; source: https://tppkl.blob.core.windows.net/blobfs/TaipeiTree.csv
- `data/raw/TaipeiParkTree.csv` — Taipei park trees; source: https://tppkl.blob.core.windows.net/blobfs/TaipeiParkTree.csv
- `data/raw/TaipeiTreeHole.csv` — Taipei street-tree holes; source: https://tppkl.blob.core.windows.net/blobfs/TaipeiTreeHole.csv
- `data/raw/sidewalks.json` — Taipei sidewalk polygons; source resource ID `b11d6142-1d71-41d5-a843-7b7cfcea61ef` from data.taipei
- `data/raw/parks.json` — Taipei parks basic data API: https://parks.gov.taipei/parks/api/

## Source metadata

- Tree and tree-hole source dataset: https://data.gov.tw/dataset/128274
- Tree-hole metadata dataset: https://data.gov.tw/dataset/134908
- Sidewalk metadata dataset: https://data.taipei/dataset/detail?id=715d3a83-8445-4496-b6bf-b0900538b7e7
- Parks metadata dataset: https://data.taipei/dataset/detail?id=ea732fb5-4bec-4be7-93f2-8ab91e74a6c6
- Tree management / removal portal: https://geopkl.gov.taipei/ (not downloaded in this pass; source timed out during retrieval)

## Initial validation

- `TaipeiTree.csv`: downloaded and parses as UTF-8 CSV with TWD97 X/Y fields.
- `TaipeiParkTree.csv`: downloaded and parses as UTF-8 CSV with TWD97 X/Y fields.
- `TaipeiTreeHole.csv`: downloaded and parses as UTF-8 CSV with TWD97 X/Y fields.
- `sidewalks.json`: downloaded as a GeoJSON-like object with `features`.
- `parks.json`: downloaded as a JSON list with 813 records.

The downloaded files are source snapshots, not yet normalized or spatially joined. The tree-hole file contains duplicated-looking records in its first sample; deduplication and geometry validation must be handled in a later data-preparation step rather than assumed here.

## Licensing

The metadata pages identify these datasets as free/open government data under the Government Data Open License, Version 1. Do not remove source attribution from future derived datasets or public visualizations.

## Not yet available

The yearly tree-removal history and reason fields are not included in this download set. The README notes that they are not fully open; use simulated data only when clearly labelled as simulated, or obtain a validated official source before presenting removal statistics as fact.

## Suggested next step

Create normalized derived tables with explicit provenance:

```text
trees_street
 trees_park
 tree_holes
 sidewalks
 parks
```

Then validate coordinate ranges, deduplicate tree holes, and spatially join trees/tree holes to sidewalk polygons before calculating shade-gap candidates.
"}]} ,{