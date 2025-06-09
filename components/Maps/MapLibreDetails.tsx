"use client";

import { BikeCounter } from "@prisma/client";
import { StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { defaultCenters } from "@/lib/defaultCenters";

interface MapLibreDetailsProps {
  counter: BikeCounter;
  mapStyle: StyleSpecification;
  isActive: boolean;
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

function findContainingCircle(
  point: { lat: number; lng: number },
  circles: Record<string, { lat: number; lng: number; radius: number }>
) {
  const sortedCircles = Object.entries(circles)
    .map(([key, circle]) => ({
      key,
      ...circle,
    }))
    .sort((a, b) => a.radius - b.radius);

  return sortedCircles.find(
    (circle) =>
      haversineDistance(point.lat, point.lng, circle.lat, circle.lng) <=
      circle.radius
  );
}

export default function MapLibreDetails({
  counter,
  mapStyle,
  isActive,
}: MapLibreDetailsProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [showWeatherCircles, setShowWeatherCircles] = useState(false);
  const [containingCircle, setContainingCircle] = useState<{
    key: string;
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);

  useEffect(() => {
    const circle = findContainingCircle(
      { lat: counter.latitude, lng: counter.longitude },
      defaultCenters
    );
    setContainingCircle(circle || null);
  }, [counter]);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [counter.longitude, counter.latitude],
      zoom: 14,
      interactive: true,
      maxBounds: bounds,
      maxZoom: 18,
      attributionControl: false,
    });

    map.current.on("load", () => {
      // Ajout du marqueur du compteur
      new maplibregl.Marker({
        color: isActive ? "#22c55e" : "#ef4444",
      })
        .setLngLat([counter.longitude, counter.latitude])
        .addTo(map.current!);

      // Ajout d'un cercle autour du compteur
      map.current!.addSource("counter-radius", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [counter.longitude, counter.latitude],
          },
        },
      });

      // Ajout du cercle météo contenant le compteur
      if (containingCircle) {
        const circleId = `weather-circle-${containingCircle.key}`;
        const circlePolygon = createGeoJSONCircle(
          {
            lat: containingCircle.lat,
            lng: containingCircle.lng,
            radius: containingCircle.radius,
          },
          containingCircle.radius
        );
        const circleSource = {
          type: "geojson" as const,
          data: circlePolygon,
        };
        map.current!.addSource(circleId, circleSource);
        map.current!.addLayer({
          id: circleId,
          type: "fill",
          source: circleId,
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.1,
          },
          layout: {
            visibility: "none",
          },
        });
        map.current!.addLayer({
          id: `${circleId}-border`,
          type: "line",
          source: circleId,
          paint: {
            "line-color": "#3b82f6",
            "line-width": 1,
          },
          layout: {
            visibility: "none",
          },
        });

        // Ajout du marqueur pour le centre du cercle météo
        map.current!.addSource(`${circleId}-center`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [containingCircle.lng, containingCircle.lat],
            },
          },
        });

        map.current!.addLayer({
          id: `${circleId}-center`,
          type: "circle",
          source: `${circleId}-center`,
          paint: {
            "circle-radius": 6,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
          layout: {
            visibility: "none",
          },
        });
      }
    });

    // Gestionnaire d'événements pour le zoom
    map.current.on("zoom", () => {
      if (map.current) {
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        if (
          Math.abs(center.lng - counter.longitude) > 0.0001 ||
          Math.abs(center.lat - counter.latitude) > 0.0001
        ) {
          map.current.easeTo({
            center: [counter.longitude, counter.latitude],
            zoom: zoom,
            duration: 300,
          });
        }
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [counter, mapStyle, isActive, containingCircle]);

  const toggleWeatherCircles = () => {
    if (map.current && containingCircle) {
      const visibility = showWeatherCircles ? "none" : "visible";
      const circleId = `weather-circle-${containingCircle.key}`;
      map.current.setLayoutProperty(circleId, "visibility", visibility);
      map.current.setLayoutProperty(`${circleId}-border`, "visibility", visibility);
      map.current.setLayoutProperty(`${circleId}-center`, "visibility", visibility);
      setShowWeatherCircles(!showWeatherCircles);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {containingCircle && (
        <button
          onClick={toggleWeatherCircles}
          className="absolute top-4 right-4 bg-white px-3 py-1 rounded-lg shadow-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {showWeatherCircles ? "Masquer" : "Afficher"} cercle météo
        </button>
      )}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => map.current?.zoomIn({ duration: 300 })}
          className="bg-white p-1.5 rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-black"
          title="Zoom +"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={() => map.current?.zoomOut({ duration: 300 })}
          className="bg-white p-1.5 rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-black"
          title="Zoom -"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
