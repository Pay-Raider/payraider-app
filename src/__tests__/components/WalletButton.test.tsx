import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletProvider } from '@/components/lib/wallet-context';
import { WalletButton } from '@/components/wallet-connect';
import * as freighter from '@stellar/freighter-api';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  signMessage: vi.fn(),
  signTransaction: vi.fn(),
}));
vi.mock('@lobstrco/signer-extension-api', () => ({ isConnected: vi.fn().mockResolvedValue(false) }));
vi.mock('@creit.tech/xbull-wallet-connect', () => ({ xBullWalletConnect: vi.fn() }));

function renderButton() {
  return render(
    <WalletProvider>
      <WalletButton />
    </WalletProvider>,
  );
}

describe('WalletButton', { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('explains a missing extension with an install link instead of hanging', async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Freighter/ }));

    expect(await screen.findByRole('alert', {}, { timeout: 10000 })).toHaveTextContent("Freighter isn't installed");
    expect(screen.getByRole('link', { name: /Install Freighter/ })).toHaveAttribute(
      'href',
      'https://www.freighter.app/',
    );
    expect(freighter.requestAccess).not.toHaveBeenCalled();
    // The picker stays usable.
    expect(screen.getByRole('menuitem', { name: /Freighter/ })).not.toBeDisabled();
  });

  it('closes the picker on Escape', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
