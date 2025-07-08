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
import ChartHeader from "./ChartHeader";

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
  title?: string;
  description?: string;
  showHeader?: boolean;
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
  type = 'total',
  title,
  description,
  showHeader = true
}: HourlyDistributionChartProps) {

  console.log('stats', stats);
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

  // Couleur unique pour toutes les barres
  const barColor = '#3b82f6'; // Bleu simple

  // Titre et description par défaut si non fournis
  const defaultTitle = title || "Répartition par heure de la journée";
  const defaultDescription = description || `${type === 'total' ? 'Total des passages' : 'Moyenne quotidienne'} du ${periodStart} au ${periodEnd}`;

    return (
    <div className="w-full h-full">
      {showHeader && (
        <ChartHeader 
          title={defaultTitle}
          description={defaultDescription}
        />
      )}
      
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
            fill={barColor}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 