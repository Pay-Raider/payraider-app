"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from "@/i18n/navigation";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { PageTransition } from "@/components/motion/PageTransition";

interface MobileAwareLayoutProps {
  children: React.ReactNode;
}

/**
 * Client-side shell that wires the mobile hamburger toggle in the Navbar to
 * the Sidebar's `open` prop.  The sidebar itself handles the overlay on mobile
 * and the fixed panel on desktop; this component just owns the shared state.
 */
export function MobileAwareLayout({ children }: MobileAwareLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const collapsed = useUserPreferences().prefs.sidebarCollapsed;

  // Close sidebar whenever the route changes (mobile navigation)
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const openSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  return (
    // Animations respect the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <Sidebar open={mobileSidebarOpen} onClose={closeSidebar} />

      {/* Offset by the sidebar's width on desktop (rail when collapsed). */}
      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-300 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <AppHeader onMobileMenuOpen={openSidebar} />
        <main id="main-content" className="relative min-w-0 flex-1" tabIndex={-1}>
          {/* Extra bottom padding on mobile for the bottom nav */}
          <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-24 md:px-8 md:py-12 md:pb-12">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      {/* Bottom navigation bar — mobile only */}
      <BottomNav />
    </MotionConfig>
  );
}
