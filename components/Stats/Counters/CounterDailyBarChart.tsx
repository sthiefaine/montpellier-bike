"use client";
import type { BikeCounter } from "@prisma/client";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ChartData,
  BarController,
  LineController,
} from "chart.js";
import { PreloadedCounterDetailsData } from "@/types/counters/details";
import { useEffect, useState } from "react";

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

interface CounterDailyBarChartProps {
  counter: BikeCounter | null;
  dailyBarStats: PreloadedCounterDetailsData["dailyBarStats"] | null;
  currentYear: string;
}

export default function CounterDailyBarChart({
  counter,
  dailyBarStats,
  currentYear,
}: CounterDailyBarChartProps) {
  const [hiddenDatasets, setHiddenDatasets] = useState<{
    [key: string]: boolean;
  }>({
    globalAverage: true,
    activeDaysAverage: false,
  });
  const [hideZeroDays, setHideZeroDays] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setHiddenDatasets((prev) => ({
      ...prev,
      globalAverage: true,
      activeDaysAverage: false,
    }));
  }, [counter]);

  if (!counter || !dailyBarStats) return <CounterSkeleton />;

  const formatDate = (date: string) => {
    const utcDate = new Date(date);
    return utcDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Europe/Paris",
    });
  };

  if (!dailyBarStats?.year?.length) {
    return <CounterSkeleton />;
  }

  const filteredData = hideZeroDays
    ? dailyBarStats.year.filter(d => d.value > 0)
    : dailyBarStats.year;

  const chartData: ChartData = {
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
        type: "bar",
      },
      {
        label: "Moyenne globale",
        data: Array(filteredData.length).fill(
          dailyBarStats.globalAverage
        ),
        type: "line",
        borderColor: "#3b82f6",
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        hidden: hiddenDatasets.globalAverage,
      },
      {
        label: "Moyenne jours actifs",
        data: Array(filteredData.length).fill(
          dailyBarStats.activeDaysAverage
        ),
        type: "line",
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
    isHidden 
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
      <span
        className={`text-xs text-gray-600 ${
          isHidden ? "opacity-50" : ""
        }`}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="bg-white">
      <h3 className="text-lg font-semibold text-gray-900 pl-4">
        Passages par jour ({currentYear})
      </h3>
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
            <div className="sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <span>Options</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isMenuOpen && (
                <div className="absolute mt-2 bg-white rounded-lg shadow-lg p-2 z-10">
                  <div className="flex flex-col gap-2">
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
              )}
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
