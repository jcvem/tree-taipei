import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { CivicSummaryBar } from './components/CivicSummaryBar';
import { DistrictFilter } from './components/DistrictFilter';
import { LayerControl } from './components/LayerControl';
import { Legend } from './components/Legend';
import { DetailDrawer } from './components/DetailDrawer';
import { MapContainer } from './components/MapContainer';
import { ShadeEquityModal } from './components/ShadeEquityModal';
import { DataSourcesModal } from './components/DataSourcesModal';
import {
  DensityCell,
  DistrictSummary,
  LayerVisibilityState,
  NormalizationSummary,
  ParkItem,
  SelectedFeature,
  ShadeGapCandidate,
  TreeHoleItem,
} from './types';

export const App: React.FC = () => {
  const [summary, setSummary] = useState<NormalizationSummary | null>(null);
  const [districtSummaries, setDistrictSummaries] = useState<DistrictSummary[]>([]);
  const [shadeCandidates, setShadeCandidates] = useState<ShadeGapCandidate[]>([]);
  const [parks, setParks] = useState<ParkItem[]>([]);
  const [treeHoles, setTreeHoles] = useState<TreeHoleItem[]>([]);
  const [densityGrid, setDensityGrid] = useState<DensityCell[]>([]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);

  const [isShadeEquityOpen, setIsShadeEquityOpen] = useState<boolean>(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  const [layers, setLayers] = useState<LayerVisibilityState>({
    shadeGaps: true,
    streetTrees: true,
    parkTrees: true,
    treeHoles: true,
    parks: true,
    sidewalks: true,
  });

  // Load initial datasets progressively for faster initial render
  useEffect(() => {
    // 1. Critical lightweight metadata & macro grid first (~140KB total)
    Promise.all([
      fetch('/data/normalization_summary.json').then((r) => r.json()),
      fetch('/data/districts_summary.json').then((r) => r.json()),
      fetch('/data/density_grid.json').then((r) => r.json()),
    ])
      .then(([sumData, distData, gridData]) => {
        setSummary(sumData);
        setDistrictSummaries(distData.districts || []);
        setDensityGrid(gridData.cells || []);
      })
      .catch((err) => {
        console.error('Failed to load summary datasets:', err);
      });

    // 2. Stream detailed feature layers concurrently in the background
    fetch('/data/shade_gap_candidates.json')
      .then((r) => r.json())
      .then((candData) => setShadeCandidates(candData.items || []))
      .catch((err) => console.error('Failed to load shade candidates:', err));

    fetch('/data/parks.json')
      .then((r) => r.json())
      .then((parkData) => setParks(parkData.items || []))
      .catch((err) => console.error('Failed to load parks:', err));

    fetch('/data/tree_holes.json')
      .then((r) => r.json())
      .then((holeData) => setTreeHoles(holeData.items || []))
      .catch((err) => console.error('Failed to load tree holes:', err));
  }, []);

  const handleToggleLayer = (layerName: keyof LayerVisibilityState) => {
    setLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const currentDistrictSummary =
    selectedDistrict === 'all'
      ? null
      : districtSummaries.find((d) => d.district === selectedDistrict) || null;

  // Compute active counts for chips
  const activeCounts = {
    shadeGaps:
      selectedDistrict === 'all'
        ? shadeCandidates.length
        : shadeCandidates.filter((c) => c.district === selectedDistrict).length,
    streetTrees:
      selectedDistrict === 'all'
        ? summary?.street_trees ?? 90393
        : currentDistrictSummary?.counts.street_trees ?? 0,
    parkTrees:
      selectedDistrict === 'all'
        ? summary?.park_trees ?? 72011
        : currentDistrictSummary?.counts.park_trees ?? 0,
    treeHoles:
      selectedDistrict === 'all'
        ? summary?.tree_holes_deduplicated ?? 1309
        : currentDistrictSummary?.counts.tree_holes ?? 0,
    parks:
      selectedDistrict === 'all'
        ? parks.length
        : parks.filter((p) => p.district === selectedDistrict).length,
    sidewalks:
      selectedDistrict === 'all'
        ? summary?.sidewalk_features ?? 15053
        : currentDistrictSummary?.counts.sidewalks ?? 0,
  };

  return (
    <div className="app-root">
      <Header
        onOpenShadeEquity={() => setIsShadeEquityOpen(true)}
        onOpenDataSources={() => setIsDataSourcesOpen(true)}
        offlineMode={offlineMode}
        onToggleOfflineMode={() => setOfflineMode((prev) => !prev)}
      />

      <main className="map-stage">
        <div className="floating-controls-panel">
          <div className="floating-row">
            <DistrictFilter
              selectedDistrict={selectedDistrict}
              onSelectDistrict={(dist) => setSelectedDistrict(dist)}
              districtSummaries={districtSummaries}
            />
            <CivicSummaryBar
              summary={summary}
              selectedDistrict={selectedDistrict}
              districtSummary={currentDistrictSummary}
              plantingOpportunityCount={
                districtSummaries.reduce(
                  (acc, cur) => acc + cur.counts.candidates_planting_opportunities,
                  0
                ) || 614
              }
            />
          </div>

          <div className="floating-row">
            <LayerControl
              layers={layers}
              onToggleLayer={handleToggleLayer}
              counts={activeCounts}
            />
          </div>
        </div>

        <MapContainer
          selectedDistrict={selectedDistrict}
          layers={layers}
          shadeCandidates={shadeCandidates}
          parks={parks}
          treeHoles={treeHoles}
          densityGrid={densityGrid}
          districtSummaries={districtSummaries}
          onSelectFeature={(feat) => setSelectedFeature(feat)}
          offlineMode={offlineMode}
          onTileError={() => setOfflineMode(true)}
        />

        <Legend />

        <DetailDrawer
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      </main>

      <ShadeEquityModal
        isOpen={isShadeEquityOpen}
        onClose={() => setIsShadeEquityOpen(false)}
      />

      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
        summary={summary}
      />
    </div>
  );
};

export default App;
