"use client";

import { useState } from "react";
import MapLibre from "./MapLibre";
import CounterDetails from "./CounterDetails";
import type { BikeCounter } from "@prisma/client";
import type { StyleSpecification } from "maplibre-gl";

interface MapSectionProps {
  mapStyle: StyleSpecification;
  counters: BikeCounter[];
}

export default function MapSection({ mapStyle, counters }: MapSectionProps) {
  const [selectedCounter, setSelectedCounter] = useState<BikeCounter | null>(
    null
  );

  return (
    <div className="flex gap-8 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <section className="w-[50vw] min-w-[800px] h-[calc(100vh-8rem)] ml-8 mt-8 mb-8 rounded-xl overflow-hidden shadow-lg">
        <MapLibre
          coordinates={{ lat: 43.610769, lng: 3.876716 }}
          mapStyle={mapStyle}
          counters={counters}
          onCounterSelect={setSelectedCounter}
        />
      </section>
      <section className="w-[400px] h-[calc(100vh-8rem)] mt-8 mb-8 mr-8">
        <CounterDetails counter={selectedCounter} />
      </section>
    </div>
  );
}
