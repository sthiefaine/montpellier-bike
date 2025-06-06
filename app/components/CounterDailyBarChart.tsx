"use client";
import type { BikeCounter } from "@prisma/client";
import CounterSkeleton from "./CounterSkeleton";
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
import { PreloadedCounterData } from "../page";
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
  preloadedData: PreloadedCounterData | null;
  currentYear: string;
}

export default function CounterDailyBarChart({
  counter,
  preloadedData,
  currentYear,
}: CounterDailyBarChartProps) {
  const [hiddenDatasets, setHiddenDatasets] = useState<{
    [key: string]: boolean;
  }>({
    globalAverage: true,
    activeDaysAverage: false,
  });

  useEffect(() => {
    setHiddenDatasets((prev) => ({
      ...prev,
      globalAverage: true,
      activeDaysAverage: false,
    }));
  }, [counter]);

  if (!counter || !preloadedData) return <CounterSkeleton />;

  const formatDate = (date: string) => {
    const utcDate = new Date(date);
    return utcDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Europe/Paris",
    });
  };

  if (!preloadedData?.dailyBarStats?.year?.length) {
    return <CounterSkeleton />;
  }

  const chartData: ChartData = {
    labels: preloadedData.dailyBarStats.year.map((d) => formatDate(d.day)),
    datasets: [
      {
        label: "Passages",
        data: preloadedData.dailyBarStats.year.map((d) => d.value),
        backgroundColor: "rgba(163, 230, 53, 0.7)",
        borderColor: "#a3e635",
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        type: "bar",
      },
      {
        label: "Moyenne globale",
        data: Array(preloadedData.dailyBarStats.year.length).fill(
          preloadedData.dailyBarStats.globalAverage
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
        data: Array(preloadedData.dailyBarStats.year.length).fill(
          preloadedData.dailyBarStats.activeDaysAverage
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

  return (
    <div className="mb-2 h-full flex flex-col">
      <h4 className="text-sm font-semibold text-gray-900 pl-4">
        Passages par jour ({currentYear})
      </h4>
      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm flex flex-col">
        <div className="flex justify-start mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleDataset("globalAverage")}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div
                className={`w-3 h-3 rounded-full bg-blue-500 ${
                  hiddenDatasets.globalAverage ? "opacity-50" : ""
                }`}
              ></div>
              <span
                className={`text-xs text-gray-600 ${
                  hiddenDatasets.globalAverage ? "opacity-50" : ""
                }`}
              >
                Moyenne globale
              </span>
            </button>
            <button
              onClick={() => toggleDataset("activeDaysAverage")}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div
                className={`w-3 h-3 rounded-full bg-orange-500 ${
                  hiddenDatasets.activeDaysAverage ? "opacity-50" : ""
                }`}
              ></div>
              <span
                className={`text-xs text-gray-600 ${
                  hiddenDatasets.activeDaysAverage ? "opacity-50" : ""
                }`}
              >
                Moyenne jours actifs
              </span>
            </button>
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
