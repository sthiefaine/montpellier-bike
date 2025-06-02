"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapLibreSkeleton } from "./MapLibreSkeleton";
import type { BikeCounter } from "@prisma/client";
import { defaultCenters } from "@/lib/defaultCenters";
import { prisma } from "@/lib/prisma";
import { getCountersStatus } from "@/app/actions/counters";

// Nouveau type pour les cercles météo
export type WeatherCircle = { lat: number; lon: number; radius: number };

interface MapLibreProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  mapStyle: maplibregl.StyleSpecification;
  userLocation?: {
    lat: number;
    lng: number;
  };
  counters?: BikeCounter[];
  onMapReady?: () => void;
  weatherCircles?: WeatherCircle[];
  onCounterSelect?: (counter: BikeCounter | null) => void;
}

const bounds: maplibregl.LngLatBoundsLike = [
  [3.668, 43.454], // Southwest coordinates
  [4.088, 43.776], // Northeast coordinates
];

function createGeoJSONCircle(
  center: { lng: number; lat: number; radius: number },
  radiusInMeters: number,
  points = 64
): any {
  const radius = center.radius ?? radiusInMeters;
  const coords = [];
  const distanceX =
    radius / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const distanceY = radiusInMeters / 110574;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center.lng + x, center.lat + y]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

// Fonction utilitaire pour calculer la distance entre deux points (Haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Rayon de la Terre en mètres
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fonction pour associer chaque point à son cercle parent (le plus petit qui le contient)
function assignPointsToCircles(points: { lat: number; lng: number; id?: any }[], circles: { lat: number; lon?: number; lng?: number; radius: number }[]) {
  // On accepte "lon" ou "lng" pour la compatibilité
  const normCircles = circles.map(c => ({
    lat: c.lat,
    lng: c.lng !== undefined ? c.lng : c.lon!,
    radius: c.radius,
  }));
  // On trie les cercles du plus petit au plus grand rayon
  const sortedCircles = normCircles.slice().sort((a, b) => a.radius - b.radius);
  return points.map(pt => {
    const parentIdx = sortedCircles.findIndex(c =>
      haversineDistance(pt.lat, pt.lng, c.lat, c.lng) <= c.radius
    );
    return {
      ...pt,
      parentCircleIndex: parentIdx >= 0 ? parentIdx : null,
      parentCircle: parentIdx >= 0 ? sortedCircles[parentIdx] : null,
    };
  });
}

export default function MapLibre({
  coordinates,
  mapStyle,
  userLocation,
  counters,
  onMapReady,
  weatherCircles,
  onCounterSelect,
}: MapLibreProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<BikeCounter | null>(null);
  const [activeCounters, setActiveCounters] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchActiveCounters() {
      const activeIds = await getCountersStatus();
      setActiveCounters(activeIds);
    }
    fetchActiveCounters();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [coordinates.lng, coordinates.lat],
      zoom: 10,
      maxBounds: bounds,
      maxZoom: 18,
    });
    map.current.on("load", () => {
      setIsLoading(false);
      onMapReady?.();
      // Affichage des cercles météo si fournis
      if (weatherCircles && weatherCircles.length > 0) {
        weatherCircles.forEach((circle, idx) => {
          const circleId = `weather-circle-${idx}`;
          if (!map.current) return;
          if (map.current.getLayer(circleId)) map.current.removeLayer(circleId);
          if (map.current.getLayer(`${circleId}-border`)) map.current.removeLayer(`${circleId}-border`);
          if (map.current.getSource(circleId)) map.current.removeSource(circleId);
          const circlePolygon = createGeoJSONCircle(
            { lat: circle.lat, lng: circle.lon, radius: circle.radius },
            circle.radius
          );
          const circleSource = {
            type: "geojson" as const,
            data: circlePolygon,
          };
          map.current.addSource(circleId, circleSource);
          map.current.addLayer({
            id: circleId,
            type: "fill",
            source: circleId,
            paint: {
              "fill-color": "#FF0000",
              "fill-opacity": 0.2,
            },
          });
          map.current.addLayer({
            id: `${circleId}-border`,
            type: "line",
            source: circleId,
            paint: {
              "line-color": "#FF0000",
              "line-width": 2,
            },
          });
        });
      }
      // Association points <-> cercles météo
      let circlesToUse = weatherCircles && weatherCircles.length > 0
        ? weatherCircles
        : [];
      if (counters && counters.length > 0) {
        const points = counters.map(c => ({ lat: c.latitude, lng: c.longitude, id: c.id, name: c.name }));
        const result = assignPointsToCircles(points, circlesToUse);
        console.log("Points associés à leur cercle parent :", result);
      }
    });
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [coordinates, mapStyle, onMapReady, weatherCircles, counters]);

  useEffect(() => {
    if (!userLocation || !map.current) return;

    const marker = new maplibregl.Marker({
      color: "#0000FF",
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current!);

    map.current?.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 15,
      duration: 1000,
    });

    return () => {
      if (marker) {
        marker.remove();
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!counters || !map.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    counters.forEach((counter) => {
      const isActive = activeCounters.has(counter.id);
      
      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.backgroundColor = selectedCounter?.id === counter.id 
        ? "#3B82F6" 
        : isActive 
          ? "#22C55E" 
          : "#EF4444";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([counter.longitude, counter.latitude])
        .setPopup(
          new maplibregl.Popup({
            offset: 10,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(`
            <h3 class="font-bold text-black">${counter.name}</h3>
            <p class="text-black">Numéro de série: ${counter.serialNumber}</p>
            <p class="text-black">Statut: ${isActive ? 'Actif' : 'Inactif'}</p>
          `)
        )
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        setSelectedCounter(counter);
        onCounterSelect?.(counter);
      });

      markersRef.current.push(marker);
    });
  }, [counters, onCounterSelect, selectedCounter, activeCounters]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0">
          <MapLibreSkeleton />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

