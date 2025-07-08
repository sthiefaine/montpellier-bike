"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface WeekendVsWeekdayStats {
  weekdays: {
    total: number;
    average: number;
    count: number;
  };
  weekends: {
    total: number;
    average: number;
    count: number;
  };
  period: {
    start: string;
    end: string;
  };
}

interface WeekendVsWeekdayChartProps {
  stats: WeekendVsWeekdayStats | null;
  isLoading?: boolean;
  type?: 'total' | 'average';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
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

export default function WeekendVsWeekdayChart({
  stats,
  isLoading = false,
  type = 'total'
}: WeekendVsWeekdayChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  // Préparer les données pour le graphique
  const data = [
    {
      name: 'Semaine',
      value: type === 'total' ? stats.weekdays.total : stats.weekdays.average,
      count: stats.weekdays.count,
      color: '#3b82f6'
    },
    {
      name: 'Week-end',
      value: type === 'total' ? stats.weekends.total : stats.weekends.average,
      count: stats.weekends.count,
      color: '#10b981'
    }
  ];

  // Calculer le maximum pour l'axe Y
  const maxValue = Math.max(...data.map(d => d.value));
  const yAxisMax = Math.ceil(maxValue * 1.2); // 20% de marge

  const periodStart = new Date(stats.period.start).toLocaleDateString('fr-FR');
  const periodEnd = new Date(stats.period.end).toLocaleDateString('fr-FR');

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Comparaison Semaine vs Week-end
        </h3>
        <p className="text-sm text-gray-600">
          {type === 'total' ? 'Total des passages' : 'Moyenne quotidienne'} du {periodStart} au {periodEnd}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 40, left: 30, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
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
          
          <Bar 
            dataKey="value" 
            name={type === 'total' ? 'Total passages' : 'Moyenne passages/jour'}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Statistiques détaillées */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">📅 Semaine</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div>Total: {stats.weekdays.total.toLocaleString()} passages</div>
            <div>Moyenne: {stats.weekdays.average.toLocaleString()} passages/jour</div>
            <div>Jours: {stats.weekdays.count} jours</div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">🌅 Week-end</h4>
          <div className="space-y-1 text-sm text-green-800">
            <div>Total: {stats.weekends.total.toLocaleString()} passages</div>
            <div>Moyenne: {stats.weekends.average.toLocaleString()} passages/jour</div>
            <div>Jours: {stats.weekends.count} jours</div>
          </div>
        </div>
      </div>
    </div>
  );
} 