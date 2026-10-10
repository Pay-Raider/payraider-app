import { chromium } from "@playwright/test";
const [,, base, outDir, ...paths] = process.argv;
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
await ctx.addInitScript(() => { try { localStorage.setItem("stellar-theme-preference", "dark"); } catch {} });
for (const path of paths) {
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 80)));
  await page.goto(base + path, { waitUntil: "load", timeout: 90000 }).catch((e) => errs.push("NAV " + e.message.slice(0, 60)));
  await page.waitForTimeout(5000);
  const m = await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth - doc.clientWidth;
    // elements sticking out past the main column
    const mr = main?.getBoundingClientRect();
    let wide = 0;
    if (mr) for (const el of main.querySelectorAll("*")) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.right > mr.right + 4) wide++; }
    return { overflowX, wide, height: doc.scrollHeight, text: (main?.innerText || "").slice(0, 60).replace(/\s+/g, " ") };
  });
  const name = path.replace(/\W+/g, "_") || "_root";
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log(`${path.padEnd(36)} overflowX=${m.overflowX} outside=${m.wide} h=${m.height} errs=${errs.length} | ${m.text}`);
  await page.close();
}
await browser.close();
