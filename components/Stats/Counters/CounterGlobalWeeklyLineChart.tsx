"use client";

import { useState } from "react";
import {
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceArea,
  Rectangle,
  Cell,
  Bar,
  BarChart,
} from "recharts";
import joursFeries from "@/data/jours-feriers-metropole.json";

interface WeeklyData {
  week: string;
  value: number;
  year: number;
}

interface GlobalWeeklyComparisonStats {
  currentYear: WeeklyData[];
  previousYear: WeeklyData[];
  currentYearTotal: number;
  previousYearTotal: number;
}

const COLORS: Record<string, string> = {
  "2018": "#000000",
  "2019": "#8b5cf6",
  "2020": "#ec4899",
  "2021": "#14b8a6",
  "2022": "#3b82f6",
  "2023": "#22c55e",
  "2024": "#eab000",
  "2025": "#ef4444",
  "2026": "#f97316",
  "2027": "#ec4863",
};

interface CounterGlobalWeeklyLineChartProps {
  weeklyComparisonStats: GlobalWeeklyComparisonStats;
  showTooltip?: boolean;
}

export default function CounterGlobalWeeklyLineChart({
  weeklyComparisonStats,
  showTooltip = true,
}: CounterGlobalWeeklyLineChartProps) {
  const [selectedHoliday, setSelectedHoliday] = useState<{
    name: string;
    week: number;
    year: number;
  } | null>(null);
  const parisNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const currentYear = parisNow.getFullYear();
  const previousYear = currentYear - 1;

  const getWeekNumber = (date: Date) => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  const getHolidayWeeks = (
    data: any[],
    currentYear: number,
    previousYear: number
  ) => {
    const holidayWeeks: {
      weekNumber: number;
      holiday: string;
      year: number;
      date: string;
    }[] = [];

    const importantHolidays = ["Ascension", "1er mai", "Assomption"];

    Object.entries(joursFeries).forEach(([date, holiday]) => {
      if (importantHolidays.includes(holiday)) {
        const holidayDate = new Date(date);
        const holidayYear = holidayDate.getFullYear();

        if (holidayYear === currentYear || holidayYear === previousYear) {
          const weekNumber = getWeekNumber(holidayDate);

          const weekExists = data.some(
            (item) => item.weekNumber === weekNumber
          );

          if (weekExists) {
            const formattedDate = holidayDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });

            holidayWeeks.push({
              weekNumber,
              holiday,
              year: holidayYear,
              date: formattedDate,
            });
          }
        }
      }
    });

    return holidayWeeks;
  };

  const currentYearData = weeklyComparisonStats.currentYear.map((item) => {
    const weekDateParis = new Date(
      new Date(item.week).toLocaleString("en-US", { timeZone: "Europe/Paris" })
    );
    const weekNumber = getWeekNumber(weekDateParis);
    return {
      week: item.week,
      weekNumber: weekNumber,
      value: item.value,
      year: currentYear,
    };
  });

  const previousYearData = weeklyComparisonStats.previousYear.map((item) => {
    const weekDateParis = new Date(
      new Date(item.week).toLocaleString("en-US", { timeZone: "Europe/Paris" })
    );
    const weekNumber = getWeekNumber(weekDateParis);
    return {
      week: item.week,
      weekNumber: weekNumber,
      value: item.value,
      year: previousYear,
    };
  });

  const weekMap = new Map<number, any>();

  previousYearData.forEach((item) => {
    weekMap.set(item.weekNumber, {
      weekNumber: item.weekNumber,
      [previousYear]: item.value,
      [currentYear]: null,
    });
  });

  currentYearData.forEach((item) => {
    if (weekMap.has(item.weekNumber)) {
      weekMap.get(item.weekNumber)[currentYear] = item.value;
    } else {
      weekMap.set(item.weekNumber, {
        weekNumber: item.weekNumber,
        [previousYear]: 0,
        [currentYear]: item.value,
      });
    }
  });

  const combinedData = Array.from(weekMap.values())
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((item) => {
      return {
        week: `S${item.weekNumber}`,
        weekNumber: item.weekNumber,
        [currentYear]: item[currentYear],
        [previousYear]: item[previousYear],
      };
    });

  const holidayWeeks = getHolidayWeeks(combinedData, currentYear, previousYear);

  const holidayWeekNumbers = holidayWeeks.map((h) => h.weekNumber);

  const holidayWeekMap = new Map();
  holidayWeeks.forEach((h) => {
    holidayWeekMap.set(h.weekNumber, { name: h.holiday, date: h.date });
  });

  const maxValue = Math.max(
    ...combinedData.map((item) =>
      Math.max(item[currentYear] || 0, item[previousYear] || 0)
    )
  );
  const holidayBarHeight = maxValue * 0.8;

  const dataWithHolidays = combinedData.map((item) => ({
    ...item,
    isHolidayWeek: holidayWeekNumbers.includes(item.weekNumber),
    holidayBackground: holidayWeekNumbers.includes(item.weekNumber)
      ? holidayBarHeight
      : 0,

    holidayInfo: holidayWeekMap.get(item.weekNumber) || null,
  }));

  const formatWeekLabel = (week: string) => {
    return week;
  };

  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Fréquentation moyenne par semaine
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: COLORS[previousYear.toString()] || "#9ca3af",
              }}
            ></div>
            <span>
              {previousYear}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: COLORS[currentYear.toString()] || "#3b82f6",
              }}
            ></div>
            <span>
              {currentYear}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 rounded-sm bg-gray-300 opacity-30"></div>
            <span>Jours fériés</span>
          </div>
        </div>
      </div>
      <div className="pt-0">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-[300px] relative">
            <div className="relative z-10 h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dataWithHolidays}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekLabel}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("fr-FR", {
                        notation: "compact",
                      }).format(value)
                    }
                  />
                  {showTooltip && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        const holidayInfo = data?.holidayInfo;
                        return (
                          <span>
                            <span style={{ color: "#000000" }}>
                              Semaine {label}
                            </span>
                            {holidayInfo && (
                              <span
                                style={{
                                  color: "#6b7280",
                                  fontSize: "12px",
                                  marginTop: "4px",
                                  display: "block",
                                }}
                              >
                                🎉 {holidayInfo.name} ({holidayInfo.date})
                              </span>
                            )}
                          </span>
                        );
                      }}
                      formatter={(value: number, name: string) => [
                        formatTooltipValue(value),
                        name === currentYear.toString()
                          ? `Année ${currentYear}`
                          : `Année ${previousYear}`,
                      ]}
                    />
                  )}
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={currentYear.toString()}
                    stroke={COLORS[currentYear.toString()] || "#3b82f6"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: COLORS[currentYear.toString()] || "#3b82f6",
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={previousYear.toString()}
                    stroke={COLORS[previousYear.toString()] || "#9ca3af"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: COLORS[previousYear.toString()] || "#9ca3af",
                      strokeWidth: 2,
                    }}
                  />
                  <Bar
                    dataKey="holidayBackground"
                    fill="rgba(156, 163, 175, 0.3)"
                    radius={[2, 2, 0, 0]}
                    name="Jours fériés"
                    tooltipType="none"
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {selectedHoliday && (
              <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg p-4 shadow-xl max-w-xs">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {selectedHoliday.name}
                  </h4>
                  <button
                    onClick={() => setSelectedHoliday(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Semaine {selectedHoliday.week} - {selectedHoliday.year}
                </p>
                <p className="text-xs text-gray-500">
                  Cette zone grise indique la présence d'un jour férié qui peut
                  influencer la fréquentation des compteurs de mobilité douce.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
