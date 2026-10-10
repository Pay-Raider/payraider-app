"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, ExternalLink, LogOut, Shield, Wallet } from "lucide-react";
import { logger } from "@/lib/logger";
import { useWallet } from "../components/lib/wallet-context";
import { preloadWallets, WALLETS, WalletNotInstalledError, type WalletId } from "@/lib/wallets";

type Problem = { message: string; install?: { name: string; url: string } };

function describe(error: unknown, fallback: string): Problem {
  if (error instanceof WalletNotInstalledError) {
    return { message: error.message, install: error.wallet };
  }
  return { message: error instanceof Error && error.message ? error.message : fallback };
}

/** Close a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function ProblemNote({ problem }: { problem: Problem }) {
  return (
    <div role="alert" className="mx-2 mt-2 rounded-xl bg-error/10 px-3 py-2 text-xs text-foreground">
      <p>{problem.message}</p>
      {problem.install && (
        <a
          href={problem.install.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          Install {problem.install.name} <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

const menuClass = "absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-card py-2 shadow-lg";
const itemClass =
  "flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-[var(--sidebar-hover-bg)] disabled:opacity-50";

export function WalletButton() {
  const {
    isConnected,
    address,
    isConnecting,
    isAuthenticated,
    connectWallet,
    isPickerOpen,
    openWalletPicker,
    closeWalletPicker,
    disconnectWallet,
    authenticateWithSep10,
    logout,
  } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, setPending] = useState<WalletId | null>(null);

  const pickerRef = useDismiss(isPickerOpen, closeWalletPicker);
  const menuRef = useDismiss(showMenu, () => setShowMenu(false));

  // Load wallet code before the click, so xBull's popup opens straight from it.
  useEffect(() => {
    if (isPickerOpen) preloadWallets();
  }, [isPickerOpen]);

  const handleConnect = async (walletId: WalletId) => {
    setProblem(null);
    setPending(walletId);
    try {
      await connectWallet(walletId);
    } catch (error) {
      logger.error("Failed to connect wallet:", error);
      setProblem(describe(error, "Could not connect the wallet."));
    } finally {
      setPending(null);
    }
  };

  const handleAuthenticate = async () => {
    setProblem(null);
    setIsAuthenticating(true);
    try {
      await authenticateWithSep10();
      setShowMenu(false);
    } catch (error) {
      logger.error("Failed to authenticate:", error);
      setProblem(describe(error, "Sign-in failed. Please try again."));
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isConnected && address) {
    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setProblem(null);
            setShowMenu(!showMenu);
          }}
          aria-haspopup="menu"
          aria-expanded={showMenu}
          aria-label={`Wallet ${short}`}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition sm:px-4 ${
            isAuthenticated
              ? "border-success/40 bg-success/10 text-success"
              : "border-border bg-surface text-foreground hover:bg-[var(--sidebar-hover-bg)]"
          }`}
        >
          {isAuthenticated ? <CheckCircle className="h-4 w-4" aria-hidden="true" /> : <Wallet className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden font-mono sm:inline">{short}</span>
        </button>

        {showMenu && (
          <div role="menu" className={menuClass}>
            <div className="border-b border-border px-4 pb-2 pt-1">
              <p className="break-all font-mono text-xs text-muted-foreground">{address}</p>
              <p className={`mt-1 text-xs font-medium ${isAuthenticated ? "text-success" : "text-muted-foreground"}`}>
                {isAuthenticated ? "Signed in" : "Connected, not signed in"}
              </p>
            </div>

            {!isAuthenticated ? (
              <button role="menuitem" type="button" onClick={handleAuthenticate} disabled={isAuthenticating} className={itemClass}>
                <Shield className="h-4 w-4" aria-hidden="true" />
                {isAuthenticating ? "Check your wallet to sign…" : "Sign in with this wallet"}
              </button>
            ) : (
              <button
                role="menuitem"
                type="button"
                onClick={async () => {
                  await logout();
                  setShowMenu(false);
                }}
                className={itemClass}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            )}

            <button
              role="menuitem"
              type="button"
              onClick={() => {
                disconnectWallet();
                setShowMenu(false);
              }}
              className={`${itemClass} border-t border-border`}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Disconnect wallet
            </button>
            {problem && <ProblemNote problem={problem} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => {
          setProblem(null);
          if (isPickerOpen) closeWalletPicker();
          else openWalletPicker();
        }}
        aria-haspopup="menu"
        aria-expanded={isPickerOpen}
        aria-label="Connect wallet"
        className="flex items-center gap-2 whitespace-nowrap rounded-full bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-110 sm:px-4"
      >
        <Wallet className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{isConnecting ? "Connecting…" : "Connect Wallet"}</span>
      </button>

      {isPickerOpen && (
        <div role="menu" className={menuClass}>
          <p className="px-4 pb-2 pt-1 text-xs text-muted-foreground">Choose a Stellar wallet</p>
          {WALLETS.map((wallet) => (
            <div key={wallet.id} className="flex items-center">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleConnect(wallet.id)}
                disabled={pending !== null}
                className={`${itemClass} flex-1`}
              >
                {wallet.name}
                {pending === wallet.id && <span className="ml-auto text-xs text-muted-foreground">Waiting for wallet…</span>}
              </button>
              <a
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Get ${wallet.name}`}
                className="px-4 py-2 text-xs text-muted-foreground hover:text-accent hover:underline"
              >
                Get
              </a>
            </div>
          ))}
          {pending === "xbull" && (
            <p className="px-4 pt-1 text-xs text-muted-foreground">Finish in the xBull window that opened.</p>
          )}
          {problem && <ProblemNote problem={problem} />}
        </div>
      )}
    </div>
  );
}
