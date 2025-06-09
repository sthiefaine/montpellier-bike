"use client";

import NumberFlow from "@/components/NumberFlow";
import { useEffect, useState } from "react";

type StatsBarProps = {
  label: string;
  value: number;
  percentage: number;
  temperature: number | null;
  color: "blue" | "green";
  isRaining?: boolean;
  isCloudy?: boolean;
};

export default function StatsBar({
  label,
  value,
  percentage,
  temperature,
  color,
  isRaining,
  isCloudy,
}: StatsBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const bgColor = color === "blue" ? "#3b82f6" : "#22c55e";

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getWeatherIcon = () => {
    if (isRaining) return "🌧️";
    if (isCloudy) return "☁️";
    if (temperature === null) return null;
    if (temperature < 5) return "🌨️";
    if (temperature < 10) return "🌡️";
    if (temperature < 20) return "🌤️";
    if (temperature < 25) return "☀️";
    return "🔥";
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {temperature !== null && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">{temperature}°C</span>
              <span className="text-base">{getWeatherIcon()}</span>
            </div>
          )}
        </div>
        <div className="relative flex items-center h-8 bg-gray-200 rounded">
          <div
            className="absolute left-0 top-0 h-8 rounded transition-all duration-1000 ease-out"
            style={{
              width: isVisible ? `${percentage}%` : "0%",
              background: bgColor,
              transitionDelay: "300ms",
            }}
          ></div>
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-xs px-2 py-0.5 rounded shadow"
            style={{ pointerEvents: "none" }}
          >
            <NumberFlow value={value} />
          </span>
        </div>
      </div>
    </div>
  );
}
