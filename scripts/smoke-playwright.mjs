import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:5173/public/index.html";
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
const oldAgeEndingId = await page.evaluate(() => {
  ["people", "treasury", "army", "court"].forEach((key) => {
    window.__chineseReignsDebug.setResource(key, 30);
  });
  window.__chineseReignsDebug.setCounter("years_ruled", 60);
  return window.__chineseReignsDebug.resolveEndingNow();
});
if (oldAgeEndingId !== "old_age_succession") {
  throw new Error(`Expected old_age_succession at 60 years, got ${oldAgeEndingId}`);
}
await page.waitForSelector("#result-screen:not(.hidden)");
states.push(await readState(page, "ending-old_age_succession"));

await page.screenshot({ path: path.join(outputDir, "03-after-choices.png"), fullPage: true });
writeFileSync(path.join(outputDir, "state-log.json"), JSON.stringify({ states, consoleMessages }, null, 2));
await browser.close();

if (consoleMessages.some((message) => message.startsWith("error") || message.startsWith("pageerror"))) {
  console.error(consoleMessages.join("\n"));
  process.exit(1);
}

const last = JSON.parse(states[states.length - 1].state);
if (!["game", "result"].includes(last.screen)) {
  console.error(`Unexpected final screen: ${last.screen}`);
  process.exit(1);
}

console.log(`Smoke passed. Final screen: ${last.screen}. Screenshots: ${outputDir}`);

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
