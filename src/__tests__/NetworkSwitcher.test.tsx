import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { NetworkProvider } from '@/contexts/NetworkContext';

const MAINNET_NETWORK = {
  network: 'mainnet' as const,
  display_name: 'Mainnet',
  rpc_url: 'https://stellar.api.onfinality.io/public',
  horizon_url: 'https://horizon.stellar.org',
  network_passphrase: 'Public Global Stellar Network ; September 2015',
  color: '#2563EB',
  is_mainnet: true,
  is_testnet: false,
};

const TESTNET_NETWORK = {
  network: 'testnet' as const,
  display_name: 'Testnet',
  rpc_url: 'https://soroban-testnet.stellar.org',
  horizon_url: 'https://horizon-testnet.stellar.org',
  network_passphrase: 'Test SDF Network ; September 2015',
  color: '#4ECDC4',
  is_mainnet: false,
  is_testnet: true,
};

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: ok ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('NetworkSwitcher', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/network/info')) return jsonResponse(MAINNET_NETWORK);
      if (url.endsWith('/network/available')) return jsonResponse([MAINNET_NETWORK, TESTNET_NETWORK]);
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('reads the network from the backend, not the web app origin', async () => {
    render(<NetworkProvider><NetworkSwitcher /></NetworkProvider>);

    await screen.findByRole('button', { name: 'Network: Mainnet' });
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.some((u) => u.endsWith('/network/info'))).toBe(true);
    expect(urls.every((u) => /^https?:\/\//.test(u))).toBe(true);
  });

  it('lists known networks and explains the network is fixed per deployment', async () => {
    render(<NetworkProvider><NetworkSwitcher /></NetworkProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Network: Mainnet' }));

    await waitFor(() => expect(screen.getByText('Testnet')).toBeInTheDocument());
    expect(screen.getByText(/This deployment serves Mainnet/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/network/switch'))).toBe(false);
  });

  it('shows the API as offline when it cannot be reached', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));
    render(<NetworkProvider><NetworkSwitcher /></NetworkProvider>);

    expect(await screen.findByText('API offline')).toBeInTheDocument();
  });
});
