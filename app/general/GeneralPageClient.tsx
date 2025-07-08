"use client";

import { useState } from "react";
import CounterEvolutionChart from "@/components/Stats/Counters/CounterEvolutionChart";
import DailyDistributionChart from "@/components/Stats/Counters/DailyDistributionChart";
import HourlyDistributionChart from "@/components/Stats/Counters/HourlyDistributionChart";
import RangePicker from "@/components/RangePicker";
import { CounterGlobalDailyStats } from "@/types/counters/counters";
import {
  getGlobalDailyStatsForYear,
  getGlobalDailyStatsForPeriod,
  getGlobalEvolutionStatsForPeriods,
  getDailyDistributionStats,
  getHourlyDistributionStatsWithFilter,
} from "@/actions/counters/daily";

interface GeneralPageClientProps {
  preloadedData: {
    dailyData: CounterGlobalDailyStats | null;
    periodData: CounterGlobalDailyStats | null;
    evolutionData: any;
    distributionData: any;
    hourlyDataGlobal: any;
    hourlyDataWeek: any;
    hourlyDataWeekend: any;
    yearsData: any[];
  };
  defaultStartDate: string;
  defaultEndDate: string;
  defaultStartDate2: string;
  defaultEndDate2: string;
  defaultYear: number;
  defaultPreviousYear: number;
}

export default function GeneralPageClient({
  preloadedData,
  defaultStartDate,
  defaultEndDate,
  defaultStartDate2,
  defaultEndDate2,
  defaultYear,
  defaultPreviousYear,
}: GeneralPageClientProps) {
  // États pour les dates
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [startDate2, setStartDate2] = useState(defaultStartDate2);
  const [endDate2, setEndDate2] = useState(defaultEndDate2);

  // États pour les données (initialisés avec les données préchargées)
  const [globalDailyStats, setGlobalDailyStats] = useState(
    preloadedData.dailyData
  );
  const [periodStats, setPeriodStats] = useState(preloadedData.periodData);
  const [evolutionStats, setEvolutionStats] = useState(
    preloadedData.evolutionData
  );
  const [dailyDistributionStats, setDailyDistributionStats] = useState(
    preloadedData.distributionData
  );
  const [hourlyStatsGlobal, setHourlyStatsGlobal] = useState(
    preloadedData.hourlyDataGlobal
  );
  const [hourlyStatsWeek, setHourlyStatsWeek] = useState(
    preloadedData.hourlyDataWeek
  );
  const [hourlyStatsWeekend, setHourlyStatsWeekend] = useState(
    preloadedData.hourlyDataWeekend
  );
  const [availableYears, setAvailableYears] = useState(preloadedData.yearsData);

  // États pour l'interface
  const [isLoading, setIsLoading] = useState(false);
  const [aggregation, setAggregation] = useState<"days" | "weeks">("weeks");
  const [hourlyFilter, setHourlyFilter] = useState<
    "global" | "week" | "weekend"
  >("global");
  const [hourlyDistributionStats, setHourlyDistributionStats] = useState(
    preloadedData.hourlyDataGlobal
  );
  
  // États pour afficher/masquer les périodes
  const [showPeriod1, setShowPeriod1] = useState(true);
  const [showPeriod2, setShowPeriod2] = useState(true);

  // Fonction pour recharger les données
  const handleReloadData = async () => {
    setIsLoading(true);
    try {
      const year = new Date(startDate).getFullYear().toString();

      // Utiliser directement les dates sélectionnées
      // Les actions SQL gèrent déjà le fuseau horaire avec AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'
      const startDateParis = startDate;
      const endDateParis = endDate;
      const startDate2Paris = startDate2;
      const endDate2Paris = endDate2;

      const [
        dailyData,
        periodData,
        evolutionData,
        distributionData,
        hourlyDataGlobal,
        hourlyDataWeek,
        hourlyDataWeekend,
      ] = await Promise.all([
        getGlobalDailyStatsForYear(year),
        getGlobalDailyStatsForPeriod(startDateParis, endDateParis),
        getGlobalEvolutionStatsForPeriods(
          startDateParis,
          endDateParis,
          startDate2Paris,
          endDate2Paris
        ),
        getDailyDistributionStats(startDateParis, endDateParis),
        getHourlyDistributionStatsWithFilter(startDateParis, endDateParis, "global"),
        getHourlyDistributionStatsWithFilter(startDateParis, endDateParis, "week"),
        getHourlyDistributionStatsWithFilter(startDateParis, endDateParis, "weekend"),
      ]);

      setGlobalDailyStats(dailyData);
      setPeriodStats(periodData);
      setEvolutionStats(evolutionData);
      setDailyDistributionStats(distributionData);
      setHourlyStatsGlobal(hourlyDataGlobal);
      setHourlyStatsWeek(hourlyDataWeek);
      setHourlyStatsWeekend(hourlyDataWeekend);
      setHourlyDistributionStats(hourlyDataGlobal);
    } catch (error) {
      console.error("Erreur lors du rechargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour basculer le filtre horaire côté client
  const handleHourlyFilterChange = (filter: "global" | "week" | "weekend") => {
    setHourlyFilter(filter);

    // Basculer vers les données préchargées
    switch (filter) {
      case "global":
        setHourlyDistributionStats(hourlyStatsGlobal);
        break;
      case "week":
        setHourlyDistributionStats(hourlyStatsWeek);
        break;
      case "weekend":
        setHourlyDistributionStats(hourlyStatsWeekend);
        break;
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
        {/* Animated Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>

        <div className="container mx-auto px-4 py-6 md:py-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Icon and Title Row */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <span className="text-lg md:text-xl">🚴‍♂️</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Statistiques Globales
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-blue-100 mb-4 max-w-2xl mx-auto">
              Explorez les tendances de la mobilité douce à Montpellier
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Date Range Picker */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">
                    Sélectionner les périodes de comparaison
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Première période */}
                  <div className="space-y-4">
                    <RangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                      title="Période 1 (ligne bleue)"
                      color="blue"
                      isLoading={isLoading}
                      maxYear={defaultYear}
                    />
                    <button
                      onClick={handleReloadData}
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Chargement...
                        </>
                      ) : (
                        <>
                          <span>📊</span>
                          Afficher les données
                        </>
                      )}
                    </button>
                  </div>

                  {/* Deuxième période */}
                  <div className="space-y-4">
                    <RangePicker
                      startDate={startDate2}
                      endDate={endDate2}
                      onStartDateChange={setStartDate2}
                      onEndDateChange={setEndDate2}
                      title="Période 2 (ligne verte)"
                      color="green"
                      isLoading={isLoading}
                      maxYear={defaultPreviousYear}
                    />
                    <button
                      onClick={handleReloadData}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Chargement...
                        </>
                      ) : (
                        <>
                          <span>📈</span>
                          Afficher les données
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-blue-600 text-lg">📊</span>
                  <h3 className="text-sm font-medium text-gray-700">
                    Total Période
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading
                    ? "..."
                    : periodStats?.dailyTotals
                        ?.reduce((sum, day) => sum + day.value, 0)
                        .toLocaleString() || "0"}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-green-600 text-lg">📈</span>
                  <h3 className="text-sm font-medium text-gray-700">
                    Moyenne Quotidienne
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading
                    ? "..."
                    : periodStats?.globalAverage?.toLocaleString() || "0"}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-purple-600 text-lg">📅</span>
                  <h3 className="text-sm font-medium text-gray-700">
                    Jours Actifs
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? "..." : periodStats?.totalDays || "0"}
                </p>
              </div>
            </div>

            {/* Evolution Chart */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Graphique d'Évolution
                      </h2>
                      <p className="text-gray-600">
                        Fréquentation totale entre deux périodes personnalisées
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Agrégation :
                        </span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setAggregation("days")}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              aggregation === "days"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            } ${
                              isLoading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Jours
                          </button>
                          <button
                            onClick={() => setAggregation("weeks")}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              aggregation === "weeks"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            } ${
                              isLoading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Semaines
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Période 1</span>
                          <button
                            onClick={() => setShowPeriod1(!showPeriod1)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                              showPeriod1
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {showPeriod1 ? "Masquer" : "Afficher"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Période 2</span>
                          <button
                            onClick={() => setShowPeriod2(!showPeriod2)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                              showPeriod2
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {showPeriod2 ? "Masquer" : "Afficher"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[400px] md:h-[450px]">
                    <CounterEvolutionChart
                      evolutionStats={evolutionStats}
                      isLoading={isLoading}
                      aggregation={aggregation}
                      showHeader={false}
                      showPeriod1={showPeriod1}
                      showPeriod2={showPeriod2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Charts - Side by Side */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Répartition par jour
                    </h2>
                    <p className="text-gray-600">
                      Fréquentation par jour de la semaine
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[400px]">
                    <DailyDistributionChart
                      stats={dailyDistributionStats}
                      isLoading={isLoading}
                      type="total"
                      showHeader={false}
                    />
                  </div>
                </div>
              </div>

              {/* Hourly Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Répartition par heure
                      </h2>
                      <p className="text-gray-600">
                        Fréquentation par heure de la journée
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Filtre :
                      </span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleHourlyFilterChange("global")}
                          disabled={isLoading}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                            hourlyFilter === "global"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          } ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Global
                        </button>
                        <button
                          onClick={() => handleHourlyFilterChange("week")}
                          disabled={isLoading}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                            hourlyFilter === "week"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          } ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Semaine
                        </button>
                        <button
                          onClick={() => handleHourlyFilterChange("weekend")}
                          disabled={isLoading}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                            hourlyFilter === "weekend"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          } ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Weekend
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[400px]">
                    <HourlyDistributionChart
                      stats={hourlyDistributionStats}
                      isLoading={isLoading}
                      type="total"
                      showHeader={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  💡 À propos des données
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>
                    • Les données sont mises à jour quotidiennement (J+1 7h)
                  </li>
                  <li>
                    • Les compteurs inactifs ne sont pas inclus dans les
                    statistiques
                  </li>
                  <li>
                    • Les données incluent vélos et piétons selon les capteurs
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  🌱 Impact environnemental
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Réduction des émissions de CO₂</li>
                  <li>• Amélioration de la qualité de l'air</li>
                  <li>• Promotion de modes de transport durables</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
