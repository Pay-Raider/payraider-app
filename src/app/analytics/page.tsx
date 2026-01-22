"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MainLayout } from "@/components/layout";
import { TrendingUp, Activity, AlertCircle } from "lucide-react";

// Mock data for charts
const timeSeriesData = [
  { time: "00:00", volume: 45000, corridors: 18, anchors: 42 },
  { time: "04:00", volume: 52000, corridors: 21, anchors: 45 },
  { time: "08:00", volume: 48000, corridors: 19, anchors: 48 },
  { time: "12:00", volume: 61000, corridors: 24, anchors: 52 },
  { time: "16:00", volume: 55000, corridors: 22, anchors: 50 },
  { time: "20:00", volume: 67000, corridors: 25, anchors: 56 },
  { time: "23:59", volume: 72000, corridors: 28, anchors: 62 },
];

const corridorPerformance = [
  { corridor: "USDC→PHP", successRate: 98.5, volume: 240000, health: 95 },
  { corridor: "USD→PHP", successRate: 97.2, volume: 180000, health: 92 },
  { corridor: "EUR→USDC", successRate: 99.1, volume: 150000, health: 98 },
  { corridor: "USDC→SGD", successRate: 96.8, volume: 120000, health: 89 },
  { corridor: "USD→EUR", successRate: 98.9, volume: 200000, health: 97 },
];

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep insights into Stellar network performance and metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Network Volume (24h)
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              $2.4M
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ 18% from yesterday
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Avg Success Rate
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              98.1%
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ 0.8% from last week
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Active Corridors
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              24
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ 3 this month
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Volume & Activity Over Time */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Network Activity Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #4b5563",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  name="Volume ($)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="corridors"
                  stroke="#10b981"
                  name="Corridors"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Success Rates by Corridor */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Success Rate by Corridor
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={corridorPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="corridor" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #4b5563",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="successRate"
                  fill="#3b82f6"
                  name="Success Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Performance Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Detailed Corridor Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Corridor
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Success Rate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    24h Volume
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Health Score
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {corridorPerformance.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {row.corridor}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {row.successRate}%
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      ${(row.volume / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${row.health}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                        Healthy
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
