"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ChartHeader from "./ChartHeader";

interface EvolutionData {
  day: string;
  total: number;
  average: number;
}

interface EvolutionStats {
  currentYear: EvolutionData[];
  previousYear: EvolutionData[];
  currentYearDate: string;
  previousYearDate: string;
}

interface CounterEvolutionChartProps {
  evolutionStats: EvolutionStats | null;
  isLoading?: boolean;
  aggregation?: "days" | "weeks";
  title?: string;
  description?: string;
  showHeader?: boolean;
  showPeriod1?: boolean;
  showPeriod2?: boolean;
}

const formatDate = (dateString: string, aggregation: "days" | "weeks") => {
  const date = new Date(dateString);

  if (aggregation === "weeks") {
    // Calculer le numéro de semaine ISO 8601
    const getWeekNumber = (date: Date) => {
      const target = new Date(date.valueOf());
      const dayNr = (date.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
      }
      return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    };

    const weekNumber = getWeekNumber(date);
    return `S${weekNumber}`;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const CustomTooltip = ({ active, payload, label, aggregation }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {formatDate(label, aggregation)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value?.toLocaleString()} passages
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CounterEvolutionChart({
  evolutionStats,
  isLoading = false,
  aggregation = "days",
  title,
  description,
  showHeader = true,
  showPeriod1 = true,
  showPeriod2 = true,
}: CounterEvolutionChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!evolutionStats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  // Fonction pour regrouper les données par semaine
  const groupByWeek = (data: EvolutionData[]) => {
    const weeklyData: { [key: string]: EvolutionData[] } = {};

    data.forEach((item) => {
      const date = new Date(item.day);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Lundi
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(item);
    });

    return Object.entries(weeklyData).map(([weekKey, weekItems]) => ({
      day: weekKey,
      total: weekItems.reduce((sum, item) => sum + item.total, 0),
      average: Math.round(
        weekItems.reduce((sum, item) => sum + item.average, 0) /
          weekItems.length
      ),
    }));
  };

  // Préparer les données selon l'agrégation
  let processedCurrentYear = evolutionStats.currentYear;
  let processedPreviousYear = evolutionStats.previousYear;

  if (aggregation === "weeks") {
    processedCurrentYear = groupByWeek(evolutionStats.currentYear);
    processedPreviousYear = groupByWeek(evolutionStats.previousYear);
  }

  // Combiner les données pour l'affichage
  const combinedData = processedCurrentYear.map((current, index) => {
    const previous = processedPreviousYear[index];
    return {
      day: current.day,
      currentTotal: current.total,
      previousTotal: previous?.total || 0,
    };
  });

  const currentYear = new Date(evolutionStats.currentYearDate).getFullYear();
  const previousYear = currentYear - 1;

  // Calculer le maximum réel des données
  const maxValue = Math.max(
    ...combinedData.map((d) => Math.max(d.currentTotal, d.previousTotal))
  );
  const yAxisMax = Math.ceil(maxValue * 1.1); // 10% de marge

  // Fonction wrapper pour le tickFormatter
  const tickFormatter = (value: any) => {
    if (aggregation === "weeks") {
      const date = new Date(value);

      // Calculer le numéro de semaine ISO 8601
      const getWeekNumber = (date: Date) => {
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
        }
        return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      };

      const weekNumber = getWeekNumber(date);

      // Afficher seulement les semaines impaires
      return weekNumber % 2 === 1 ? `S${weekNumber}` : "";
    }
    return formatDate(value, aggregation);
  };

  // Titre et description par défaut si non fournis
  const defaultTitle = title || "Évolution de la fréquentation";
  const defaultDescription = description || `Comparaison entre ${currentYear} et ${previousYear} jusqu'au ${formatDate(evolutionStats.currentYearDate, aggregation)}`;

  return (
    <div className="w-full h-full">
      {showHeader && (
        <ChartHeader 
          title={defaultTitle}
          description={defaultDescription}
        />
      )}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={combinedData}
          margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
            tickFormatter={tickFormatter}
            fontSize={14}
            stroke="#6b7280"
            tickMargin={10}
          />
          <YAxis
            fontSize={14}
            stroke="#6b7280"
            tickFormatter={(value) => value.toLocaleString()}
            tickMargin={10}
            domain={[0, yAxisMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Lignes pour l'année actuelle (Période 1) */}
          {showPeriod1 && (
            <Line
              type="monotone"
              dataKey="currentTotal"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2 }}
              name={`Total ${currentYear}`}
            />
          )}

          {/* Lignes pour l'année précédente (Période 2) */}
          {showPeriod2 && (
            <Line
              type="monotone"
              dataKey="previousTotal"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2 }}
              name={`Total ${previousYear}`}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
