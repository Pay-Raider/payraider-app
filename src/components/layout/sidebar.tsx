"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  TrendingUp,
  Compass,
  Settings,
  Activity,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Waves,
  Droplets,
  Users,
  Database,
  Calculator,
  Key,
  Trophy,
  ScrollText,
  Share2,
  Shield,
  Gauge,
  X,
  Home,
  ShieldCheck,
  Anchor,
} from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BookmarksSidebarSection } from "@/components/BookmarksSidebarSection";

// Pinned items always show at the top, ungrouped.
const pinnedItems = [
  { key: "home", icon: Home, path: "/" },
  { key: "checkPayment", icon: ShieldCheck, path: "/prediction" },
  { key: "anchors", icon: Anchor, path: "/anchors" },
  { key: "terminal", icon: LayoutDashboard, path: "/dashboard" },
];

// Everything else is grouped into collapsible sections so the sidebar
// doesn't read as one long undifferentiated list of 16+ links.
const navGroups = [
  {
    key: "networkData",
    items: [
      { key: "corridors", icon: Compass, path: "/corridors" },
      { key: "network", icon: Share2, path: "/network" },
      { key: "trustlines", icon: Users, path: "/trustlines" },
      { key: "liquidity", icon: Waves, path: "/liquidity" },
      { key: "pools", icon: Droplets, path: "/liquidity-pools" },
    ],
  },
  {
    key: "analytics",
    items: [
      { key: "analytics", icon: BarChart3, path: "/analytics" },
      { key: "apiUsage", icon: Activity, path: "/analytics/api" },
      { key: "failedPayments", icon: BarChart3, path: "/analytics/failed-payments" },
      { key: "settlementDistribution", icon: Gauge, path: "/analytics/settlement-distribution" },
      { key: "calculator", icon: Calculator, path: "/calculator" },
      { key: "performance", icon: Gauge, path: "/performance" },
    ],
  },
  {
    key: "monitoring",
    items: [
      { key: "networkHealth", icon: Activity, path: "/health" },
      { key: "alerts", icon: Activity, path: "/alerts" },
      { key: "corridorAlerts", icon: Bell, path: "/corridor-alerts" },
      { key: "forecasting", icon: TrendingUp, path: "/corridors/forecasting" },
    ],
  },
  {
    key: "developer",
    items: [
      { key: "apiKeys", icon: Key, path: "/developer/keys" },
      { key: "governance", icon: ScrollText, path: "/governance" },
      { key: "quests", icon: Trophy, path: "/quests" },
      { key: "privacy", icon: Shield, path: "/settings/gdpr" },
      { key: "sep6", icon: Database, path: "/sep6" },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

type NavItem = { key: string; icon: typeof LayoutDashboard; path: string };

function NavLink({
  item,
  isActive,
  collapsed,
  label,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  label: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.path}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 group ${isActive
          ? "bg-accent-soft text-foreground"
          : "text-muted-foreground hover:bg-[var(--sidebar-hover-bg)] hover:text-foreground"
        }`}
    >
      <Icon
        aria-hidden="true"
        className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-accent" : "group-hover:text-foreground"}`}
      />
      {!collapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" aria-hidden="true" />
      )}
    </Link>
  );
}

export function Sidebar({ open = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const t = useTranslations("layout.sidebar");
  const tGroups = useTranslations("layout.sidebar.groups");
  const { prefs, setPrefs } = useUserPreferences();
  // The sidebar is now only the mobile drawer, which always shows labels.
  const collapsed = false;

  // Preferences saved before grouped navigation existed have no such field.
  const collapsedGroups = prefs.sidebarCollapsedGroups ?? [];
  const toggleGroup = (groupKey: string) => {
    setPrefs({
      sidebarCollapsedGroups: collapsedGroups.includes(groupKey)
        ? collapsedGroups.filter((k) => k !== groupKey)
        : [...collapsedGroups, groupKey],
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-border">
        <Logo size={30} />
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <nav aria-label="Primary navigation" className="flex-1 px-3 py-5 overflow-y-auto">
        <ul role="list" className="space-y-0.5 m-0 p-0 list-none">
          {pinnedItems.map((item) => (
            <li key={item.path}>
              <NavLink
                item={item}
                isActive={pathname === item.path}
                collapsed={collapsed}
                label={t(item.key)}
                onClick={onClose}
              />
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-4">
          {navGroups.map((group) => {
            const hasActiveItem = group.items.some((item) => pathname === item.path);
            const expanded = hasActiveItem || !collapsedGroups.includes(group.key);
            const panelId = `sidebar-group-${group.key}`;

            return (
              <div key={group.key}>
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors"
                  >
                    <span>{tGroups(group.key)}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
                    />
                  </button>
                )}
                {(collapsed || expanded) && (
                  <ul id={panelId} role="list" className="space-y-0.5 m-0 p-0 list-none mt-1">
                    {group.items.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          item={item}
                          isActive={pathname === item.path}
                          collapsed={collapsed}
                          label={t(item.key)}
                          onClick={onClose}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bookmarks Section */}
      <div className="px-4 border-t border-border/50 pt-3">
        <BookmarksSidebarSection collapsed={collapsed} />
      </div>

      {/* Footer / Settings Section */}
      <div className="p-4 border-t border-border space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 mb-1 flex items-center gap-2" role="status" aria-live="polite">
            <span className="navbar-live-dot" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{t("systemNominal")}</span>
          </div>
        )}

        {!collapsed && (
          <div className="px-2 py-1">
            <LanguageSwitcher />
          </div>
        )}

        <Link
          href="/settings"
          aria-label="Navigate to Settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-[var(--sidebar-hover-bg)] hover:text-foreground transition-all duration-300"
          onClick={onClose}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && (
            <span className="text-sm font-medium">{t("settings")}</span>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar — drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            aria-label="Sidebar navigation"
            className="lg:hidden fixed top-0 left-0 h-screen w-72 overflow-y-auto bg-surface border-r border-border z-[70] animate-in slide-in-from-left duration-300"
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}