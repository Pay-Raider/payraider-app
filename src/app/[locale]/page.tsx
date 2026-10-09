"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  AlertTriangle,
  Eye,
  Plug,
  Coins,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "@/components/lib/wallet-context";
import { Reveal, staggerContainer, staggerItem } from "@/components/motion/Reveal";

const PLUGIN_GUIDE_URL =
  "https://github.com/Pay-Raider/payraider-plugin/blob/main/docs/PLUGIN.md";

/** Illustrative response, shown so visitors see what the check returns. */
function ExampleDecision() {
  const t = useTranslations("home.example");
  const checks = [
    { key: "successRate", ok: true },
    { key: "liquidity", ok: false },
    { key: "sampleSize", ok: true },
    { key: "health", ok: true },
  ] as const;

  return (
    <motion.figure
      aria-label={t("label")}
      initial={{ opacity: 0, y: 30, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="float-slow relative rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]"
    >
      <figcaption className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("label")}</span>
        <span className="font-mono">GET /api/v1/preflight</span>
      </figcaption>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="font-mono text-sm text-foreground">{t("payment")}</p>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.6 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-sm font-semibold text-warning"
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {t("decision")}
        </motion.span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("summary")}</p>

      <motion.ul
        className="mt-5 divide-y divide-border border-y border-border"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {checks.map(({ key, ok }) => (
          <motion.li key={key} variants={staggerItem} className="flex items-center gap-3 py-2.5 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                ok ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              }`}
              aria-hidden="true"
            >
              {ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            </span>
            <span className="text-foreground">{t(`checks.${key}`)}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {t(`checks.${key}Value`)}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3 text-sm">
        <span className="text-muted-foreground">{t("alternative")}</span>
        <span className="font-mono text-foreground">{t("alternativeValue")}</span>
      </div>
    </motion.figure>
  );
}

export default function Home() {
  const { isConnected, connectWallet, isConnecting } = useWallet();
  const t = useTranslations("home");

  const steps = ["name", "check", "decide", "pay"] as const;
  const capabilities = [
    { icon: Eye, title: "globalCorridors", body: "globalCorridorsDesc" },
    { icon: Plug, title: "deepTelemetry", body: "deepTelemetryDesc" },
    { icon: Coins, title: "predictiveTrust", body: "predictiveTrustDesc" },
  ] as const;

  return (
    <div className="space-y-24 pb-12">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="grid items-center gap-12 pt-4 lg:grid-cols-[1.1fr_1fr] lg:pt-10"
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={staggerItem} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
            <span className="navbar-live-dot" aria-hidden="true" />
            {t("hero.liveBadge")}
          </motion.p>

          <motion.h1
            variants={staggerItem}
            id="hero-heading"
            className="mt-6 text-5xl font-semibold leading-[1.05] text-foreground md:text-6xl"
          >
            {t("hero.title")}{" "}
            <em className="font-normal italic text-accent">{t("hero.titleHighlight")}</em>
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </motion.p>

          <motion.div variants={staggerItem} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/prediction"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground transition-colors hover:brightness-110"
            >
              {t("hero.enterTerminal")}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            {!isConnected && (
              <button
                onClick={() => connectWallet()}
                disabled={isConnecting}
                className="rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-[var(--sidebar-hover-bg)] disabled:opacity-60"
              >
                {isConnecting ? t("hero.initializing") : t("hero.connectIdentity")}
              </button>
            )}
          </motion.div>
        </motion.div>

        <ExampleDecision />
      </section>

      {/* How it works */}
      <section aria-labelledby="steps-heading">
        <Reveal>
          <h2 id="steps-heading" className="text-3xl font-semibold text-foreground">
            {t("steps.label")}
          </h2>
        </Reveal>
        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, i) => (
            <motion.li key={step} variants={staggerItem} className="bg-card p-6">
              <span className="font-display text-3xl italic text-accent">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {t(`steps.${step}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`steps.${step}.body`)}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </section>

      {/* Why PayRaider */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 md:grid-cols-3"
      >
        {capabilities.map(({ icon: Icon, title, body }) => (
          <motion.div key={title} variants={staggerItem} className="lift rounded-2xl border border-border bg-surface p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-foreground">
              {t(`capabilities.${title}`)}
            </h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {t(`capabilities.${body}`)}
            </p>
          </motion.div>
        ))}
      </motion.section>

      {/* Call to action */}
      <Reveal as="section" className="overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-[var(--accent-soft)] to-card p-10 md:p-14">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-semibold text-foreground">{t("cta.title")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("cta.subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/prediction"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground transition-colors hover:brightness-110"
            >
              {t("cta.launchTerminal")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={PLUGIN_GUIDE_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            >
              {t("cta.readSpec")}
            </a>
          </div>
        </div>
      </Reveal>

      <footer className="flex flex-col items-center justify-between gap-6 border-t border-border pt-10 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <TrendingUp className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-semibold">{t("footer.payRaider")}</span>
        </div>
        <nav aria-label="Footer" className="flex gap-8 text-sm text-muted-foreground">
          <Link href="/corridors" className="transition-colors hover:text-foreground">
            {t("footer.networkStatus")}
          </Link>
          <Link href="/developer/keys" className="transition-colors hover:text-foreground">
            {t("footer.apiKeys")}
          </Link>
          <Link href="/governance" className="transition-colors hover:text-foreground">
            {t("footer.governance")}
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}
