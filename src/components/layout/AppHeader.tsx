"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/notifications";
import { WalletButton } from "@/components/wallet-connect";

/**
 * Slim top bar. Navigation lives in the sidebar; this carries the account
 * and status controls, plus the logo and menu button on small screens.
 */
export function AppHeader({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const t = useTranslations("layout.sidebar");

  return (
    <header className="app-header">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-8">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label={t("openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link href="/" aria-label="PayRaider home" className="logo-link md:hidden">
          <Logo size={30} />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <NetworkSwitcher className="hidden lg:block" />
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden sm:block">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}
