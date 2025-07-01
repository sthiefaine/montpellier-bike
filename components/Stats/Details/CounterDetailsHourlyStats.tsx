"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { BikeCounter } from "@prisma/client";
import { CounterValue } from "@/actions/counters/allData";
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
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { WEEK_DAYS_CONFIG } from "@/helpers";
import {
  getValuesForWeek,
  getAvailableYears,
  getAvailableWeeks,
  getWeekStartDate,
  calculateHourlyStatsByDayOfWeek,
  getValuesForYear,
  getWeekNumber,
} from "@/actions/counters/allData";
import {
  getEndOfWeekParis,
  getStartOfWeekParis,
} from "@/actions/counters/dateHelpers";

interface CounterDetailsHourlyStatsProps {
  counter: BikeCounter;
  allValues: CounterValue[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{label}h</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {
              WEEK_DAYS_CONFIG[entry.dataKey as keyof typeof WEEK_DAYS_CONFIG]
                .name
            }
            :{" "}
            {entry.value !== null
              ? entry.value.toLocaleString()
              : "Aucune donnée"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CounterDetailsHourlyStats({
  counter,
  allValues,
}: CounterDetailsHourlyStatsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Pré-calculer toutes les années et semaines disponibles en une seule fois
  const { availableYears, allWeeksByYear } = useMemo(() => {
    const years = getAvailableYears(allValues);
    const weeksByYear = new Map<number, number[]>();

    // Calculer toutes les semaines pour toutes les années en une fois
    for (let year = years.start; year <= years.end; year++) {
      const yearValues = getValuesForYear(allValues, year);
      const weekSet = new Set<number>();

      yearValues.forEach((v) => {
        const weekStart = getStartOfWeekParis(v.date);
        const weekNumber = getWeekNumber(weekStart);
        weekSet.add(weekNumber);
      });

      weeksByYear.set(
        year,
        Array.from(weekSet).sort((a, b) => a - b)
      );
    }

    return { availableYears: years, allWeeksByYear: weeksByYear };
  }, [allValues]);

  // Récupérer les semaines pour l'année sélectionnée
  const availableWeeks = allWeeksByYear.get(selectedYear) || [];
  const maxWeek =
    availableWeeks.length > 0 ? availableWeeks[availableWeeks.length - 1] : 1;
  const [selectedWeek, setSelectedWeek] = useState<number>(maxWeek);

  useEffect(() => {
    if (availableWeeks.includes(selectedWeek)) {
      setSelectedWeek(selectedWeek);
    } else {
      setSelectedWeek(maxWeek);
    }
  }, [selectedYear, availableWeeks, maxWeek, selectedWeek]);

  // Mémoriser les calculs pour la semaine sélectionnée
  const weekData = useMemo(() => {
    if (!allValues || allValues.length === 0) {
      return {
        weekStartDate: new Date(),
        weekEndDate: new Date(),
        hourlyStatsByDay: {},
      };
    }
    
    const weekStartDate = getWeekStartDate(selectedYear, selectedWeek);
    const weekValues = getValuesForWeek(allValues, weekStartDate);
    const hourlyStatsByDay = calculateHourlyStatsByDayOfWeek(weekValues);
    const weekEndDate = getEndOfWeekParis(weekStartDate);

    return {
      weekStartDate,
      weekEndDate,
      hourlyStatsByDay,
    };
  }, [allValues, selectedYear, selectedWeek]);

  const formatValue = useCallback((value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
    }).format(date);
  }, []);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const formatHour = useCallback((hour: number) => {
    return `${hour.toString().padStart(2, "0")}h`;
  }, []);

  const chartData = useMemo(() => {
    return hours.map((hour) => {
      const data: Record<string, number> = { hour };
      Object.entries(weekData.hourlyStatsByDay).forEach(([day, stats]) => {
        const stat = stats.find((s) => s.hour === hour);
        data[day] = stat ? stat.value : 0;
      });
      return data;
    });
  }, [hours, weekData.hourlyStatsByDay]);

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedYear(Number(e.target.value));
    },
    []
  );

  const handleWeekChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedWeek(Number(e.target.value));
    },
    []
  );

  if (!allValues || allValues.length === 0) {
    return <CounterSkeleton />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Statistiques horaires par semaine
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="year-select"
              className="text-sm font-medium text-gray-700"
            >
              Année
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={handleYearChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 bg-white text-black"
            >
              {Array.from(
                { length: availableYears.end - availableYears.start + 1 },
                (_, i) => availableYears.start + i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="week-select"
              className="text-sm font-medium text-gray-700"
            >
              Semaine
            </label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={handleWeekChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 bg-white text-black"
            >
              {availableWeeks.map((week) => (
                <option key={week} value={week}>
                  Semaine {week}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Semaine {selectedWeek} ({formatDate(weekData.weekStartDate)} -{" "}
        {formatDate(weekData.weekEndDate)})
      </p>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                domain={[0, 23]}
                ticks={hours}
                tickFormatter={formatHour}
              />
              <YAxis
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    {Object.values(WEEK_DAYS_CONFIG).map((day) => (
                      <div key={day.key} className="flex items-center gap-1">
                        <div
                          className="w-2 h-0.5"
                          style={{ backgroundColor: day.color }}
                        ></div>
                        <span style={{ color: day.color }}>
                          {day.name.slice(0, 3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {Object.values(WEEK_DAYS_CONFIG).map((day) => (
                <Line
                  key={day.key}
                  type="monotone"
                  dataKey={day.key}
                  name={day.name}
                  stroke={day.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
