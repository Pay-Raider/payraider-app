import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CorridorAnalytics } from "@/lib/analytics-api";
import { TrendingUp, Droplets, Clock, ArrowRight, Maximize2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LiquidityHeatmapProps {
  corridors: CorridorAnalytics[];
  onTimePeriodChange?: (period: string) => void;
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
  onTimePeriodChange,
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
    if (ratio >= 0.8) return "bg-emerald-600 dark:bg-emerald-500";
    if (ratio >= 0.6) return "bg-emerald-500 dark:bg-emerald-400";
    if (ratio >= 0.4) return "bg-green-400 dark:bg-green-300";
    if (ratio >= 0.2) return "bg-yellow-400 dark:bg-yellow-300";
    if (ratio >= 0.1) return "bg-orange-400 dark:bg-orange-300";
    if (ratio > 0) return "bg-orange-500 dark:bg-orange-400";
    return "bg-red-500 dark:bg-red-400";
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
    router.push(`/corridors/${encodeURIComponent(corridorKey)}`);
  };

  const handlePeriodClick = (period: string) => {
    setTimePeriod(period);
    if (onTimePeriodChange) {
      onTimePeriodChange(period);
    }
  };

  const cellSize = "w-14 h-14 sm:w-18 sm:h-18 lg:w-22 lg:h-22 text-[10px] sm:text-xs";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
            <Droplets className="w-7 h-7 text-blue-500" />
            Liquidity Distribution
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualizing liquidity depth across market corridors
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
          {["24h", "7d", "30d"].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodClick(period)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                timePeriod === period
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="relative group/matrix">
        <div className="overflow-x-auto pb-6 custom-scrollbar">
          <div className="inline-block min-w-full">
            {/* Legend */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Liquidity Density
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                  <div className="w-4 h-4 bg-orange-400 rounded-sm"></div>
                  <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                  <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                  <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                  <div className="w-4 h-4 bg-emerald-600 rounded-sm"></div>
                </div>
                <div className="flex gap-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                  <span>Thin</span>
                  <span>Deep</span>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
                <Maximize2 className="w-3 h-3" />
                Click cells to navigate
              </div>
            </div>

            <div className="flex">
              {/* Y-axis (Destination Assets) */}
              <div className="flex flex-col pt-16">
                {destinationAssets.map((asset) => (
                  <div
                    key={`y-${asset}`}
                    className="h-14 sm:h-18 lg:h-22 flex items-center justify-end pr-6"
                  >
                    <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                      {asset}
                    </span>
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
                      className="w-14 sm:w-18 lg:w-22 flex items-end justify-center pb-4"
                    >
                      <span className="transform -rotate-45 origin-bottom-left whitespace-nowrap text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                        {asset}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cells row container */}
                <div className="bg-gray-50/30 dark:bg-slate-900/10 rounded-xl p-2 border border-gray-100 dark:border-slate-800/50">
                  {destinationAssets.map((dest) => (
                    <div key={`row-${dest}`} className="flex">
                      {sourceAssets.map((src) => {
                        const key = `${src}-${dest}`;
                        const cell = matrix.get(key);
                        
                        return (
                          <motion.div
                            key={key}
                            layout
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05, zIndex: 10 }}
                            className={`${cellSize} p-1`}
                            onMouseEnter={(e) => handleCellHover(cell || null, e)}
                            onMouseLeave={() => handleCellHover(null)}
                            onClick={() => cell && handleCellClick(cell.corridorData.corridor_key)}
                          >
                            {cell ? (
                              <div
                                className={`w-full h-full rounded-lg cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col items-center justify-center border border-white/10 ${getLiquidityColor(
                                  cell.liquidity
                                )} ${getOpacity(cell.liquidity)}`}
                              >
                                <span className="text-[10px] sm:text-[11px] font-black text-white drop-shadow-md truncate px-1">
                                  {formatCurrency(cell.liquidity)}
                                </span>
                                <div className="hidden sm:block w-4 h-0.5 bg-white/30 rounded mt-1"></div>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-100/50 dark:bg-slate-800/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700/50 hover:bg-gray-200/50 dark:hover:bg-slate-700/30 transition-colors"></div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltipData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="fixed z-[100] pointer-events-none"
              style={{
                left: `${tooltipData.x}px`,
                top: `${tooltipData.y - 12}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-md text-white rounded-2xl shadow-2xl p-5 min-w-[240px] border border-white/10 ring-1 ring-black/5">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="font-black text-sm uppercase tracking-tight">
                      {tooltipData.sourceAsset} <ArrowRight className="inline w-3 h-3 mx-1 text-gray-500" /> {tooltipData.destinationAsset}
                    </span>
                  </div>
                  <div className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-black border border-blue-500/30">
                    {tooltipData.corridorData.success_rate}%
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Liquidity Depth</span>
                    <span className="font-mono text-blue-400 font-black text-sm">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(tooltipData.liquidity)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">24h Volume</span>
                    <span className="font-mono text-emerald-400 font-black text-sm">
                      {formatCurrency(tooltipData.corridorData.volume_usd)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Avg Latency</span>
                    <span className="font-mono text-amber-400 font-black text-sm">
                      {tooltipData.corridorData.avg_settlement_latency_ms?.toFixed(0) || "N/A"}ms
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    <span>Click to explore corridor</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
              <div className="w-4 h-4 bg-slate-900/95 rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2 border-r border-b border-white/10"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
