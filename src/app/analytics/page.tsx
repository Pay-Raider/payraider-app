"use client";

import React, { useEffect, useState } from "react";
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
import { TrendingUp, Activity, AlertCircle, Loader2 } from "lucide-react";
import { getAnalyticsDashboard, AnalyticsDashboardData } from "@/lib/analytics";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dashboardData = await getAnalyticsDashboard();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
        setError("Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error || "No data available"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  const { stats, timeSeriesData, corridorPerformance } = data;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Deep insights into Stellar network performance and metrics
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-300 font-medium">
              ⚠️ {error}
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              Using mock data. Connect the backend API to see real data.
            </p>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Total Volume
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ${(stats.volume24h / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ {stats.volumeGrowth}% from yesterday
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
              {stats.avgSuccessRate}%
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ {stats.successRateGrowth}% from last week
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
              {stats.activeCorridors}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ↑ {stats.corridorsGrowth} this month
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Total Liquidity
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {metrics
                ? formatCurrency(
                    metrics.top_corridors.reduce((sum, c) => sum + c.liquidity_depth_usd, 0)
                  )
                : "$0"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available
            </p>
          </div>
        </div>

        {/* Top Corridors */}
        {metrics && <TopCorridors corridors={metrics.top_corridors} />}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-8">
          {metrics && <LiquidityChart data={metrics.liquidity_history} />}
          {metrics && <TVLChart data={metrics.tvl_history} />}
        </div>

        {/* Settlement Latency Chart - Full Width */}
        {metrics && (
          <div className="mb-8">
            <SettlementLatencyChart data={metrics.settlement_latency_history} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
