'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';
import maplibregl from 'maplibre-gl';
import { getCounters, getGlobalStats } from './actions/counters';
import MapSection from './components/MapSection';
import HeroSection from './components/HeroSection';

const getMapStyle = cache(async () => {
  const data = await fs.readFile(path.join(process.cwd(), 'data/map/style.json'), 'utf8');
  return JSON.parse(data) as maplibregl.StyleSpecification;
});

export default async function Home() {
  const mapStyle = await getMapStyle();
  const counters = await getCounters();

  return (
    <main className="flex flex-col">
      <HeroSection />
      <MapSection mapStyle={mapStyle} counters={counters} />
    </main>
  );
}
