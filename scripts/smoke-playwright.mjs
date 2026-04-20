import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const mobileRegression = args.includes("--mobile-regression");
const urlArg = args.find((arg) => !arg.startsWith("--"));
const url = urlArg ?? "http://127.0.0.1:5173/public/index.html";
const outputDir = path.join(process.cwd(), "tmp", "smoke");
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
});

const consoleMessages = [];
page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => consoleMessages.push(`pageerror: ${error.message}`));

await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "01-start.png"), fullPage: true });
await page.click("#start-button");
await page.waitForSelector("#game-screen:not(.hidden)");
await page.screenshot({ path: path.join(outputDir, "02-game.png"), fullPage: true });

const states = [];
states.push(await readState(page, "after-start"));

await dragCard(page, "right");
await page.waitForTimeout(80);
states.push(await readState(page, "after-drag-right"));

for (let index = 0; index < 7; index += 1) {
  const selector = index % 2 === 0 ? "#left-button" : "#right-button";
  await page.click(selector);
  await page.waitForTimeout(80);
  states.push(await readState(page, `after-choice-${index + 1}`));
  const screen = JSON.parse(states[states.length - 1].state).screen;
  if (screen === "result") break;
}

const endingCases = [
  ["people", 0, "rebellion"],
  ["people", 100, "expectation_revolt"],
  ["treasury", 0, "empty_treasury"],
  ["treasury", 100, "corruption_flood"],
  ["army", 0, "frontier_collapse"],
  ["army", 100, "military_takeover"],
  ["court", 0, "coup"],
  ["court", 100, "bureaucratic_suffocation"],
];

for (const [resource, value, expectedEndingId] of endingCases) {
  await ensureGameScreen(page);
  const endingId = await page.evaluate(([key, nextValue]) => {
    window.__chineseReignsDebug.setResource(key, nextValue);
    return window.__chineseReignsDebug.resolveEndingNow();
  }, [resource, value]);
  if (endingId !== expectedEndingId) {
    throw new Error(`Expected ${expectedEndingId} for ${resource}=${value}, got ${endingId}`);
  }
  await page.waitForSelector("#result-screen:not(.hidden)");
  states.push(await readState(page, `ending-${expectedEndingId}`));
}

await ensureGameScreen(page);
const alchemyEndingId = await page.evaluate(() => {
  ["people", "treasury", "army", "court"].forEach((key) => {
    window.__chineseReignsDebug.setResource(key, 50);
  });
  window.__chineseReignsDebug.setCounter("years_ruled", 5);
  window.__chineseReignsDebug.setCounter("alchemy_trust", 3);
  return window.__chineseReignsDebug.resolveEndingNow();
});
if (alchemyEndingId !== "alchemy_death") {
  throw new Error(`Expected alchemy_death, got ${alchemyEndingId}`);
}
await page.waitForSelector("#result-screen:not(.hidden)");
states.push(await readState(page, "ending-alchemy_death"));

await ensureGameScreen(page);
const peacefulEndingId = await page.evaluate(() => {
  ["people", "treasury", "army", "court"].forEach((key) => {
    window.__chineseReignsDebug.setResource(key, 50);
  });
  window.__chineseReignsDebug.setCounter("alchemy_trust", 0);
  window.__chineseReignsDebug.setCounter("years_ruled", 26);
  window.__chineseReignsDebug.setFlag("taizi_established", true);
  return window.__chineseReignsDebug.resolveEndingNow();
});
if (peacefulEndingId !== "peaceful_abdication") {
  throw new Error(`Expected peaceful_abdication, got ${peacefulEndingId}`);
}
await page.waitForSelector("#result-screen:not(.hidden)");
states.push(await readState(page, "ending-peaceful_abdication"));

await ensureGameScreen(page);
const oldAgeEndingId = await page.evaluate(() => {
  ["people", "treasury", "army", "court"].forEach((key) => {
    window.__chineseReignsDebug.setResource(key, 30);
  });
  window.__chineseReignsDebug.setCounter("alchemy_trust", 0);
  window.__chineseReignsDebug.setCounter("years_ruled", 60);
  return window.__chineseReignsDebug.resolveEndingNow();
});
if (oldAgeEndingId !== "old_age_succession") {
  throw new Error(`Expected old_age_succession at 60 years, got ${oldAgeEndingId}`);
}
await page.waitForSelector("#result-screen:not(.hidden)");
states.push(await readState(page, "ending-old_age_succession"));

await page.click("#generate-share-button");
await page.waitForSelector("#share-preview-panel:not(.hidden)");
states.push(await readState(page, "share-preview-generated"));

let mobileReport = null;
if (mobileRegression) {
  mobileReport = await runMobileRegression(browser, url);
  writeFileSync(path.join(outputDir, "mobile-regression-report.json"), JSON.stringify(mobileReport, null, 2));
}

await page.screenshot({ path: path.join(outputDir, "03-after-choices.png"), fullPage: true });
writeFileSync(
  path.join(outputDir, "state-log.json"),
  JSON.stringify({ states, consoleMessages, mobileReport }, null, 2),
);
await browser.close();

if (consoleMessages.some((message) => message.startsWith("error") || message.startsWith("pageerror"))) {
  console.error(consoleMessages.join("\n"));
  process.exit(1);
}

if (mobileReport) {
  const mobileFailures = mobileReport.filter((item) => item.failures.length > 0);
  if (mobileFailures.length > 0) {
    console.error(JSON.stringify(mobileFailures, null, 2));
    process.exit(1);
  }
}

const last = JSON.parse(states[states.length - 1].state);
if (!["game", "result"].includes(last.screen)) {
  console.error(`Unexpected final screen: ${last.screen}`);
  process.exit(1);
}

const suffix = mobileReport ? ` Mobile viewports checked: ${mobileReport.length}.` : "";
console.log(`Smoke passed. Final screen: ${last.screen}. Screenshots: ${outputDir}.${suffix}`);

async function readState(page, label) {
  const state = await page.evaluate(() => window.render_game_to_text?.() ?? "{}");
  return { label, state };
}

async function ensureGameScreen(page) {
  const screen = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? "{}")).screen;
  if (screen === "game") return;
  if (screen === "result") {
    await page.click("#next-reign-button");
  } else if (screen === "start") {
    await page.click("#start-button");
  }
  await page.waitForSelector("#game-screen:not(.hidden)");
}

async function dragCard(page, side) {
  const card = page.locator("#event-card");
  const box = await card.boundingBox();
  if (!box) throw new Error("Event card is not visible");
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = startX + (side === "right" ? 140 : -140);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, startY, { steps: 8 });
  await page.mouse.up();
}

async function runMobileRegression(browser, url) {
  const regressionDir = path.join(outputDir, "mobile-regression");
  mkdirSync(regressionDir, { recursive: true });
  const viewports = [
    { name: "iphone-se", width: 375, height: 667 },
    { name: "android-small", width: 360, height: 740 },
    { name: "iphone-12", width: 390, height: 844 },
    { name: "pixel-7", width: 412, height: 915 },
  ];

  const report = [];
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
      isMobile: true,
    });

    const warnings = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        warnings.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => warnings.push(`pageerror: ${error.message}`));

    await page.goto(url, { waitUntil: "networkidle" });
    await page.click("#start-button");
    await page.waitForSelector("#game-screen:not(.hidden)");

    const before = await page.evaluate(() => {
      const game = document.querySelector("#game-screen");
      const card = document.querySelector("#event-card");
      const buttons = document.querySelector(".choice-buttons");
      const cardRect = card.getBoundingClientRect();
      const buttonRect = buttons.getBoundingClientRect();
      const previousScrollY = window.scrollY;
      window.scrollTo(0, 9999);
      const maxScrollY = window.scrollY;
      window.scrollTo(0, previousScrollY);

      return {
        innerHeight: window.innerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        gameScrollHeight: game.scrollHeight,
        maxScrollY,
        cardRect: serializeRect(cardRect),
        buttonRect: serializeRect(buttonRect),
        gameFitsViewport: game.scrollHeight <= window.innerHeight + 1,
        cardVisible: cardRect.top >= 0 && cardRect.bottom <= window.innerHeight + 1,
        buttonsVisible: buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight + 1,
        buttonGap: Math.round(window.innerHeight - buttonRect.bottom),
        year: Number(document.querySelector("#year-count").textContent),
      };

      function serializeRect(rect) {
        return {
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }
    });

    await page.screenshot({ path: path.join(regressionDir, `${viewport.name}-before.png`), fullPage: true });
    await dragCard(page, "right");
    await page.waitForTimeout(120);

    const after = await page.evaluate(() => ({
      year: Number(document.querySelector("#year-count").textContent),
      screen: window.render_game_to_text ? JSON.parse(window.render_game_to_text()).screen : "unknown",
      gameScrollHeight: document.querySelector("#game-screen").scrollHeight,
      innerHeight: window.innerHeight,
    }));

    await page.screenshot({ path: path.join(regressionDir, `${viewport.name}-after-swipe.png`), fullPage: true });

    const failures = [];
    if (before.maxScrollY > 1) failures.push("page-scrolls-on-mobile");
    if (!before.cardVisible) failures.push("card-not-fully-visible");
    if (!before.buttonsVisible) failures.push("choice-buttons-not-fully-visible");
    if (!(after.year > before.year && after.screen === "game")) failures.push("swipe-did-not-advance-year");
    if (warnings.length > 0) failures.push("console-warnings");

    report.push({
      viewport,
      before,
      after,
      warnings,
      failures,
    });

    await page.close();
  }

  return report;
}
