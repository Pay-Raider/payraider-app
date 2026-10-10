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

/** Thrown when the chosen wallet is not installed in this browser. */
export class WalletNotInstalledError extends Error {
  constructor(readonly wallet: { name: string; url: string }) {
    super(`${wallet.name} isn't installed in this browser.`);
    this.name = "WalletNotInstalledError";
  }
}

/**
 * How long to wait for the person to approve in their wallet. The wallet
 * libraries wait forever when the extension never answers (it is missing,
 * locked in a broken state, or its popup was blocked), which left the
 * button stuck on "Connecting…" until the page was reloaded.
 */
export const WALLET_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, walletName: string, ms = WALLET_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${walletName} did not respond. Open ${walletName}, check it is unlocked, and try again.`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Extension wallets answer "are you there?" within about two seconds. */
async function requireInstalled(wallet: { name: string; url: string; isAvailable(): Promise<boolean> }) {
  let installed = false;
  try {
    installed = await wallet.isAvailable();
  } catch {
    installed = false;
  }
  if (!installed) throw new WalletNotInstalledError(wallet);
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
    await requireInstalled(freighter);
    const api = await import("@stellar/freighter-api");
    const result = await withTimeout(api.requestAccess(), "Freighter");
    if (result.error || !result.address) {
      throw new Error(errorMessage(result.error, "Freighter did not share an account."));
    }
    return result.address;
  },
  async signMessage(message, opts) {
    await requireInstalled(freighter);
    const api = await import("@stellar/freighter-api");
    const result = await withTimeout(api.signMessage(message, opts), "Freighter");
    if (result.error || !result.signedMessage) {
      throw new Error(errorMessage(result.error, "Freighter did not sign the message."));
    }
    checkSigner(result.signerAddress, opts.address);
    return toBase64Signature(result.signedMessage);
  },
  async signTransaction(xdr, opts) {
    await requireInstalled(freighter);
    const api = await import("@stellar/freighter-api");
    const result = await withTimeout(api.signTransaction(xdr, opts), "Freighter");
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
    const pending = run(bridge);
    // Without the xBull extension the bridge opens xBull's web wallet with
    // window.open as soon as the request starts. If the browser blocked that
    // popup it has no window to wait on and would never settle.
    const hasExtension = typeof window !== "undefined" && "xBullSDK" in window;
    const popup = (bridge as unknown as { target?: Window | null }).target;
    if (!hasExtension && !popup) {
      pending.catch(() => undefined);
      throw new Error("Your browser blocked the xBull window. Allow pop-ups for this site and try again.");
    }
    return await withTimeout(pending, "xBull");
  } catch (error) {
    // The bridge's observables complete empty (RxJS EmptyError, "no elements
    // in sequence") when the xBull window is closed before it answers.
    if (error instanceof Error && (error.name === "EmptyError" || /no elements in sequence/i.test(error.message))) {
      throw new Error("The xBull window was closed before it finished. Try again and complete the request there.");
    }
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
    await requireInstalled(lobstr);
    const api = await import("@lobstrco/signer-extension-api");
    const address = await withTimeout(api.getPublicKey(), "LOBSTR");
    if (!address) {
      throw new Error("LOBSTR did not share an account. Open the extension and try again.");
    }
    return address;
  },
  // LOBSTR signs with whichever account is active; checkSigner catches a
  // mismatch with the connected one.
  async signMessage(message, opts) {
    await requireInstalled(lobstr);
    const api = await import("@lobstrco/signer-extension-api");
    const result = await withTimeout(api.signMessage(message), "LOBSTR");
    if (!result?.signedMessage) {
      throw new Error("LOBSTR did not sign the message.");
    }
    checkSigner(result.signerAddress, opts.address);
    return toBase64Signature(result.signedMessage);
  },
  async signTransaction(xdr) {
    await requireInstalled(lobstr);
    const api = await import("@lobstrco/signer-extension-api");
    const signed = await withTimeout(api.signTransaction(xdr), "LOBSTR");
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

/**
 * Load the wallet libraries ahead of a click (call when the picker opens).
 * xBull opens its popup from the click handler; having its code loaded
 * already keeps that inside the browser's window for user-initiated popups.
 */
export function preloadWallets(): void {
  void import("@stellar/freighter-api").catch(() => undefined);
  void import("@creit.tech/xbull-wallet-connect").catch(() => undefined);
  void import("@lobstrco/signer-extension-api").catch(() => undefined);
}
