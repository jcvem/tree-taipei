import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  DensityCell,
  DistrictData,
  DistrictSummary,
  LayerVisibilityState,
  ParkItem,
  SelectedFeature,
  ShadeGapCandidate,
  TreeHoleItem,
} from '../types';

interface MapContainerProps {
  selectedDistrict: string;
  layers: LayerVisibilityState;
  shadeCandidates: ShadeGapCandidate[];
  parks: ParkItem[];
  treeHoles: TreeHoleItem[];
  densityGrid: DensityCell[];
  districtSummaries: DistrictSummary[];
  onSelectFeature: (feature: SelectedFeature | null) => void;
  offlineMode: boolean;
  onTileError: () => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  selectedDistrict,
  layers,
  shadeCandidates,
  parks,
  treeHoles,
  densityGrid,
  districtSummaries,
  onSelectFeature,
  offlineMode,
  onTileError,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const offlineLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const featureLayersRef = useRef<{ [key: string]: L.LayerGroup }>({});

  const districtDataCache = useRef<{ [district: string]: DistrictData }>({});
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Taipei Center
    const map = L.map(mapContainerRef.current, {
      center: [25.0478, 121.5318],
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Online OpenStreetMap TileLayer (direct HTTP/2 host with tile buffer)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      keepBuffer: 3,
      className: 'paper-tile-filter',
    });

    tiles.on('tileerror', () => {
      onTileError();
    });

    if (!offlineMode) {
      tiles.addTo(map);
    }
    tileLayerRef.current = tiles;

    // Layer groups for features
    const groups: { [key: string]: L.LayerGroup } = {
      offlineBase: L.layerGroup().addTo(map),
      density: L.layerGroup().addTo(map),
      sidewalks: L.layerGroup().addTo(map),
      streetTrees: L.layerGroup().addTo(map),
      parkTrees: L.layerGroup().addTo(map),
      parks: L.layerGroup().addTo(map),
      treeHoles: L.layerGroup().addTo(map),
      shadeGaps: L.layerGroup().addTo(map),
    };
    featureLayersRef.current = groups;
    offlineLayerGroupRef.current = groups.offlineBase;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Offline Mode Tile Toggle & Load offline vector basemap
  useEffect(() => {
    const map = mapRef.current;
    const tiles = tileLayerRef.current;
    const offlineGroup = offlineLayerGroupRef.current;
    if (!map || !tiles || !offlineGroup) return;

    offlineGroup.clearLayers();

    if (offlineMode) {
      if (map.hasLayer(tiles)) {
        map.removeLayer(tiles);
      }

      // Load district boundaries & rivers GeoJSON
      Promise.all([
        fetch('/data/taipei_districts.geojson').then((r) => r.json()),
        fetch('/data/taipei_rivers.geojson').then((r) => r.json()),
      ])
        .then(([districtsGeo, riversGeo]) => {
          // District boundaries
          L.geoJSON(districtsGeo, {
            style: {
              color: '#c2b9a7',
              weight: 1.5,
              fillColor: '#fbf9f4',
              fillOpacity: 0.65,
              dashArray: '3, 4',
            },
            onEachFeature: (feat, layer) => {
              if (feat.properties && feat.properties.district) {
                layer.bindTooltip(feat.properties.district, {
                  permanent: true,
                  direction: 'center',
                  className: 'district-label-tooltip',
                });
              }
            },
          }).addTo(offlineGroup);

          // Rivers
          L.geoJSON(riversGeo, {
            style: {
              color: '#9db4a8',
              weight: 3.5,
              opacity: 0.7,
            },
          }).addTo(offlineGroup);
        })
        .catch((err) => console.warn('Could not load offline vectors:', err));
    } else {
      if (!map.hasLayer(tiles)) {
        tiles.addTo(map);
      }
    }
  }, [offlineMode]);

  // Load District-sliced trees & sidewalks when a district is selected
  useEffect(() => {
    if (selectedDistrict === 'all') {
      setDistrictData(null);
      return;
    }

    if (districtDataCache.current[selectedDistrict]) {
      setDistrictData(districtDataCache.current[selectedDistrict]);
      return;
    }

    setIsLoadingDistrict(true);
    fetch(`/data/districts/${encodeURIComponent(selectedDistrict)}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DistrictData) => {
        districtDataCache.current[selectedDistrict] = data;
        setDistrictData(data);
      })
      .catch((err) => {
        console.error(`Failed to load data for district ${selectedDistrict}:`, err);
      })
      .finally(() => {
        setIsLoadingDistrict(false);
      });
  }, [selectedDistrict]);

  // Pan / Zoom map when district changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedDistrict === 'all') {
      map.setView([25.0478, 121.5318], 12);
    } else {
      const summary = districtSummaries.find((d) => d.district === selectedDistrict);
      if (summary && summary.bounds) {
        map.fitBounds(summary.bounds, { padding: [24, 24], maxZoom: 15 });
      }
    }
  }, [selectedDistrict, districtSummaries]);

  // Render Features onto Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const {
      density: densityGroup,
      sidewalks: sidewalksGroup,
      streetTrees: streetTreesGroup,
      parkTrees: parkTreesGroup,
      parks: parksGroup,
      treeHoles: treeHolesGroup,
      shadeGaps: shadeGapsGroup,
    } = featureLayersRef.current;

    // Shared Canvas Renderer for high performance
    const canvasRenderer = L.canvas({ padding: 0.5 });

    // 1. Render Shade Gap Candidates Layer
    shadeGapsGroup.clearLayers();
    if (layers.shadeGaps) {
      const filteredCands =
        selectedDistrict === 'all'
          ? shadeCandidates
          : shadeCandidates.filter((c) => c.district === selectedDistrict);

      filteredCands.forEach((cand) => {
        const marker = L.circleMarker([cand.lat, cand.lon], {
          renderer: canvasRenderer,
          radius: cand.priority === 1 ? 6.5 : 5.0,
          color: '#843217',
          weight: 1.5,
          fillColor: '#b45731',
          fillOpacity: 0.88,
        });

        marker.on('click', () => {
          const feat: SelectedFeature = {
            type: 'shade_gap',
            title: `補植候選點 #${cand.source_tree_hole_id}`,
            subtitle: `${cand.district} · ${cand.road_name} (${cand.tier})`,
            isOfficial: false,
            coordinates: {
              lon: cand.lon,
              lat: cand.lat,
              x_twd97: cand.x_twd97,
              y_twd97: cand.y_twd97,
            },
            candidateInfo: cand,
            fields: [
              { label: '評估優先度', value: `第 ${cand.priority} 級 (${cand.tier})` },
              { label: '樹穴型態', value: cand.shape_type },
              { label: '長度 / 面積', value: `${cand.length_m} m / ${cand.area_sqm} m²` },
              { label: '相鄰人行道', value: cand.sidewalk_context.road_name || '無名路段' },
              { label: '人行道總寬 / 淨寬', value: `${cand.sidewalk_context.total_width_m}m / ${cand.sidewalk_context.clear_width_m}m` },
              { label: '相鄰最近行道樹', value: cand.nearest_tree.tree_id ? `${cand.nearest_tree.species} (距 ${cand.nearest_tree.distance_m}m)` : '周邊無樹木' },
              { label: '推估可補植數', value: `${cand.recommended_capacity} 株` },
              { label: '信心評級', value: cand.confidence },
            ],
            sourceAttribution: {
              datasetName: '臺北市人行道固定設施物＿樹穴 ＆ 行道樹分布圖',
              url: 'https://data.gov.tw/dataset/134908',
              snapshotDate: '2026-10-14',
              license: '政府資料開放授權條款第一版',
            },
          };
          onSelectFeature(feat);
        });

        marker.addTo(shadeGapsGroup);
      });
    }

    // 2. Render Tree Holes Layer
    treeHolesGroup.clearLayers();
    if (layers.treeHoles) {
      const filteredHoles =
        selectedDistrict === 'all'
          ? treeHoles
          : treeHoles.filter((h) => h.district === selectedDistrict);

      filteredHoles.forEach((hole) => {
        const marker = L.circleMarker([hole.lat, hole.lon], {
          renderer: canvasRenderer,
          radius: 4,
          color: '#513d2c',
          weight: 1,
          fillColor: '#785f49',
          fillOpacity: 0.75,
        });

        marker.on('click', () => {
          const feat: SelectedFeature = {
            type: 'tree_hole',
            title: `人行道樹穴 #${hole.hole_id}`,
            subtitle: `${hole.district} · ${hole.road_name}`,
            isOfficial: true,
            coordinates: {
              lon: hole.lon,
              lat: hole.lat,
              x_twd97: hole.x_twd97,
              y_twd97: hole.y_twd97,
            },
            fields: [
              { label: '樹穴編號', value: hole.hole_id },
              { label: '樹穴型態', value: hole.shape_type },
              { label: '長度 (m)', value: hole.length_m },
              { label: '面積 (m²)', value: hole.area_sqm },
              { label: '坐落路段', value: hole.road_name },
              { label: '更新日期', value: hole.updated_at },
            ],
            sourceAttribution: {
              datasetName: '臺北市人行道固定設施物＿樹穴',
              url: 'https://data.gov.tw/dataset/134908',
              snapshotDate: hole.snapshot_date,
              license: '政府資料開放授權條款第一版',
            },
          };
          onSelectFeature(feat);
        });

        marker.addTo(treeHolesGroup);
      });
    }

    // 3. Render Parks Layer
    parksGroup.clearLayers();
    if (layers.parks) {
      const filteredParks =
        selectedDistrict === 'all'
          ? parks
          : parks.filter((p) => p.district === selectedDistrict);

      filteredParks.forEach((pk) => {
        const marker = L.circleMarker([pk.lat, pk.lon], {
          renderer: canvasRenderer,
          radius: 5.5,
          color: '#2a4433',
          weight: 1.5,
          fillColor: '#42634d',
          fillOpacity: 0.85,
        });

        marker.on('click', () => {
          const feat: SelectedFeature = {
            type: 'park',
            title: pk.name,
            subtitle: `${pk.district} · ${pk.name_en || '臺北市公園綠地'}`,
            isOfficial: true,
            coordinates: {
              lon: pk.lon,
              lat: pk.lat,
            },
            fields: [
              { label: '公園名稱', value: pk.name },
              { label: '行政區', value: pk.district },
              { label: '座落地點', value: pk.location },
              { label: '面積', value: pk.area_sqm ? `${pk.area_sqm.toLocaleString()} m²` : '未載明' },
              { label: '開闢年份', value: pk.year_opened ? `${pk.year_opened} 年` : '未載明' },
              { label: '管理單位', value: pk.unit },
              { label: '遊憩設施', value: pk.recreation || '休閒步道與綠蔭' },
              { label: '服務設施', value: pk.service || '一般涼亭休憩椅' },
              { label: '大眾運輸', value: pk.transit || '鄰近市區公車路線' },
            ],
            sourceAttribution: {
              datasetName: '臺北市公園基本資料',
              url: 'https://data.taipei/dataset/detail?id=ea732fb5-4bec-4be7-93f2-8ab91e74a6c6',
              snapshotDate: pk.snapshot_date,
              license: '政府資料開放授權條款第一版',
            },
          };
          onSelectFeature(feat);
        });

        marker.addTo(parksGroup);
      });
    }

    // 4. In "All Taipei" Macro Mode: Render 500m Density Grid for Macro View
    densityGroup.clearLayers();
    if (selectedDistrict === 'all' && (layers.streetTrees || layers.parkTrees)) {
      densityGrid.forEach((cell) => {
        const count =
          (layers.streetTrees ? cell.street_trees : 0) +
          (layers.parkTrees ? cell.park_trees : 0);
        if (count === 0) return;

        // Opacity and radius scaled calmly
        const radius = Math.min(14, Math.max(4, Math.log2(count) * 2.0));
        const circle = L.circleMarker([cell.lat, cell.lon], {
          renderer: canvasRenderer,
          radius,
          color: '#2b4d36',
          weight: 0.8,
          fillColor: '#3a5f46',
          fillOpacity: Math.min(0.7, 0.2 + count / 1500),
        });

        circle.bindTooltip(
          `${cell.district} 樹木密度網格: ${count.toLocaleString()} 棵 (樹穴: ${cell.tree_holes} · 候選: ${cell.candidates})`,
          { direction: 'top', className: 'grid-tooltip' }
        );

        circle.addTo(densityGroup);
      });
    }

    // 5. In Specific District Mode: Render detailed street trees, park trees, and sidewalks
    streetTreesGroup.clearLayers();
    parkTreesGroup.clearLayers();
    sidewalksGroup.clearLayers();

    if (districtData) {
      // 5a. Sidewalks
      if (layers.sidewalks && districtData.sidewalks) {
        L.geoJSON(districtData.sidewalks as any, {
          style: {
            color: '#495750',
            weight: 1,
            fillColor: '#6c7a72',
            fillOpacity: 0.35,
          },
          onEachFeature: (feat, layer) => {
            layer.on('click', () => {
              const p = feat.properties;
              const selected: SelectedFeature = {
                type: 'sidewalk',
                title: `人行道：${p.road || '市區道路'}`,
                subtitle: `${p.district} (${p.start || '起點'} 至 ${p.end || '迄點'})`,
                isOfficial: true,
                coordinates: {
                  lon: 0,
                  lat: 0,
                },
                fields: [
                  { label: '人行道路段', value: p.road },
                  { label: '起迄路口', value: `${p.start || '起點'} 至 ${p.end || '迄點'}` },
                  { label: '道路側別', value: p.side },
                  { label: '長度 (m)', value: p.len_m },
                  { label: '總寬度 (m)', value: p.wth_m },
                  { label: '淨通行寬度 (m)', value: p.clear_wth_m },
                  { label: '周邊土地使用', value: p.code },
                ],
                sourceAttribution: {
                  datasetName: '臺北市人行道範圍圖',
                  url: 'https://data.taipei/dataset/detail?id=715d3a83-8445-4496-b6bf-b0900538b7e7',
                  snapshotDate: '2026-10-14',
                  license: '政府資料開放授權條款第一版',
                },
              };
              onSelectFeature(selected);
            });
          },
        }).addTo(sidewalksGroup);
      }

      // 5b. Street Trees
      if (layers.streetTrees && districtData.street_trees) {
        districtData.street_trees.forEach((t) => {
          const marker = L.circleMarker([t.lat, t.lon], {
            renderer: canvasRenderer,
            radius: 3.5,
            color: '#1a3323',
            weight: 0.8,
            fillColor: '#2b4d36',
            fillOpacity: 0.78,
          });

          marker.on('click', () => {
            const feat: SelectedFeature = {
              type: 'street_tree',
              title: `${t.sp || '行道樹'} #${t.id}`,
              subtitle: `${districtData.district} · ${t.road || '道路植穴'} (${t.ctx || '人行道'})`,
              isOfficial: true,
              coordinates: {
                lon: t.lon,
                lat: t.lat,
                x_twd97: t.x,
                y_twd97: t.y,
              },
              fields: [
                { label: '樹木編號', value: t.id },
                { label: '樹種名稱', value: t.sp },
                { label: '米高徑 (cm)', value: t.d_cm },
                { label: '樹高 (m)', value: t.h_m },
                { label: '所在路段', value: t.road },
                { label: '周邊空間說明', value: t.ctx },
                { label: '調查日期', value: t.s_date },
                { label: '最後更新日期', value: t.u_date },
              ],
              sourceAttribution: {
                datasetName: '臺北市行道樹分布圖',
                url: 'https://data.gov.tw/dataset/128274',
                snapshotDate: '2026-10-14',
                license: '政府資料開放授權條款第一版',
              },
            };
            onSelectFeature(feat);
          });

          marker.addTo(streetTreesGroup);
        });
      }

      // 5c. Park Trees
      if (layers.parkTrees && districtData.park_trees) {
        districtData.park_trees.forEach((pt) => {
          const marker = L.circleMarker([pt.lat, pt.lon], {
            renderer: canvasRenderer,
            radius: 3.2,
            color: '#26422d',
            weight: 0.8,
            fillColor: '#42634d',
            fillOpacity: 0.75,
          });

          marker.on('click', () => {
            const feat: SelectedFeature = {
              type: 'park_tree',
              title: `${pt.sp || '公園樹木'} #${pt.id}`,
              subtitle: `${districtData.district} · ${pt.park || '公園綠地'}`,
              isOfficial: true,
              coordinates: {
                lon: pt.lon,
                lat: pt.lat,
                x_twd97: pt.x,
                y_twd97: pt.y,
              },
              fields: [
                { label: '樹木編號', value: pt.id },
                { label: '樹種名稱', value: pt.sp },
                { label: '米高徑 (cm)', value: pt.d_cm },
                { label: '樹高 (m)', value: pt.h_m },
                { label: '坐落公園', value: pt.park },
                { label: '調查日期', value: pt.s_date },
                { label: '最後更新日期', value: pt.u_date },
              ],
              sourceAttribution: {
                datasetName: '臺北市公園樹木分布圖',
                url: 'https://data.gov.tw/dataset/128274',
                snapshotDate: '2026-10-14',
                license: '政府資料開放授權條款第一版',
              },
            };
            onSelectFeature(feat);
          });

          marker.addTo(parkTreesGroup);
        });
      }
    }
  }, [
    layers,
    selectedDistrict,
    shadeCandidates,
    parks,
    treeHoles,
    densityGrid,
    districtData,
  ]);

  return (
    <div className="map-viewport">
      {isLoadingDistrict && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            left: '14px',
            zIndex: 920,
            backgroundColor: 'var(--bg-paper)',
            padding: '4px 10px',
            fontSize: '12px',
            borderRadius: 'var(--radius-sm)',
            border: 'var(--border-hairline)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          載入 {selectedDistrict} 細部樹木與人行道中...
        </div>
      )}

      {offlineMode && (
        <div className="offline-banner">
          <span>離線紙圖模式（呈現 12 行政區與主要水系輪廓）</span>
        </div>
      )}

      <div ref={mapContainerRef} className="leaflet-container-custom" />
    </div>
  );
};
