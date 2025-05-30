'use server';

import MapLibre from './components/MapLibre';
import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';
import maplibregl from 'maplibre-gl';
import { getCounters } from './actions/counters';
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
      <HeroSection counters={counters} />
      <section className="w-[50vw] min-w-[800px] h-[calc(100vh-8rem)] ml-8 mt-8 mb-8">
        <MapLibre
          coordinates={{ lat: 43.610769, lng: 3.876716 }}
          mapStyle={mapStyle}
          counters={counters}
        />
      </section>
    </main>
  );
}
