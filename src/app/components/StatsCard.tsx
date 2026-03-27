"use client";

import React, { ReactNode } from "react";

// --- Icon Definitions for StatsCard ---
// Icons for the trend indicator

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

const ArrowUpRight: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="7" x2="17" y1="17" y2="7" />
    <polyline points="17 17 17 7 7 7" />
  </svg>
);

const ArrowDownRight: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="7" x2="17" y1="7" y2="17" />
    <polyline points="17 7 17 17 7 17" />
  </svg>
);

// --- Type Definition ---

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: ReactNode; // Icon from the main app component (e.g., Users, Calendar)
  trend: "up" | "down";
}

// --- Component ---

export const StatsCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
}) => {
  const isUp = trend === "up";
  const trendColor = isUp ? "text-green-600" : "text-red-600";
  const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition duration-300 hover:shadow-xl">
      <div className="flex justify-between items-start">
        {/* Icon Wrapper styled for the card header */}
        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">{title}</p>
      <h4 className="text-2xl font-extrabold text-gray-900 mt-1">{value}</h4>
      {/* Trend Indicator */}
      <div
        className={`flex items-center text-sm font-semibold mt-2 ${trendColor} justify-end`}
      >
        <TrendIcon className="w-4 h-4 mr-1" />
        {change}
      </div>
    </div>
  );
};
