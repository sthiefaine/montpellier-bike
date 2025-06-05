import { useEffect, useState } from "react";
import type { BikeCounter } from "@prisma/client";
import { getDailyStatsForYear } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { PreloadedCounterData } from "../page";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type DailyBar = { day: string; value: number };

interface CounterDailyBarChartProps {
  counter: BikeCounter | null;
  preloadedData: PreloadedCounterData | null;
}

export default function CounterDailyBarChart({ counter, preloadedData }: CounterDailyBarChartProps) {
  if (!counter || !preloadedData) return <CounterSkeleton />;

  const formatDate = (date: string) => {
    // display only the day and month of current year
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const chartData = {
    labels: preloadedData.dailyBarStats.map((d) => formatDate(d.day)),
    datasets: [
      {
        label: "Passages",
        data: preloadedData.dailyBarStats.map((d) => d.value),
        backgroundColor: "rgba(163, 230, 53, 0.7)",
        borderColor: "#a3e635",
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#64748b",
          font: { size: 10 },
        },
        grid: { color: "#f1f5f9" },
      },
    },
  };

  return (
    <div className="mb-2">
      <h4 className="text-sm font-semibold text-gray-900 pl-4">
        Passages par jour (année en cours)
      </h4>
      <div className="h-[calc(35vh)] bg-white p-2 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
}
