/**
 * Network API Functions
 */

import { api } from "./api";
import { NetworkInfo } from "./types";

/**
 * Get current network information
 */
export async function getCurrentNetwork(): Promise<NetworkInfo> {
  return api.get<NetworkInfo>("/network/info");
}

/**
 * Get all available networks
 */
export async function getAvailableNetworks(): Promise<NetworkInfo[]> {
  return api.get<NetworkInfo[]>("/network/available");
}
