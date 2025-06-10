"use client";

import { useState } from "react";
import { ChartData } from "chart.js/auto";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { CounterGlobalDailyBarStats } from "@/types/counters/counters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface CounterGlobalDailyBarChartProps {
  counterGlobalDailyBarStats: CounterGlobalDailyBarStats | null;
  currentYear: string;
}

export default function CounterGlobalDailyBarChart({
  counterGlobalDailyBarStats,
  currentYear,
}: CounterGlobalDailyBarChartProps) {
  console.log("dailyGlobalDailyBarStats", counterGlobalDailyBarStats);
  const [hiddenDatasets, setHiddenDatasets] = useState<{
    [key: string]: boolean;
  }>({
    globalAverage: true,
    activeDaysAverage: false,
  });
  const [hideZeroDays, setHideZeroDays] = useState(false);

  if (!counterGlobalDailyBarStats) return <CounterSkeleton />;

  const formatDate = (date: string) => {
    const utcDate = new Date(date);
    return utcDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Europe/Paris",
    });
  };

  if (!counterGlobalDailyBarStats?.year?.length) {
    return <CounterSkeleton />;
  }

  const filteredData = hideZeroDays
    ? counterGlobalDailyBarStats.year.filter((d) => d.value > 0)
    : counterGlobalDailyBarStats.year;

  const chartData = {
    labels: filteredData.map((d) => formatDate(d.day)),
    datasets: [
      {
        label: "Passages",
        data: filteredData.map((d) => d.value),
        backgroundColor: "rgba(163, 230, 53, 0.7)",
        borderColor: "#a3e635",
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        type: "bar" as const,
      },
      {
        label: "Moyenne globale",
        data: Array(filteredData.length).fill(
          counterGlobalDailyBarStats.globalAverage
        ),
        type: "line" as const,
        borderColor: "#3b82f6",
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        hidden: hiddenDatasets.globalAverage,
      },
      {
        label: "Moyenne jours actifs",
        data: Array(filteredData.length).fill(
          counterGlobalDailyBarStats.activeDaysAverage
        ),
        type: "line" as const,
        borderColor: "#f59e0b",
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        hidden: hiddenDatasets.activeDaysAverage,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 12,
          color: "#64748b",
          font: { size: 10 },
        },
        grid: { display: false },
        fixed: true,
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#64748b",
          font: { size: 10 },
        },
        grid: { color: "#f1f5f9" },
        fixed: true,
      },
    },
  };

  const toggleDataset = (datasetKey: string) => {
    setHiddenDatasets((prev) => ({
      ...prev,
      [datasetKey]: !prev[datasetKey],
    }));
  };

  const LegendButton = ({
    onClick,
    color,
    label,
    isHidden,
  }: {
    onClick: () => void;
    color: string;
    label: string;
    isHidden: boolean;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 hover:opacity-70 transition-opacity"
    >
      <div
        className={`w-3 h-3 rounded-full ${color} ${
          isHidden ? "opacity-50" : ""
        }`}
      ></div>
      <span className={`text-xs text-gray-600 ${isHidden ? "opacity-50" : ""}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="mb-2 h-full flex flex-col">
      <h4 className="text-sm font-semibold text-gray-900 pl-4">
        Passages quotidiens globaux ({currentYear})
      </h4>
      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row justify-start mb-2">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <LegendButton
                onClick={() => toggleDataset("globalAverage")}
                color="bg-blue-500"
                label="Moyenne globale"
                isHidden={hiddenDatasets.globalAverage}
              />
              <LegendButton
                onClick={() => toggleDataset("activeDaysAverage")}
                color="bg-orange-500"
                label="Moyenne jours actifs"
                isHidden={hiddenDatasets.activeDaysAverage}
              />
              <LegendButton
                onClick={() => setHideZeroDays(!hideZeroDays)}
                color="bg-gray-500"
                label={hideZeroDays ? "Tous les jours" : "Jours sans passages"}
                isHidden={!hideZeroDays}
              />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="w-full h-[calc(100%-40px)]">
            <Chart type="bar" data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
}
