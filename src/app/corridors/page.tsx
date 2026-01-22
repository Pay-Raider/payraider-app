"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Search,
  Filter,
  Loader,
  ArrowRight,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Home,
} from "lucide-react";
import {
  getCorridors,
  generateMockCorridorData,
  CorridorMetrics,
} from "@/lib/api";

export default function CorridorsPage() {
  const router = useRouter();
  const [corridors, setCorridors] = useState<CorridorMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "success_rate" | "health_score" | "liquidity"
  >("health_score");

  useEffect(() => {
    async function fetchCorridors() {
      try {
        setLoading(true);
        try {
          const result = await getCorridors();
          setCorridors(result);
        } catch (apiError) {
          console.log("API not available, using mock data");
          // Generate mock corridors
          const mockCorridors: CorridorMetrics[] = [
            {
              ...generateMockCorridorData("corridor-1").corridor,
              id: "corridor-1",
              source_asset: "USDC",
              destination_asset: "PHP",
            },
            {
              ...generateMockCorridorData("corridor-2").corridor,
              id: "corridor-2",
              source_asset: "USDC",
              destination_asset: "JPY",
            },
            {
              ...generateMockCorridorData("corridor-3").corridor,
              id: "corridor-3",
              source_asset: "USDC",
              destination_asset: "INR",
              success_rate: 95.2,
              total_attempts: 2100,
              successful_payments: 2000,
              failed_payments: 100,
              average_latency_ms: 420,
              median_latency_ms: 320,
              p95_latency_ms: 1100,
              p99_latency_ms: 1800,
              liquidity_depth_usd: 8500000,
              liquidity_volume_24h_usd: 1200000,
              liquidity_trend: "increasing",
              health_score: 96,
            },
            {
              ...generateMockCorridorData("corridor-4").corridor,
              id: "corridor-4",
              source_asset: "USDC",
              destination_asset: "KES",
              success_rate: 81.3,
              total_attempts: 950,
              successful_payments: 772,
              failed_payments: 178,
              average_latency_ms: 650,
              median_latency_ms: 520,
              p95_latency_ms: 1800,
              p99_latency_ms: 2500,
              liquidity_depth_usd: 2800000,
              liquidity_volume_24h_usd: 320000,
              liquidity_trend: "decreasing",
              health_score: 72,
            },
            {
              ...generateMockCorridorData("corridor-5").corridor,
              id: "corridor-5",
              source_asset: "USDC",
              destination_asset: "EUR",
              success_rate: 97.8,
              total_attempts: 3200,
              successful_payments: 3130,
              failed_payments: 70,
              average_latency_ms: 380,
              median_latency_ms: 280,
              p95_latency_ms: 950,
              p99_latency_ms: 1500,
              liquidity_depth_usd: 12000000,
              liquidity_volume_24h_usd: 2500000,
              liquidity_trend: "increasing",
              health_score: 98,
            },
            {
              ...generateMockCorridorData("corridor-6").corridor,
              id: "corridor-6",
              source_asset: "USDC",
              destination_asset: "GBP",
              success_rate: 94.1,
              total_attempts: 2450,
              successful_payments: 2305,
              failed_payments: 145,
              average_latency_ms: 410,
              median_latency_ms: 310,
              p95_latency_ms: 1050,
              p99_latency_ms: 1700,
              liquidity_depth_usd: 9800000,
              liquidity_volume_24h_usd: 1800000,
              liquidity_trend: "stable",
              health_score: 91,
            },
          ];
          setCorridors(mockCorridors);
        }
      } catch (err) {
        console.error("Error fetching corridors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCorridors();
  }, []);

  // Filter and sort corridors
  const filteredCorridors = corridors
    .filter(
      (c) =>
        c.source_asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.destination_asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "success_rate":
          return b.success_rate - a.success_rate;
        case "liquidity":
          return b.liquidity_depth_usd - a.liquidity_depth_usd;
        case "health_score":
        default:
          return b.health_score - a.health_score;
      }
    });

  const getHealthColor = (score: number) => {
    if (score >= 90)
      return "bg-green-900/20 border-green-600/50 text-green-500";
    if (score >= 75)
      return "bg-yellow-900/20 border-yellow-600/50 text-yellow-500";
    return "bg-red-900/20 border-red-600/50 text-red-500";
  };

  const getHealthStatus = (
    score: number,
  ): { label: string; icon: string; color: string } => {
    if (score >= 90)
      return { label: "Robust", icon: "🟢", color: "text-green-500" };
    if (score >= 75)
      return { label: "Moderate", icon: "🟡", color: "text-yellow-500" };
    return { label: "Fragile", icon: "🔴", color: "text-red-500" };
  };

  const getSuccessStatusIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (rate >= 75) return <TrendingUp className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Back Button */}
      <div className="fixed w-full top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-gray-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors font-medium text-sm md:text-base"
            >
              <Home className="w-4 h-4 md:w-5 md:h-5" />
              Back to Home
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            Payment Corridors
          </h1>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 md:top-3 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search corridors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card border border-border rounded-lg px-2 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-foreground appearance-none cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-[image:url(%27data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20fill=%22%236b7280%22%20viewBox=%220%200%2020%2020%22%3E%3Cpath%20d=%22M5.293%207.293a1%201%200%011.414%200L10%2010.586l3.293-3.293a1%201%200%111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%210-1.414z%22/%3E%3C/svg%3E%27) no-repeat] bg-right bg-no-repeat pr-7 md:pr-8"
                style={{
                  backgroundColor: "var(--card-bg)",
                  color: "var(--foreground)",
                }}
              >
                <option
                  value="health_score"
                  style={{ backgroundColor: "#1f2937", color: "#f3f4f6" }}
                >
                  Sort by Health Score
                </option>
                <option
                  value="success_rate"
                  style={{ backgroundColor: "#1f2937", color: "#f3f4f6" }}
                >
                  Sort by Success Rate
                </option>
                <option
                  value="liquidity"
                  style={{ backgroundColor: "#1f2937", color: "#f3f4f6" }}
                >
                  Sort by Liquidity
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 mt-45 sm:mt-45 md:mt-48">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-64">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm md:text-base text-gray-400">
              Loading corridors...
            </p>
          </div>
        ) : filteredCorridors.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-sm md:text-base text-gray-400">
              No corridors found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredCorridors.map((corridor) => (
              <button
                key={corridor.id}
                onClick={() => router.push(`/corridors/${corridor.id}`)}
                className="group bg-card border border-border rounded-lg p-3 md:p-6 hover:border-blue-500 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg text-left cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-xl font-bold group-hover:text-blue-500 transition-colors truncate">
                      {corridor.source_asset} → {corridor.destination_asset}
                    </h2>
                    <p className="text-muted-foreground text-xs mt-0.5 md:mt-1 truncate">
                      {corridor.id}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 duration-200 shrink-0 ml-1" />
                </div>

                {/* Success Rate and Health Score */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="bg-muted rounded-lg p-2 md:p-3">
                    <p className="text-muted-foreground text-xs mb-1">
                      Success Rate
                    </p>
                    <div className="flex items-center gap-1 md:gap-2">
                      {getSuccessStatusIcon(corridor.success_rate)}
                      <p className="text-sm md:text-lg font-bold text-green-500">
                        {corridor.success_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div
                    className={`rounded-lg p-2 md:p-3 border ${getHealthColor(
                      corridor.health_score
                    )}`}
                  >
                    <p className="text-muted-foreground text-xs mb-1">Health</p>
                    <p className="text-sm md:text-lg font-bold">{corridor.health_score.toFixed(0)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs">{getHealthStatus(corridor.health_score).icon}</span>
                      <span className={`text-xs font-semibold ${getHealthStatus(corridor.health_score).color}`}>
                        {getHealthStatus(corridor.health_score).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-1 md:space-y-2 text-xs mb-3 md:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avg Latency</span>
                    <span className="font-semibold text-blue-500">
                      {corridor.average_latency_ms.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Droplets className="w-3 h-3 md:w-4 md:h-4" />
                      Liquidity
                    </span>
                    <span className="font-semibold text-purple-500">
                      ${(corridor.liquidity_depth_usd / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="font-semibold text-amber-500">
                      $
                      {(corridor.liquidity_volume_24h_usd / 1000000).toFixed(2)}
                      M
                    </span>
                  </div>
                </div>

                {/* Payment Attempts */}
                <div className="bg-muted rounded-lg p-2 md:p-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {corridor.successful_payments} successful
                    </span>
                    <span className="text-muted-foreground">
                      {corridor.failed_payments} failed
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1 md:h-1.5 mt-1.5 md:mt-2">
                    <div
                      className="bg-green-500 rounded-full h-full transition-all duration-300"
                      style={{
                        width: `${(corridor.successful_payments / corridor.total_attempts) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-muted border border-border rounded-lg text-muted-foreground text-xs md:text-sm">
          <p>
            Showing {filteredCorridors.length} of {corridors.length} corridors
          </p>
          <p className="mt-1 md:mt-2 text-xs">
            Click any card to view detailed analytics
          </p>
        </div>
      </div>
    </div>
  );
}
