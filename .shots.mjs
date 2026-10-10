import { chromium } from "@playwright/test";
const out = process.argv[2];
const base = "https://payraider-app.vercel.app/en";
const routes = process.argv.slice(3);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
for (const r of routes) {
  try {
    await p.goto(base + r, { waitUntil: "networkidle", timeout: 45000 });
  } catch (e) { console.log("timeout", r); }
  await p.waitForTimeout(1500);
  const name = (r.replace(/\//g, "_") || "_home") + ".png";
  await p.screenshot({ path: `${out}/${name}` });
  console.log("ok", r);
}
await b.close();
