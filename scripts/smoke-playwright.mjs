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

for (let index = 0; index < 8; index += 1) {
  const selector = index % 2 === 0 ? "#left-button" : "#right-button";
  await page.click(selector);
  await page.waitForTimeout(80);
  states.push(await readState(page, `after-choice-${index + 1}`));
  const screen = JSON.parse(states[states.length - 1].state).screen;
  if (screen === "result") break;
}

if (JSON.parse(states[states.length - 1].state).screen === "game") {
  const endingId = await page.evaluate(() => {
    window.__chineseReignsDebug.setResource("people", 100);
    return window.__chineseReignsDebug.resolveEndingNow();
  });
  if (endingId !== "expectation_revolt") {
    throw new Error(`Expected high people ending expectation_revolt, got ${endingId}`);
  }
  await page.waitForSelector("#result-screen:not(.hidden)");
  states.push(await readState(page, "after-forced-ending"));
}

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
