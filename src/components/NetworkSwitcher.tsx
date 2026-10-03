import React, { useEffect, useState } from 'react';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useNetwork } from '@/contexts/NetworkContext';
import { getAvailableNetworks } from '@/lib/api/networkAPIFunction';
import type { NetworkInfo } from '@/lib/api/types';

export type { NetworkInfo };

export interface NetworkSwitcherProps {
  className?: string;
}

/**
 * Shows which Stellar network this deployment serves.
 *
 * The network is fixed when the backend is deployed (STELLAR_NETWORK), so
 * this is read-only: each network runs as its own deployment. The panel
 * lists the networks the backend knows about for reference.
 */
export function NetworkSwitcher({ className = '' }: NetworkSwitcherProps) {
  const { network: currentNetwork, loading } = useNetwork();
  const [availableNetworks, setAvailableNetworks] = useState<NetworkInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || availableNetworks.length > 0) return;
    getAvailableNetworks()
      .then(setAvailableNetworks)
      .catch((err) => logger.error('Network list fetch error:', err as string));
  }, [isOpen, availableNetworks.length]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!currentNetwork) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} title="The API could not be reached">
        <WifiOff className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-500">API offline</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label={`Network: ${currentNetwork.display_name}`}
        aria-expanded={isOpen}
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentNetwork.color }} />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {currentNetwork.display_name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-2"
            role="region"
            aria-label="Network details"
          >
            <ul className="space-y-1">
              {(availableNetworks.length > 0 ? availableNetworks : [currentNetwork]).map((network) => {
                const active = network.network === currentNetwork.network;
                return (
                  <li
                    key={network.network}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                      active ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'opacity-60'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: network.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{network.display_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{network.horizon_url}</div>
                    </div>
                    {active && <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" aria-label="Active" />}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 px-2 text-xs text-muted-foreground">
              This deployment serves {currentNetwork.display_name}. Each network runs as its own deployment.
            </p>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
