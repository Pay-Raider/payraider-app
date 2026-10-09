"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/navbar";
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
      <Sidebar open={mobileSidebarOpen} onClose={closeSidebar} />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex min-h-screen">
        <main
          id="main-content"
          className="flex-1 min-w-0 md:ml-20 lg:ml-64 transition-all duration-300 relative"
          tabIndex={-1}
        >
          {/* Top navbar — passes hamburger callback on mobile */}
          <Navbar onMobileMenuOpen={openSidebar} />

          {/* Page content — extra bottom padding on mobile for bottom nav */}
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10 pb-24 md:pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation bar — mobile only */}
      <BottomNav />
    </>
  );
}
