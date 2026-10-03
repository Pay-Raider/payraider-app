/**
 * Stellar wallets PayRaider can sign in with and pay from.
 *
 * Sign-in needs a wallet that can sign an arbitrary message (the backend
 * verifies an Ed25519 signature over the challenge, raw or SEP-53), so only
 * wallets with message signing are listed. Albedo and Rabet cannot sign
 * messages and are left out.
 *
 * Wallet clients are imported lazily: they touch `window`, and most visitors
 * never connect a wallet.
 */

export type WalletId = "freighter" | "xbull" | "lobstr";

export interface SignOptions {
  address: string;
  networkPassphrase: string;
}

export interface WalletAdapter {
  id: WalletId;
  name: string;
  /** Where to get the wallet when it is not installed. */
  url: string;
  /** Whether the wallet can be used in this browser right now. */
  isAvailable(): Promise<boolean>;
  /** Ask the wallet for access and return the account's public key. */
  connect(): Promise<string>;
  /** Sign `message`; returns the base64 Ed25519 signature. */
  signMessage(message: string, opts: SignOptions): Promise<string>;
  /** Sign a transaction envelope; returns the signed XDR. */
  signTransaction(xdr: string, opts: SignOptions): Promise<string>;
}

/**
 * Wallets return signatures as base64, hex or a Buffer depending on the
 * wallet and version. The backend expects base64.
 */
export function toBase64Signature(signed: unknown): string {
  if (typeof signed === "string") {
    if (/^[0-9a-f]{128}$/i.test(signed)) {
      return Buffer.from(signed, "hex").toString("base64");
    }
    return signed;
  }
  // ArrayBuffer.isView rather than instanceof: a Buffer from another realm
  // (an extension, or jsdom in tests) fails instanceof Uint8Array.
  if (ArrayBuffer.isView(signed)) {
    return Buffer.from(signed.buffer, signed.byteOffset, signed.byteLength).toString("base64");
  }
  throw new Error("The wallet returned no signature.");
}

function checkSigner(signer: string | undefined, expected: string) {
  if (signer && signer !== expected) {
    throw new Error("The wallet signed with a different account than the one connected.");
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return typeof error === "string" && error ? error : fallback;
}

const freighter: WalletAdapter = {
  id: "freighter",
  name: "Freighter",
  url: "https://www.freighter.app/",
  async isAvailable() {
    const api = await import("@stellar/freighter-api");
    const result = await api.isConnected();
    return Boolean(result.isConnected);
  },
  async connect() {
    const api = await import("@stellar/freighter-api");
    const result = await api.requestAccess();
    if (result.error || !result.address) {
      throw new Error(errorMessage(result.error, "Freighter did not share an account."));
    }
    return result.address;
  },
  async signMessage(message, opts) {
    const api = await import("@stellar/freighter-api");
    const result = await api.signMessage(message, opts);
    if (result.error || !result.signedMessage) {
      throw new Error(errorMessage(result.error, "Freighter did not sign the message."));
    }
    checkSigner(result.signerAddress, opts.address);
    return toBase64Signature(result.signedMessage);
  },
  async signTransaction(xdr, opts) {
    const api = await import("@stellar/freighter-api");
    const result = await api.signTransaction(xdr, opts);
    if (result.error || !result.signedTxXdr) {
      throw new Error(errorMessage(result.error, "Freighter did not sign the transaction."));
    }
    return result.signedTxXdr;
  },
};

// xBull runs as a web wallet in a popup (or its extension), so it needs no
// install check. Each bridge is single-use.
async function withXBull<T>(
  run: (bridge: import("@creit.tech/xbull-wallet-connect").xBullWalletConnect) => Promise<T>,
): Promise<T> {
  const { xBullWalletConnect } = await import("@creit.tech/xbull-wallet-connect");
  const bridge = new xBullWalletConnect();
  try {
    return await run(bridge);
  } catch (error) {
    throw new Error(errorMessage(error, "xBull request was rejected."));
  } finally {
    bridge.closeConnections();
  }
}

const xbull: WalletAdapter = {
  id: "xbull",
  name: "xBull",
  url: "https://xbull.app/",
  async isAvailable() {
    return typeof window !== "undefined";
  },
  connect() {
    return withXBull(bridge => bridge.connect());
  },
  signMessage(message, opts) {
    return withXBull(async bridge => {
      const result = await bridge.signMessage(message, opts);
      checkSigner(result.signerAddress, opts.address);
      return toBase64Signature(result.signedMessage);
    });
  },
  signTransaction(xdr, opts) {
    return withXBull(bridge =>
      bridge.sign({ xdr, publicKey: opts.address, network: opts.networkPassphrase }),
    );
  },
};

const lobstr: WalletAdapter = {
  id: "lobstr",
  name: "LOBSTR",
  url: "https://lobstr.co/signer-extension/",
  async isAvailable() {
    const api = await import("@lobstrco/signer-extension-api");
    return api.isConnected();
  },
  async connect() {
    const api = await import("@lobstrco/signer-extension-api");
    const address = await api.getPublicKey();
    if (!address) {
      throw new Error("LOBSTR did not share an account. Open the extension and try again.");
    }
    return address;
  },
  // LOBSTR signs with whichever account is active; checkSigner catches a
  // mismatch with the connected one.
  async signMessage(message, opts) {
    const api = await import("@lobstrco/signer-extension-api");
    const result = await api.signMessage(message);
    if (!result?.signedMessage) {
      throw new Error("LOBSTR did not sign the message.");
    }
    checkSigner(result.signerAddress, opts.address);
    return toBase64Signature(result.signedMessage);
  },
  async signTransaction(xdr) {
    const api = await import("@lobstrco/signer-extension-api");
    const signed = await api.signTransaction(xdr);
    if (!signed) {
      throw new Error("LOBSTR did not sign the transaction.");
    }
    return signed;
  },
};

export const WALLETS: readonly WalletAdapter[] = [freighter, xbull, lobstr];

export function isWalletId(value: unknown): value is WalletId {
  return WALLETS.some(wallet => wallet.id === value);
}

export function getWallet(id: WalletId): WalletAdapter {
  const wallet = WALLETS.find(w => w.id === id);
  if (!wallet) throw new Error(`Unknown wallet: ${id}`);
  return wallet;
}

/**
 * The first installed browser-extension wallet, for "connect" buttons that
 * do not offer a choice. xBull is never auto-picked because it opens a popup.
 */
export async function detectWallet(): Promise<WalletAdapter | null> {
  for (const wallet of [freighter, lobstr]) {
    try {
      if (await wallet.isAvailable()) return wallet;
    } catch {
      // Treat a failing probe as "not installed".
    }
  }
  return null;
}
