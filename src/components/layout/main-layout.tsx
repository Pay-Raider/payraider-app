"use client";

import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Kept so existing pages keep compiling. The app shell (MobileAwareLayout in
 * app/[locale]/layout.tsx) already provides the sidebar, top bar, bottom nav
 * and page padding. This used to render a second header, sidebar and
 * background inside it, which covered the real top bar and pushed these
 * pages 256px off-centre.
 */
export function MainLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
