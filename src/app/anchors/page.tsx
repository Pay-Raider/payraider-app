"use client";

import React, { useState } from "react";
import { Anchor, Search, MapPin, Shield, Loader } from "lucide-react";
import { MainLayout } from "@/components/layout";

interface AnchorData {
  id: string;
  name: string;
  domain: string;
  location: string;
  assets: string[];
  trustLevel: "verified" | "trusted" | "new";
  volume24h: string;
}

export default function AnchorsPage() {
  const [anchors, setAnchors] = useState<AnchorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  React.useEffect(() => {
    // Simulate fetching anchors
    setTimeout(() => {
      setAnchors([
        {
          id: "anchor-1",
          name: "Stellar Anchor 1",
          domain: "anchor1.stellar.org",
          location: "United States",
          assets: ["USDC", "PHP"],
          trustLevel: "verified",
          volume24h: "$845K",
        },
        {
          id: "anchor-2",
          name: "Philippine Remittance Hub",
          domain: "ph-remit.stellar.org",
          location: "Philippines",
          assets: ["PHP", "USD"],
          trustLevel: "verified",
          volume24h: "$1.2M",
        },
        {
          id: "anchor-3",
          name: "Asia Pacific Anchor",
          domain: "apac.stellar.org",
          location: "Singapore",
          assets: ["SGD", "USDC", "EUR"],
          trustLevel: "trusted",
          volume24h: "$560K",
        },
        {
          id: "anchor-4",
          name: "EU Bridge",
          domain: "eu-bridge.stellar.org",
          location: "Germany",
          assets: ["EUR", "USDC"],
          trustLevel: "trusted",
          volume24h: "$720K",
        },
        {
          id: "anchor-5",
          name: "Emerging Markets Fund",
          domain: "em-fund.stellar.org",
          location: "Mexico",
          assets: ["MXN", "USDC"],
          trustLevel: "new",
          volume24h: "$120K",
        },
        {
          id: "anchor-6",
          name: "Global Exchange",
          domain: "global-ex.stellar.org",
          location: "Canada",
          assets: ["CAD", "USD", "USDC"],
          trustLevel: "verified",
          volume24h: "$950K",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAnchors = anchors.filter(
    (anchor) =>
      anchor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anchor.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anchor.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTrustBadgeColor = (level: string) => {
    switch (level) {
      case "verified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "trusted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "new":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Anchors
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore liquidity providers on the Stellar network
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search anchors by name, domain, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Anchors Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredAnchors.length === 0 ? (
          <div className="text-center py-12">
            <Anchor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No anchors found matching your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAnchors.map((anchor) => (
              <div
                key={anchor.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Anchor className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {anchor.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {anchor.domain}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getTrustBadgeColor(
                      anchor.trustLevel,
                    )}`}
                  >
                    {anchor.trustLevel}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {anchor.location}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Supported Assets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {anchor.assets.map((asset) => (
                        <span
                          key={asset}
                          className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                        >
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      24h Volume:
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {anchor.volume24h}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
