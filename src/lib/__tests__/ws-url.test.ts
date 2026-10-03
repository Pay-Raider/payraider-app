import { describe, expect, it } from 'vitest';
import { getWebSocketUrl } from '@/lib/ws-url';

describe('getWebSocketUrl', () => {
  it('prefers an explicit NEXT_PUBLIC_WS_URL', () => {
    expect(getWebSocketUrl('wss://ws.example.com/ws', 'https://api.example.com')).toBe(
      'wss://ws.example.com/ws',
    );
  });

  it('derives wss from an https API URL', () => {
    expect(getWebSocketUrl('', 'https://payraider-api.onrender.com')).toBe(
      'wss://payraider-api.onrender.com/ws',
    );
  });

  it('derives ws from an http API URL and keeps a base path', () => {
    expect(getWebSocketUrl('', 'http://localhost:8080/backend/')).toBe(
      'ws://localhost:8080/backend/ws',
    );
  });

  it('returns null when nothing is configured or the URL is invalid', () => {
    expect(getWebSocketUrl('', '')).toBeNull();
    expect(getWebSocketUrl('', 'not a url')).toBeNull();
  });
});
