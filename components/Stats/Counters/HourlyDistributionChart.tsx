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

interface HourlyDistributionData {
  name: string;
  hour: number;
  total: number;
  average: number;
  count: number;
}

interface HourlyDistributionStats {
  distribution: HourlyDistributionData[];
  period: {
    start: string;
    end: string;
  };
}

interface HourlyDistributionChartProps {
  stats: HourlyDistributionStats | null;
  isLoading?: boolean;
  type?: 'total' | 'average';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-xl shadow-xl">
        <h3 className="font-bold text-lg text-gray-900 mb-3">{data.payload.name}</h3>
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

export default function HourlyDistributionChart({
  stats,
  isLoading = false,
  type = 'total'
}: HourlyDistributionChartProps) {
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

  if (!stats.distribution || stats.distribution.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Aucune donnée disponible</p>
          <p className="text-sm text-gray-400">
            {stats.period ? 
              `Aucune donnée trouvée pour la période du ${new Date(stats.period.start).toLocaleDateString('fr-FR')} au ${new Date(stats.period.end).toLocaleDateString('fr-FR')}` :
              'Aucune donnée trouvée pour la période sélectionnée'
            }
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

  // Calculer le maximum pour l'axe Y
  const maxValue = Math.max(...data.map(d => d.value));
  const yAxisMax = Math.ceil(maxValue * 1.2);

  const periodStart = new Date(stats.period.start).toLocaleDateString('fr-FR');
  const periodEnd = new Date(stats.period.end).toLocaleDateString('fr-FR');

  // Couleurs pour les barres (dégradé de bleu)
  const getBarColor = (hour: number) => {
    if (hour >= 6 && hour <= 9) return '#3b82f6'; // Heures de pointe matin
    if (hour >= 17 && hour <= 19) return '#1d4ed8'; // Heures de pointe soir
    if (hour >= 22 || hour <= 5) return '#1e40af'; // Heures nocturnes
    return '#60a5fa'; // Heures normales
  };

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Répartition par heure de la journée
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
              <Cell key={`cell-${index}`} fill={getBarColor(entry.hour)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Légende des couleurs */}
      <div className="mt-4">
        <h4 className="font-medium text-gray-900 mb-2">Légende des couleurs</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Heures de pointe matin (6h-9h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-700 rounded"></div>
            <span className="text-sm text-gray-700">Heures de pointe soir (17h-19h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-800 rounded"></div>
            <span className="text-sm text-gray-700">Heures nocturnes (22h-5h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-sm text-gray-700">Heures normales</span>
          </div>
        </div>
      </div>
    </div>
  );
} 