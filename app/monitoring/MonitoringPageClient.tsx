"use client";
import { useState, useEffect } from "react";
import { BikeCounter } from "@prisma/client";
import CounterDailyBarChart from "@/components/Stats/Counters/CounterDailyBarChart";
import MapLibre from "@/components/Maps/MapLibre";
import { getDailyStatsForYear } from "@/actions/counters/daily";
import Link from "next/link";

interface MonitoringPageClientProps {
  initialCounters: (BikeCounter & {
    isActive: boolean;
    states: {
      1: boolean;
      2: boolean;
      7: boolean;
      14: boolean;
      30: boolean;
    };
  })[];
  initialMapStyle: any;
  initialGlobalDailyStats: any;
  defaultSelectedCounter: BikeCounter | null;
}

export default function MonitoringPageClient({
  initialCounters,
  initialMapStyle,
  defaultSelectedCounter,
}: MonitoringPageClientProps) {
  const [mapStyle, setMapStyle] = useState(initialMapStyle);
  const [selectedCounter, setSelectedCounter] = useState<BikeCounter | null>(
    defaultSelectedCounter || null
  );
  const [selectedCounterDailyStats, setSelectedCounterDailyStats] =
    useState<any>(null);
  const [inactivePeriod, setInactivePeriod] = useState<number>(2);
  const [counters, setCounters] = useState(initialCounters);

  useEffect(() => {
    const updatedCounters = initialCounters.map((counter) => ({
      ...counter,
      isActive:
        counter.states[inactivePeriod as keyof typeof counter.states] || false,
    }));
    setCounters(updatedCounters);
  }, [inactivePeriod, initialCounters]);

  useEffect(() => {
    const fetchCounterData = async () => {
      if (selectedCounter) {
        try {
          const dailyStats = await getDailyStatsForYear(selectedCounter.id);
          setSelectedCounterDailyStats(dailyStats);
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données du compteur:",
            error
          );
          setSelectedCounterDailyStats(null);
        }
      } else {
        setSelectedCounterDailyStats(null);
      }
    };

    fetchCounterData();
  }, [selectedCounter]);

  const inactiveCounters = counters.filter((counter) => !counter.isActive);
  const activeCounters = counters.filter((counter) => counter.isActive);

  return (
    <main className="flex flex-col">
      <div className="bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-[98%] mx-auto">
            <div className="text-center mb-6 md:py-8">
              <div className="flex justify-center mb-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Retour à la carte
                </Link>
              </div>
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
                Monitoring des compteurs de mobilité douce
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Surveillez l'état de tous les compteurs à Montpellier.
              </p>
            </div>

            {/* Sélecteur de période et statistiques de monitoring */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Sélecteur de période */}
              <div className="lg:w-80 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <label
                  htmlFor="period-select"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Détection des compteurs inactifs depuis :
                </label>
                <select
                  id="period-select"
                  value={inactivePeriod}
                  onChange={(e) => setInactivePeriod(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 bg-white text-black"
                >
                  <option value={1}>1 jour</option>
                  <option value={2}>2 jours</option>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>1 mois</option>
                </select>
              </div>

              {/* Statistiques de monitoring */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total compteurs</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {counters.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Compteurs actifs</p>
                      <p className="text-2xl font-bold text-green-600">
                        {activeCounters.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Compteurs inactifs
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {inactiveCounters.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              {/* Carte carrée */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden aspect-square">
                  <MapLibre
                    coordinates={{ lat: 43.610769, lng: 3.876716 }}
                    mapStyle={mapStyle}
                    counters={counters}
                    onCounterSelect={setSelectedCounter}
                    defaultSelectedCounter={defaultSelectedCounter}
                    disableAutoZoom={true}
                  />
                </div>
              </div>

              {/* Monitoring - Critères à droite */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Monitoring - Critères
                  </h3>

                  {/* Informations du compteur sélectionné */}
                  {selectedCounter && (
                    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        Compteur sélectionné
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Nom :
                          </span>
                          <span className="ml-2 text-gray-600">
                            {selectedCounter.name}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            ID :
                          </span>
                          <span className="ml-2 text-gray-600">
                            {selectedCounter.serialNumber}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            URL API :
                          </span>
                          <div className="mt-1">
                            {(() => {
                              const today = new Date();
                              const fromDate = new Date(today);
                              fromDate.setDate(today.getDate() - inactivePeriod);
                              const fromDateString = fromDate.toISOString().split('T')[0] + 'T00%3A00%3A00';
                              
                              return (
                                <a
                                  href={`https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${selectedCounter.serialNumber}/attrs/intensity?fromDate=${fromDateString}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs break-all"
                                >
                                  https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A
                                  {selectedCounter.serialNumber}
                                  /attrs/intensity?fromDate={fromDateString}
                                </a>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 font-medium">•</span>
                      <div>
                        <span className="font-medium">
                          Détection depuis {inactivePeriod}{" "}
                          {inactivePeriod === 1 ? "jour" : "jours"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Les compteurs sont considérés comme inactifs s'ils
                          n'ont pas transmis de données depuis plus de{" "}
                          {inactivePeriod}{" "}
                          {inactivePeriod === 1 ? "jour" : "jours"}.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 font-medium">•</span>
                      <div>
                        <span className="font-medium">
                          Compteurs actifs (vert)
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Compteurs ayant transmis des données dans les derniers{" "}
                          {inactivePeriod}{" "}
                          {inactivePeriod === 1 ? "jour" : "jours"}.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-medium">•</span>
                      <div>
                        <span className="font-medium">
                          Compteurs inactifs (rouge)
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Compteurs n'ayant pas transmis de données depuis plus
                          de {inactivePeriod}{" "}
                          {inactivePeriod === 1 ? "jour" : "jours"}.
                        </p>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      Attention
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      Les compteurs marqués en rouge nécessitent une attention
                      particulière car ils n'ont pas transmis de données depuis
                      plus de {inactivePeriod}{" "}
                      {inactivePeriod === 1 ? "jour" : "jours"}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphique en dessous */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiques journalières globales
              </h3>
              <div className="h-[400px]">
                <CounterDailyBarChart
                  counter={selectedCounter}
                  dailyBarStats={selectedCounterDailyStats}
                  currentYear={new Date().getFullYear().toString()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
