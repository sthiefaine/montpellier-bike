"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DailyDistributionData {
  name: string;
  total: number;
  average: number;
  count: number;
  color: string;
  dayOfWeek: number;
}

interface DailyDistributionStats {
  distribution: DailyDistributionData[];
  period: {
    start: string;
    end: string;
  };
}

interface DailyDistributionChartProps {
  stats: DailyDistributionStats | null;
  isLoading?: boolean;
  type?: 'total' | 'average';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-xl shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: data.color }}
          ></div>
          <h3 className="font-bold text-lg text-gray-900">{data.name}</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total:</span>
            <span className="font-bold text-gray-900">{data.payload.total?.toLocaleString()} passages</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Moyenne:</span>
            <span className="font-bold text-gray-900">{data.payload.average?.toLocaleString()} passages/jour</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Jours:</span>
            <span className="font-bold text-gray-900">{data.payload.count} jours</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mt-6">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0" 
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm font-medium text-gray-900 truncate">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DailyDistributionChart({
  stats,
  isLoading = false,
  type = 'total'
}: DailyDistributionChartProps) {
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
        Chargement des données...
      </div>
    );
  }

  if (stats.distribution.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Aucune donnée disponible</p>
          <p className="text-sm text-gray-400">
            Aucune donnée trouvée pour la période du {new Date(stats.period.start).toLocaleDateString('fr-FR')} au {new Date(stats.period.end).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const data = stats.distribution.map(item => ({
    ...item,
    value: type === 'total' ? item.total : item.average
  }));

  const periodStart = new Date(stats.period.start).toLocaleDateString('fr-FR');
  const periodEnd = new Date(stats.period.end).toLocaleDateString('fr-FR');

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Répartition par jour de la semaine
        </h3>
        <p className="text-sm text-gray-600">
          {type === 'total' ? 'Total des passages' : 'Moyenne quotidienne'} du {periodStart} au {periodEnd}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Statistiques détaillées */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Détails par jour</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((item, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg border"
              style={{ 
                borderColor: item.color + '40',
                backgroundColor: item.color + '10'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <h5 className="font-medium text-gray-900">{item.name}</h5>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Total: {item.total.toLocaleString()}</div>
                <div>Moyenne: {item.average.toLocaleString()}/jour</div>
                <div>Jours: {item.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 