#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createMudService } from "../core/mud-engine.js";
import { formatStateForCli } from "../core/mud-presenter.js";

const mode = process.argv.includes("--remote") ? "remote" : "local";
const endpoint = process.env.MUD_API_URL || "http://127.0.0.1:3000/api/mud/run";
const service = createMudService();

async function sendAction(payload) {
  if (mode === "local") {
    return service.runAction(payload);
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-mode": "cli",
      "user-agent": "mud-cli",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { ok: res.ok, text };
}

function helpText() {
  return [
    "Commands:",
    "  new [seed]",
    "  state",
    "  play <cardIndex>",
    "  end",
    "  reward <cardId|skip>",
    "  remove <cardId>",
    "  next",
    "  restart [seed]",
    "  help",
    "  quit",
  ].join("\n");
}

async function main() {
  const rl = readline.createInterface({ input, output });
  let sessionId = null;

  output.write(`mud-cli mode=${mode}${mode === "remote" ? ` endpoint=${endpoint}` : ""}\n`);
  output.write(`${helpText()}\n`);

  while (true) {
    const raw = (await rl.question("> ")).trim();
    if (!raw) continue;
    const [command, arg] = raw.split(/\s+/, 2);

    if (command === "quit" || command === "exit") break;
    if (command === "help") {
      output.write(`${helpText()}\n`);
      continue;
    }

    let payload;
    if (command === "new") payload = { action: "new", seed: arg ? Number(arg) : undefined };
    if (command === "state") payload = { action: "state", sessionId };
    if (command === "play") payload = { action: "play", sessionId, cardIndex: Number(arg) };
    if (command === "end") payload = { action: "end", sessionId };
    if (command === "reward") payload = { action: "reward", sessionId, cardId: arg === "skip" ? null : arg };
    if (command === "remove") payload = { action: "remove", sessionId, cardId: arg };
    if (command === "next") payload = { action: "next", sessionId };
    if (command === "restart") payload = { action: "restart", sessionId, seed: arg ? Number(arg) : undefined };

    if (!payload) {
      output.write("Unknown command. type `help`\n");
      continue;
    }

    const result = await sendAction(payload);
    if (mode === "remote") {
      output.write(`${result.text}\n`);
      continue;
    }
    if (result.ok && result.sessionId) sessionId = result.sessionId;
    output.write(`${formatStateForCli(result)}\n`);
  }

  rl.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
