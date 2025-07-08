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

interface FrequentationData {
  period: string;
  value: number;
}

interface FrequentationStats {
  currentYear: FrequentationData[];
  previousYear: FrequentationData[];
  aggregation: 'week' | 'month';
  startDate: string;
  endDate: string;
  previousYearStartDate: string;
  previousYearEndDate: string;
}

interface CounterFrequentationChartProps {
  frequentationStats: FrequentationStats | null;
  isLoading?: boolean;
}

const formatPeriod = (period: string, aggregation: 'week' | 'month') => {
  if (aggregation === 'week') {
    const date = new Date(period);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  } else {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
};

const CustomTooltip = ({ active, payload, label, aggregation }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {formatPeriod(label, aggregation)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value?.toLocaleString()} passages/jour
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CounterFrequentationChart({
  frequentationStats,
  isLoading = false,
}: CounterFrequentationChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!frequentationStats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  // Combiner les données pour l'affichage
  const combinedData = frequentationStats.currentYear.map((current, index) => {
    const previous = frequentationStats.previousYear[index];
    return {
      period: current.period,
      currentYear: current.value,
      previousYear: previous?.value || 0,
    };
  });

  const aggregationLabel = frequentationStats.aggregation === 'week' ? 'Semaine' : 'Mois';

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Fréquentation moyenne par {aggregationLabel.toLowerCase()}
        </h3>
        <p className="text-sm text-gray-600">
          Comparaison avec la même période de l'année précédente
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tickFormatter={(value) => formatPeriod(value, frequentationStats.aggregation)}
            fontSize={12}
            stroke="#6b7280"
          />
          <YAxis 
            fontSize={12}
            stroke="#6b7280"
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip 
            content={<CustomTooltip aggregation={frequentationStats.aggregation} />}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="currentYear"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name={`${new Date(frequentationStats.startDate).getFullYear()}`}
          />
          <Line
            type="monotone"
            dataKey="previousYear"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
            name={`${new Date(frequentationStats.previousYearStartDate).getFullYear()}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 