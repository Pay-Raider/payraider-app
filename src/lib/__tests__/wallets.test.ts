import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as freighter from '@stellar/freighter-api';
import * as lobstr from '@lobstrco/signer-extension-api';
import { detectWallet, getWallet, isWalletId, toBase64Signature, WALLETS } from '@/lib/wallets';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  signMessage: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock('@lobstrco/signer-extension-api', () => ({
  isConnected: vi.fn(),
  getPublicKey: vi.fn(),
  signMessage: vi.fn(),
  signTransaction: vi.fn(),
}));

const xbullBridge = {
  connect: vi.fn(),
  sign: vi.fn(),
  signMessage: vi.fn(),
  closeConnections: vi.fn(),
};
vi.mock('@creit.tech/xbull-wallet-connect', () => ({
  xBullWalletConnect: vi.fn(function () {
    return xbullBridge;
  }),
}));

const ACCOUNT = 'GACCOUNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const OPTS = { address: ACCOUNT, networkPassphrase: 'Test SDF Network ; September 2015' };

describe('toBase64Signature', () => {
  it('passes base64 through', () => {
    expect(toBase64Signature('c2ln')).toBe('c2ln');
  });

  it('converts a 64-byte hex signature', () => {
    const bytes = Buffer.alloc(64, 7);
    expect(toBase64Signature(bytes.toString('hex'))).toBe(bytes.toString('base64'));
  });

  it('encodes binary signatures', () => {
    expect(toBase64Signature(new Uint8Array([1, 2, 3]))).toBe('AQID');
  });

  it('rejects a missing signature', () => {
    expect(() => toBase64Signature(null)).toThrow('no signature');
  });
});

describe('wallet registry', () => {
  it('lists only wallets that can sign messages', () => {
    expect(WALLETS.map((w) => w.id)).toEqual(['freighter', 'xbull', 'lobstr']);
    expect(isWalletId('albedo')).toBe(false);
    expect(isWalletId('xbull')).toBe(true);
  });
});

describe('detectWallet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prefers Freighter when installed', async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    expect((await detectWallet())?.id).toBe('freighter');
  });

  it('falls back to LOBSTR, then to nothing', async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    vi.mocked(lobstr.isConnected).mockResolvedValue(true);
    expect((await detectWallet())?.id).toBe('lobstr');

    vi.mocked(lobstr.isConnected).mockRejectedValue(new Error('no extension'));
    expect(await detectWallet()).toBeNull();
  });
});

describe('Freighter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('connects through requestAccess', async () => {
    vi.mocked(freighter.requestAccess).mockResolvedValue({ address: ACCOUNT });
    await expect(getWallet('freighter').connect()).resolves.toBe(ACCOUNT);
  });

  it('surfaces a refusal', async () => {
    vi.mocked(freighter.requestAccess).mockResolvedValue({
      address: '',
      error: { code: -4, message: 'User declined access' },
    });
    await expect(getWallet('freighter').connect()).rejects.toThrow('User declined access');
  });

  it('signs transactions', async () => {
    vi.mocked(freighter.signTransaction).mockResolvedValue({
      signedTxXdr: 'SIGNED',
      signerAddress: ACCOUNT,
    });
    await expect(getWallet('freighter').signTransaction('XDR', OPTS)).resolves.toBe('SIGNED');
    expect(freighter.signTransaction).toHaveBeenCalledWith('XDR', OPTS);
  });
});

describe('xBull', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signs a message and closes the bridge', async () => {
    xbullBridge.signMessage.mockResolvedValue({ signedMessage: 'c2ln', signerAddress: ACCOUNT });
    await expect(getWallet('xbull').signMessage('challenge', OPTS)).resolves.toBe('c2ln');
    expect(xbullBridge.signMessage).toHaveBeenCalledWith('challenge', OPTS);
    expect(xbullBridge.closeConnections).toHaveBeenCalled();
  });

  it('rejects a signature from another account', async () => {
    xbullBridge.signMessage.mockResolvedValue({ signedMessage: 'c2ln', signerAddress: 'GOTHER' });
    await expect(getWallet('xbull').signMessage('challenge', OPTS)).rejects.toThrow(
      'different account',
    );
    expect(xbullBridge.closeConnections).toHaveBeenCalled();
  });

  it('passes the network passphrase when signing a transaction', async () => {
    xbullBridge.sign.mockResolvedValue('SIGNED');
    await expect(getWallet('xbull').signTransaction('XDR', OPTS)).resolves.toBe('SIGNED');
    expect(xbullBridge.sign).toHaveBeenCalledWith({
      xdr: 'XDR',
      publicKey: ACCOUNT,
      network: OPTS.networkPassphrase,
    });
  });
});

describe('LOBSTR', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires an account to connect', async () => {
    vi.mocked(lobstr.getPublicKey).mockResolvedValue('');
    await expect(getWallet('lobstr').connect()).rejects.toThrow('did not share an account');
  });

  it('signs a message', async () => {
    vi.mocked(lobstr.signMessage).mockResolvedValue({ signedMessage: 'c2ln', signerAddress: ACCOUNT });
    await expect(getWallet('lobstr').signMessage('challenge', OPTS)).resolves.toBe('c2ln');
  });

  it('fails when the extension returns nothing', async () => {
    vi.mocked(lobstr.signMessage).mockResolvedValue(null);
    await expect(getWallet('lobstr').signMessage('challenge', OPTS)).rejects.toThrow(
      'did not sign',
    );
  });
});
