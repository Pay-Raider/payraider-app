"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { ShortcutCustomizer } from "@/components/keyboard-shortcuts/ShortcutCustomizer";

export default function SettingsPage() {
  const t = useTranslations("layout.sidebar");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">{t("settings")}</h1>

      {/* Theme customization */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-6">Theme &amp; Appearance</h2>
        <ThemeCustomizer />
      </div>

      {/* Language */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Language</h2>
        <LanguageSwitcher />
      </div>

      {/* Keyboard shortcuts */}
      <div className="glass-card p-6 rounded-2xl">
        <ShortcutCustomizer />
      </div>
    </div>
  );
}
