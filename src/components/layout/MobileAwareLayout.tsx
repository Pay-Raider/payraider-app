"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname } from "@/i18n/navigation";

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

  // Close sidebar whenever the route changes (mobile navigation)
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const openSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  return (
    <>
      {/* Navigation drawer for small screens; desktop uses the top bar. */}
      <Sidebar open={mobileSidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-screen flex-col">
        <AppHeader onMobileMenuOpen={openSidebar} />
        <main id="main-content" className="relative min-w-0 flex-1" tabIndex={-1}>
          {/* Extra bottom padding on mobile for the bottom nav */}
          <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-24 md:px-8 md:py-12 md:pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation bar — mobile only */}
      <BottomNav />
    </>
  );
}
