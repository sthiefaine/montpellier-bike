'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';
import maplibregl from 'maplibre-gl';
import { getCounters } from './actions/counters';
import CounterDetailsSection from '@/app/components/CounterDetailsSection';
import HeroSection from '@/app/components/HeroSection';

const getMapStyle = cache(async () => {
  const data = await fs.readFile(path.join(process.cwd(), 'data/map/style.json'), 'utf8');
  return JSON.parse(data) as maplibregl.StyleSpecification;
});

const getDefaultSelectedCounter = cache(async () => {
  const counters = await getCounters();
  return counters.find((counter) => counter.serialNumber === "X2H21070351" || counter.serialNumber1 === "X2H21070352") || null;
});

export default async function Home() {
  const mapStyle = await getMapStyle();
  const counters = await getCounters();
  const defaultSelectedCounter = await getDefaultSelectedCounter();

  return (
    <main className="flex flex-col">
      <HeroSection />
      <CounterDetailsSection mapStyle={mapStyle} counters={counters} defaultSelectedCounter={defaultSelectedCounter} />
    </main>
  );
}
