"use client";

import { useState, useRef, useEffect } from "react";
import MapLibre from "@/components/Maps/MapLibre";
import type { BikeCounter } from "@prisma/client";
import type { StyleSpecification } from "maplibre-gl";
import Link from "next/link";
import { getCurrentSerialNumber } from "@/helpers";

interface CountersListPageClientProps {
  counters: (BikeCounter & { isActive: boolean })[];
  allCounters: (BikeCounter & { isActive: boolean })[];
  mapStyle: StyleSpecification;
  searchParams: {
    search?: string;
    status?: string;
    view?: string;
  };
}

export default function CountersListPageClient({
  counters,
  allCounters,
  mapStyle,
  searchParams,
}: CountersListPageClientProps) {
  const { search, status } = searchParams;
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(
    null
  );
  const listContainerRef = useRef<HTMLDivElement>(null);

  const formatCounterName = (name: string | null) => {
    if (!name) return "";
    return name.replace(/^Compteur Vélo\s*/i, "").trim();
  };

  const createSearchUrl = (newSearch?: string, newStatus?: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newStatus) params.set("status", newStatus);
    return `?${params.toString()}`;
  };

  const handleCounterSelect = (counter: BikeCounter | null) => {
    setSelectedCounterId(counter?.id || null);
  };

  // Auto-scroll vers le compteur sélectionné
  useEffect(() => {
    if (selectedCounterId && listContainerRef.current) {
      const selectedElement = listContainerRef.current.querySelector(
        `[data-counter-id="${selectedCounterId}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [selectedCounterId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Carte à gauche */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Carte des compteurs
        </h2>
        <div className="h-[600px]">
          <MapLibre
            coordinates={{ lat: 43.610769, lng: 3.876716 }}
            mapStyle={mapStyle}
            counters={counters}
            defaultZoom={10}
            onCounterSelect={handleCounterSelect}
            defaultSelectedCounter={null}
          />
        </div>
      </div>

      {/* Liste à droite */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Liste des compteurs
          </h2>
          {selectedCounterId && (
            <div className="text-sm text-blue-600">Compteur sélectionné</div>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un compteur..."
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  const url = createSearchUrl(target.value, status);
                  window.location.href = `/counters${url}`;
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Filtres de statut */}
        <div className="flex gap-2 mb-4">
          <Link
            href={`/counters${createSearchUrl(search, "all")}`}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              !status || status === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous ({allCounters.length})
          </Link>
          <Link
            href={`/counters${createSearchUrl(search, "active")}`}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              status === "active"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Actifs ({allCounters.filter((c) => c.isActive).length})
          </Link>
          <Link
            href={`/counters${createSearchUrl(search, "inactive")}`}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              status === "inactive"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Inactifs ({allCounters.filter((c) => !c.isActive).length})
          </Link>
        </div>

        {/* Liste des compteurs */}
        <div ref={listContainerRef} className="h-[500px] overflow-y-auto">
          <div className="space-y-2">
            {counters.map((counter) => {
              const fixedSerialNumber = getCurrentSerialNumber(
                counter.serialNumber,
                counter.serialNumber1
              );

              return (
                <div
                  key={counter.id}
                  data-counter-id={counter.id}
                  className={`block p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedCounterId === counter.id
                      ? "bg-blue-50 border-blue-300 shadow-md"
                      : counter.isActive
                      ? "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedCounterId(counter.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {formatCounterName(counter.name) ||
                            counter.serialNumber}
                        </h3>
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            counter.isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {fixedSerialNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {counter.latitude.toFixed(6)},{" "}
                        {counter.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <div
                        className={`text-xs px-2 py-1 rounded-full flex items-center justify-center ${
                          counter.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {counter.isActive ? "Actif" : "Inactif"}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/counters/${fixedSerialNumber}`}
                          className="text-xs text-blue-600 hover:text-blue-800 block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir détails →
                        </Link>
                        {selectedCounterId === counter.id && (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Sélectionné
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {counters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun compteur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
