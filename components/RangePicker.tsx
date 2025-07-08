"use client";

import { useState } from "react";

interface RangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  title: string;
  color: "blue" | "green" | "purple" | "orange";
  isLoading?: boolean;
  maxYear?: number;
  className?: string;
}

const colorClasses = {
  blue: {
    focus: "focus:ring-blue-500",
    border: "border-blue-200",
    bg: "bg-blue-50"
  },
  green: {
    focus: "focus:ring-green-500", 
    border: "border-green-200",
    bg: "bg-green-50"
  },
  purple: {
    focus: "focus:ring-purple-500",
    border: "border-purple-200", 
    bg: "bg-purple-50"
  },
  orange: {
    focus: "focus:ring-orange-500",
    border: "border-orange-200",
    bg: "bg-orange-50"
  }
};

export default function RangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  title,
  color,
  isLoading = false,
  maxYear,
  className = ""
}: RangePickerProps) {
  const colors = colorClasses[color];
  const currentYear = maxYear || new Date().getFullYear();

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${colors.border} p-4 ${className}`}>
      <h3 className={`text-lg font-medium text-gray-900 mb-3 ${colors.bg} px-3 py-2 rounded-lg`}>
        {title}
      </h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Du :
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent bg-white text-gray-900`}
            disabled={isLoading}
            max={endDate}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Au :
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent bg-white text-gray-900`}
            disabled={isLoading}
            min={startDate}
            max={`${currentYear}-12-31`}
          />
        </div>
      </div>
      <div className="text-sm text-gray-600 mt-3">
        Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
} 