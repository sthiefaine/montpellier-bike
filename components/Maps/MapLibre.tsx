"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapLibreSkeleton } from "@/components/Maps/MapLibreSkeleton";
import type { BikeCounter } from "@prisma/client";

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
  counters?: (BikeCounter & { isActive: boolean })[];
  onMapReady?: () => void;
  weatherCircles?: WeatherCircle[];
  onCounterSelect?: (counter: BikeCounter | null) => void;
  defaultSelectedCounter?: BikeCounter | null;
  defaultZoom?: number;
  defaultCenter?: {
    lat: number;
    lng: number;
  };
  disableAutoZoom?: boolean;
}

const bounds: maplibregl.LngLatBoundsLike = [
  [3.668, 43.454],
  [4.088, 43.776],
];

function createGeoJSONCircle(
  center: { lng: number; lat: number; radius: number },
  radiusInMeters: number,
  points = 64
): any {
  const radius = center.radius ?? radiusInMeters;
  const coords = [];
  const distanceX = radius / (111320 * Math.cos((center.lat * Math.PI) / 180));
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

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
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

function assignPointsToCircles(
  points: { lat: number; lng: number; id?: any }[],
  circles: { lat: number; lon?: number; lng?: number; radius: number }[]
) {
  const normCircles = circles.map((c) => ({
    lat: c.lat,
    lng: c.lng !== undefined ? c.lng : c.lon!,
    radius: c.radius,
  }));
  const sortedCircles = normCircles.slice().sort((a, b) => a.radius - b.radius);
  return points.map((pt) => {
    const parentIdx = sortedCircles.findIndex(
      (c) => haversineDistance(pt.lat, pt.lng, c.lat, c.lng) <= c.radius
    );
    return {
      ...pt,
      parentCircleIndex: parentIdx >= 0 ? parentIdx : null,
      parentCircle: parentIdx >= 0 ? sortedCircles[parentIdx] : null,
    };
  });
}

function calculateSpiralOffset(index: number, baseOffset = 0.0001) {
  const angle = index * 0.5;
  const radius = baseOffset * (1 + index * 0.2);
  return {
    lng: radius * Math.cos(angle),
    lat: radius * Math.sin(angle)
  };
}

function findOverlappingMarkers(markers: { longitude: number; latitude: number }[]) {
  const overlappingGroups: number[][] = [];
  const processed = new Set<number>();

  markers.forEach((marker1, i) => {
    if (processed.has(i)) return;
    
    const group = [i];
    processed.add(i);

    markers.forEach((marker2, j) => {
      if (i === j || processed.has(j)) return;

      const distance = haversineDistance(
        marker1.latitude,
        marker1.longitude,
        marker2.latitude,
        marker2.longitude
      );

      if (distance < 10) {
        group.push(j);
        processed.add(j);
      }
    });

    if (group.length > 1) {
      overlappingGroups.push(group);
    }
  });

  return overlappingGroups;
}

export default function MapLibre({
  coordinates,
  mapStyle,
  userLocation,
  counters,
  onMapReady,
  weatherCircles,
  onCounterSelect,
  defaultSelectedCounter,
  defaultZoom = 8,
  defaultCenter,
  disableAutoZoom = false,
}: MapLibreProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<BikeCounter | null>(
    defaultSelectedCounter || null
  );

  useEffect(() => {
    if (!mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [defaultCenter?.lng || coordinates.lng, defaultCenter?.lat || coordinates.lat],
      zoom: defaultZoom,
      maxBounds: bounds,
      maxZoom: 18,
      attributionControl: false
    });
    map.current.on("load", () => {
      setIsLoading(false);
      onMapReady?.();
      if (weatherCircles && weatherCircles.length > 0) {
        weatherCircles.forEach((circle, idx) => {
          const circleId = `weather-circle-${idx}`;
          if (!map.current) return;
          if (map.current.getLayer(circleId)) map.current.removeLayer(circleId);
          if (map.current.getLayer(`${circleId}-border`))
            map.current.removeLayer(`${circleId}-border`);
          if (map.current.getSource(circleId))
            map.current.removeSource(circleId);
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
    });
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [ mapStyle, onMapReady, weatherCircles]);

  useEffect(() => {
    if (!counters || !map.current) return;

    // Supprimer tous les marqueurs existants
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Trouver les groupes de marqueurs qui se chevauchent
    const overlappingGroups = findOverlappingMarkers(counters);

    // Créer les nouveaux marqueurs
    counters.forEach((counter, index) => {
      const isActive = counter.isActive;
      const el = document.createElement("div");
      el.className = "marker";
      el.setAttribute('data-counter-id', counter.id);
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

      // Calculer l'offset si le marqueur fait partie d'un groupe qui se chevauche
      let offset = { lng: 0, lat: 0 };
      overlappingGroups.forEach((group, groupIndex) => {
        const markerIndex = group.indexOf(index);
        if (markerIndex !== -1) {
          offset = calculateSpiralOffset(markerIndex);
        }
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([
          counter.longitude + offset.lng,
          counter.latitude + offset.lat
        ])
        .addTo(map.current!);

      marker.getElement().addEventListener("click", () => {
        setSelectedCounter(counter);
        onCounterSelect?.(counter);
        if (!disableAutoZoom) {
          map.current?.flyTo({
            center: [counter.longitude, counter.latitude],
            zoom: 13,
            duration: 1000,
          });
        }
      });

      markersRef.current.push(marker);
    });
  }, [counters]);

  useEffect(() => {
    if (!map.current) return;
    
    markersRef.current.forEach((marker) => {
      const counterId = marker.getElement().getAttribute('data-counter-id');
      const counter = counters?.find(c => c.id === counterId);
      if (counter) {
        const isActive = counter.isActive;
        const el = marker.getElement();
        el.style.backgroundColor = selectedCounter?.id === counter.id
          ? "#3B82F6"
          : isActive
          ? "#22C55E"
          : "#EF4444";
      }
    });
  }, [selectedCounter, counters]);

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

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0">
          <MapLibreSkeleton />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => map.current?.zoomIn({ duration: 300 })}
          className="bg-white p-1.5 rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-black"
          title="Zoom +"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={() => map.current?.zoomOut({ duration: 300 })}
          className="bg-white p-1.5 rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-black"
          title="Zoom -"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={() => {
            map.current?.flyTo({
              center: [coordinates.lng, coordinates.lat],
              zoom: 8,
              duration: 1000,
            });
          }}
          className="bg-white p-1.5 rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-black"
          title="Réinitialiser la vue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
