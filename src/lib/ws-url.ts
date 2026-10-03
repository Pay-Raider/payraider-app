/**
 * WebSocket URL for the PayRaider backend.
 *
 * Uses NEXT_PUBLIC_WS_URL when set; otherwise derives it from
 * NEXT_PUBLIC_API_URL (http -> ws, https -> wss) plus the backend's `/ws`
 * route. Returns null when neither is configured, so callers skip
 * connecting instead of falling back to localhost (which production pages
 * cannot reach and the CSP blocks).
 */
export function getWebSocketUrl(
  wsUrl: string | undefined = process.env.NEXT_PUBLIC_WS_URL,
  apiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL,
): string | null {
  if (wsUrl) return wsUrl;
  if (!apiUrl) return null;

  try {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
