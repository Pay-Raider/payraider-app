"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Menu } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/notifications";
import { WalletButton } from "@/components/wallet-connect";

type NavItem = { key: string; path: string };

/** Top-level links, in order of how often an integrator needs them. */
const primaryLinks: NavItem[] = [
  { key: "checkPayment", path: "/prediction" },
  { key: "corridors", path: "/corridors" },
  { key: "anchors", path: "/anchors" },
  { key: "dashboard", path: "/dashboard" },
];

/** Everything else lives in a few dropdowns instead of a 20-item sidebar. */
const menus: { key: string; items: NavItem[] }[] = [
  {
    key: "networkData",
    items: [
      { key: "network", path: "/network" },
      { key: "trustlines", path: "/trustlines" },
      { key: "liquidity", path: "/liquidity" },
      { key: "pools", path: "/liquidity-pools" },
      { key: "networkHealth", path: "/health" },
    ],
  },
  {
    key: "analytics",
    items: [
      { key: "analytics", path: "/analytics" },
      { key: "failedPayments", path: "/analytics/failed-payments" },
      { key: "settlementDistribution", path: "/analytics/settlement-distribution" },
      { key: "forecasting", path: "/corridors/forecasting" },
      { key: "corridorAlerts", path: "/corridor-alerts" },
      { key: "calculator", path: "/calculator" },
      { key: "performance", path: "/performance" },
    ],
  },
  {
    key: "developer",
    items: [
      { key: "apiKeys", path: "/developer/keys" },
      { key: "apiUsage", path: "/analytics/api" },
      { key: "governance", path: "/governance" },
      { key: "sep6", path: "/sep6" },
      { key: "quests", path: "/quests" },
      { key: "privacy", path: "/settings/gdpr" },
      { key: "settings", path: "/settings" },
    ],
  },
];

function isActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavMenu({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  const t = useTranslations("layout.sidebar");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = items.some((item) => isActive(pathname, item.path));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`app-nav-link ${active ? "app-nav-link--active" : ""}`}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="app-nav-menu" role="menu">
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              role="menuitem"
              onClick={() => setOpen(false)}
              aria-current={isActive(pathname, item.path) ? "page" : undefined}
              className={`app-nav-menu-item ${isActive(pathname, item.path) ? "app-nav-menu-item--active" : ""}`}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppHeader({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("layout.sidebar");
  const tGroups = useTranslations("layout.sidebar.groups");

  return (
    <header className="app-header">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link href="/" aria-label="PayRaider home" className="shrink-0">
          <Logo size={34} />
        </Link>

        <nav aria-label={t("mainMenu")} className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
          {primaryLinks.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive(pathname, item.path) ? "page" : undefined}
              className={`app-nav-link ${isActive(pathname, item.path) ? "app-nav-link--active" : ""}`}
            >
              {t(item.key)}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          {menus.map((menu) => (
            <NavMenu
              key={menu.key}
              label={tGroups(menu.key)}
              items={menu.items}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <NetworkSwitcher className="hidden 2xl:block" />
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          <button
            type="button"
            onClick={onMobileMenuOpen}
            aria-label={t("openMenu")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
