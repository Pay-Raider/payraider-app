"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CorridorAnalytics } from "@/lib/analytics-api";
import { TrendingUp, Droplets, Clock, ArrowRight, Maximize2 } from "lucide-react";

interface LiquidityHeatmapProps {
  corridors: CorridorAnalytics[];
}

interface HeatmapCell {
  sourceAsset: string;
  destinationAsset: string;
  liquidity: number;
  corridorData: CorridorAnalytics;
}

interface TooltipData extends HeatmapCell {
  x: number;
  y: number;
}

export const LiquidityHeatmap: React.FC<LiquidityHeatmapProps> = ({
  corridors,
}) => {
  const router = useRouter();
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [timePeriod, setTimePeriod] = useState("7d");

  // Transform corridor data into matrix structure
  const { matrix, sourceAssets, destinationAssets, maxLiquidity } = useMemo(() => {
    const sources = Array.from(
      new Set(corridors.map((c) => c.asset_a_code))
    ).sort();
    const destinations = Array.from(
      new Set(corridors.map((c) => c.asset_b_code))
    ).sort();

    let maxLiq = 0;
    const matrixMap = new Map<string, HeatmapCell>();
    
    corridors.forEach((corridor) => {
      const key = `${corridor.asset_a_code}-${corridor.asset_b_code}`;
      if (corridor.liquidity_depth_usd > maxLiq) {
        maxLiq = corridor.liquidity_depth_usd;
      }
      
      matrixMap.set(key, {
        sourceAsset: corridor.asset_a_code,
        destinationAsset: corridor.asset_b_code,
        liquidity: corridor.liquidity_depth_usd,
        corridorData: corridor,
      });
    });

    return {
      matrix: matrixMap,
      sourceAssets: sources,
      destinationAssets: destinations,
      maxLiquidity: maxLiq,
    };
  }, [corridors]);

  // Get color based on liquidity relative to max
  const getLiquidityColor = (liquidity: number): string => {
    const ratio = liquidity / maxLiquidity;
    if (ratio >= 0.8) return "bg-green-600";
    if (ratio >= 0.6) return "bg-green-500";
    if (ratio >= 0.4) return "bg-green-400";
    if (ratio >= 0.2) return "bg-yellow-400";
    if (ratio >= 0.1) return "bg-orange-400";
    if (ratio > 0) return "bg-orange-500";
    return "bg-red-500";
  };

  const getOpacity = (liquidity: number): string => {
    const ratio = liquidity / maxLiquidity;
    if (ratio >= 0.5) return "opacity-100";
    if (ratio >= 0.2) return "opacity-90";
    return "opacity-80";
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const handleCellHover = (
    cell: HeatmapCell | null,
    event?: React.MouseEvent<HTMLDivElement>
  ) => {
    if (cell && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipData({
        ...cell,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    } else {
      setTooltipData(null);
    }
  };

  const handleCellClick = (corridorKey: string) => {
    // The corridor_key is usually "ASSET:ISSUER->ASSET:ISSUER"
    // We need to figure out how to navigate to the corridor detail page.
    // Based on app/corridors/page.tsx, it uses Link href={`/corridors/${corridor.id}`}
    // In analytics-api.ts, corridor has corridor_key. 
    // Let's assume the ID is the corridor_key or similar.
    router.push(`/corridors/${encodeURIComponent(corridorKey)}`);
  };

  const cellSize = "w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-[10px] sm:text-xs";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Liquidity Distribution
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Available liquidity depth across asset pairs
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
          {["24h", "7d", "30d"].map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timePeriod === period
                  ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            {/* Legend */}
            <div className="flex items-center gap-3 mb-6 px-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Liquidity:
              </span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                <div className="w-4 h-4 bg-orange-400 rounded-sm"></div>
                <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
              </div>
              <div className="flex gap-4 text-[10px] text-gray-500 dark:text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="flex">
              {/* Y-axis (Destination Assets) */}
              <div className="flex flex-col pt-16">
                {destinationAssets.map((asset) => (
                  <div
                    key={`y-${asset}`}
                    className="h-12 sm:h-16 lg:h-20 flex items-center justify-end pr-4 text-xs font-bold text-gray-600 dark:text-gray-400"
                  >
                    {asset}
                  </div>
                ))}
              </div>

              {/* Matrix */}
              <div className="flex flex-col">
                {/* X-axis (Source Assets) */}
                <div className="flex h-16">
                  {sourceAssets.map((asset) => (
                    <div
                      key={`x-${asset}`}
                      className="w-12 sm:w-16 lg:w-20 flex items-end justify-center pb-2"
                    >
                      <span className="transform -rotate-45 origin-bottom-left whitespace-nowrap text-xs font-bold text-gray-600 dark:text-gray-400">
                        {asset}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cells */}
                {destinationAssets.map((dest) => (
                  <div key={`row-${dest}`} className="flex">
                    {sourceAssets.map((src) => {
                      const key = `${src}-${dest}`;
                      const cell = matrix.get(key);
                      
                      return (
                        <div
                          key={key}
                          className={`${cellSize} p-0.5`}
                          onMouseEnter={(e) => handleCellHover(cell || null, e)}
                          onMouseLeave={() => handleCellHover(null)}
                          onClick={() => cell && handleCellClick(cell.corridorData.corridor_key)}
                        >
                          {cell ? (
                            <div
                              className={`w-full h-full rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:z-10 flex items-center justify-center ${getLiquidityColor(
                                cell.liquidity
                              )} ${getOpacity(cell.liquidity)}`}
                            >
                              <span className="text-[10px] sm:text-xs font-medium text-white drop-shadow-sm truncate px-1">
                                {formatCurrency(cell.liquidity)}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-50 dark:bg-slate-700/50 rounded-sm border border-dashed border-gray-200 dark:border-slate-600"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltipData && (
          <div
            className="fixed z-50 pointer-events-none transition-transform duration-200"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y - 10}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-slate-900 text-white rounded-lg shadow-xl p-3 min-w-[200px] border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-sm">
                  {tooltipData.sourceAsset} → {tooltipData.destinationAsset}
                </div>
                <div className="bg-blue-500 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {tooltipData.corridorData.success_rate}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Liquidity Depth:</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(tooltipData.liquidity)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">24h Volume:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(tooltipData.corridorData.volume_usd)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Click to view corridor</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
            <div className="w-3 h-3 bg-slate-900 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-slate-700"></div>
          </div>
        )}
      </div>
    </div>
  );
};
