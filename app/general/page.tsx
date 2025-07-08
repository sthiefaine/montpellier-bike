"use client";

import { useState, useEffect } from "react";
import { getGlobalDailyStatsForYear, getGlobalEvolutionStatsForPeriods, getDailyDistributionStats } from "@/actions/counters/daily";
import CounterEvolutionChart from "@/components/Stats/Counters/CounterEvolutionChart";
import DailyDistributionChart from "@/components/Stats/Counters/DailyDistributionChart";
import HourlyDistributionChart from "@/components/Stats/Counters/HourlyDistributionChart";
import RangePicker from "@/components/RangePicker";
import { CounterGlobalDailyStats } from "@/types/counters/counters";

export default function GeneralPage() {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  
  // Utiliser l'année précédente comme période par défaut car les données actuelles s'arrêtent probablement en 2024
  const defaultYear = currentYear;
  const defaultPreviousYear = previousYear;
  
  // Première période (année précédente par défaut)
  const [startDate, setStartDate] = useState(`${defaultYear}-01-01`);
  const [endDate, setEndDate] = useState(`${defaultYear}-12-31`);
  
  // Deuxième période (année précédente de l'année précédente par défaut)
  const [startDate2, setStartDate2] = useState(`${defaultPreviousYear}-01-01`);
  const [endDate2, setEndDate2] = useState(`${defaultPreviousYear}-12-31`);
  
  const [globalDailyStats, setGlobalDailyStats] = useState<CounterGlobalDailyStats | null>(null);
  const [evolutionStats, setEvolutionStats] = useState<any>(null);
  const [dailyDistributionStats, setDailyDistributionStats] = useState<any>(null);
  const [hourlyByDayStats, setHourlyByDayStats] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aggregation, setAggregation] = useState<'days' | 'weeks'>('days');
  const [distributionChartType, setDistributionChartType] = useState<'total' | 'average'>('total');
  const [hourlyChartType, setHourlyChartType] = useState<'total' | 'average'>('total');
  const [hourlyFilter, setHourlyFilter] = useState<'global' | 'week' | 'weekend'>('global');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const year = new Date(startDate).getFullYear().toString();
        
        const [dailyData, evolutionData, distributionData, hourlyByDay, yearsData] = await Promise.all([
          getGlobalDailyStatsForYear(year),
          getGlobalEvolutionStatsForPeriods(startDate, endDate, startDate2, endDate2),
          getDailyDistributionStats(startDate, endDate),
          fetch(`/api/fetch-data-counters/hourly-byday?startDate=${startDate}&endDate=${endDate}`).then(res => res.json()),
          fetch('/api/fetch-data-counters/available-years').then(res => res.json())
        ]);
        
        setGlobalDailyStats(dailyData);
        setEvolutionStats(evolutionData);
        setDailyDistributionStats(distributionData);
        setHourlyByDayStats(hourlyByDay);
        setAvailableYears(yearsData);
        
        console.log('Années disponibles:', yearsData);
        console.log('Données horaires reçues:', hourlyByDay);
        console.log('Données de répartition quotidienne reçues:', distributionData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, startDate2, endDate2]);

  // Préparation des données pour HourlyDistributionChart
  function getHourlyData(filter: 'global' | 'week' | 'weekend') {
    // Vérifier que hourlyByDayStats est un tableau valide
    if (!Array.isArray(hourlyByDayStats) || hourlyByDayStats.length === 0) {
      // Retourner des données vides si pas de données disponibles
      return Array.from({ length: 24 }, (_, h) => ({
        name: `${h}h`,
        hour: h,
        total: 0,
        average: 0,
        count: 0,
      }));
    }

    const data = [];
    for (let h = 0; h < 24; h++) {
      let filtered;
      if (filter === 'global') {
        filtered = hourlyByDayStats.filter((s) => s.hour_of_day === h);
      } else if (filter === 'week') {
        filtered = hourlyByDayStats.filter((s) => s.hour_of_day === h && s.day_of_week >= 1 && s.day_of_week <= 5);
      } else {
        filtered = hourlyByDayStats.filter((s) => s.hour_of_day === h && (s.day_of_week === 0 || s.day_of_week === 6));
      }
      data.push({
        name: `${h}h`,
        hour: h,
        total: filtered.reduce((sum, s) => sum + (s.total_passages || 0), 0),
        average:
          filtered.length > 0
            ? filtered.reduce((sum, s) => sum + (s.average_passages || 0), 0) / filtered.length
            : 0,
        count: filtered.reduce((sum, s) => sum + (s.number_of_observations || 0), 0),
      });
    }
    return data;
  }

  const hourlyData = getHourlyData(hourlyFilter);

  const selectedYear = new Date(startDate).getFullYear().toString();

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Statistiques Globales
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Vue d'ensemble de la mobilité douce à Montpellier. Découvrez les tendances 
              et l'évolution du trafic cycliste et piéton sur l'ensemble du réseau.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                📊 Données en temps réel
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                🚴‍♂️ Mobilité douce
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                📈 Tendances annuelles
              </div>
            </div>
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

                  {/* Deuxième période */}
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
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-4 mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Chargement des données...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total Période
                  </h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📊</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoading ? "..." : globalDailyStats?.dailyTotals?.reduce((sum, day) => sum + day.value, 0).toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">
                  passages sur la période
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Moyenne Quotidienne
                  </h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">📈</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoading ? "..." : globalDailyStats?.globalAverage?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">
                  passages par jour
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Jours Actifs
                  </h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">📅</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoading ? "..." : globalDailyStats?.totalDays || '0'}
                </p>
                <p className="text-sm text-gray-600">
                  jours avec données
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
                        Comparaison de la fréquentation totale entre deux périodes personnalisées
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Agrégation :</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setAggregation('days')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              aggregation === 'days'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Jours
                          </button>
                          <button
                            onClick={() => setAggregation('weeks')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              aggregation === 'weeks'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Semaines
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Période 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Période 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[600px] md:h-[700px]">
                    <CounterEvolutionChart
                      evolutionStats={evolutionStats}
                      isLoading={isLoading}
                      aggregation={aggregation}
                    />
                  </div>
                </div>
              </div>
            </div>



            {/* Daily Distribution Chart */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Répartition par jour
                      </h2>
                      <p className="text-gray-600">
                        Répartition de la fréquentation par jour de la semaine
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Type :</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setDistributionChartType('total')}
                          disabled={isLoading}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                            distributionChartType === 'total'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Total
                        </button>
                        <button
                          onClick={() => setDistributionChartType('average')}
                          disabled={isLoading}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                            distributionChartType === 'average'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Moyenne
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[600px]">
                    <DailyDistributionChart
                      stats={dailyDistributionStats}
                      isLoading={isLoading}
                      type={distributionChartType}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly Distribution Chart */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Répartition par heure
                      </h2>
                      <p className="text-gray-600">
                        Répartition de la fréquentation par heure de la journée
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Type :</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setHourlyChartType('total')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              hourlyChartType === 'total'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Total
                          </button>
                          <button
                            onClick={() => setHourlyChartType('average')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              hourlyChartType === 'average'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Moyenne
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Filtre :</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setHourlyFilter('global')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              hourlyFilter === 'global'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Global
                          </button>
                          <button
                            onClick={() => setHourlyFilter('week')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              hourlyFilter === 'week'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Semaine
                          </button>
                          <button
                            onClick={() => setHourlyFilter('weekend')}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                              hourlyFilter === 'weekend'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Weekend
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[600px]">
                    <HourlyDistributionChart
                      stats={{
                        distribution: hourlyData,
                        period: { start: startDate, end: endDate },
                      }}
                      isLoading={isLoading}
                      type={hourlyChartType}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Info - Temporaire */}
            <div className="mt-8 mb-8">
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  🔍 Diagnostic des données
                </h3>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p><strong>Années disponibles avec données :</strong></p>
                  {availableYears.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {availableYears.map((year, index) => (
                        <li key={index}>
                          {year.year} : {year.record_count.toLocaleString()} enregistrements
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucune année trouvée</p>
                  )}
                  <p><strong>Période actuelle :</strong> {startDate} au {endDate}</p>
                  <p><strong>Période 2 :</strong> {startDate2} au {endDate2}</p>
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
                  <li>• Les données sont mises à jour quotidiennement (J+1 7h)</li>
                  <li>• Les compteurs inactifs ne sont pas inclus dans les statistiques</li>
                  <li>• Les données incluent vélos et piétons selon les capteurs</li>
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
