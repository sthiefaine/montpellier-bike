"use client";

import { ChartData } from "chart.js/auto";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { DailyStats } from "@/actions/dailyStats";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CounterDailyTotalStatsProps {
  dailyStats: DailyStats | null;
}

export default function CounterDailyTotalStats({
  dailyStats,
}: CounterDailyTotalStatsProps) {
  if (!dailyStats) return <CounterSkeleton />;

  const chartData: ChartData<"bar"> = {
    labels: ["Avant-hier", "Hier"],
    datasets: [
      {
        label: "Passages",
        data: [dailyStats.passages.dayBeforeYesterday, dailyStats.passages.yesterday],
        backgroundColor: "rgba(163, 230, 53, 0.7)",
        borderColor: "#a3e635",
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.raw.toLocaleString()} passages`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#64748b",
          font: { size: 12 },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        grid: {
          color: "#f1f5f9",
        },
      },
    },
  };

  return (
    <div className="mb-2 h-full flex flex-col">
      <h4 className="text-sm font-semibold text-gray-900 pl-4">
        Passages des derniers jours
      </h4>
      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm flex flex-col">
        <div className="flex-1">
          <div className="w-full h-[calc(100%-40px)]">
            <Chart type="bar" data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
} 