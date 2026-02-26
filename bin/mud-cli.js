#!/usr/bin/env node

"use strict";

const { createInterface } = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { createMudService } = require("../core/mud-engine");

const DEFAULT_BASE_URL = process.env.MUD_BASE_URL || "https://adventure-simulator.vercel.app";

function parseArgs(argv) {
  const args = {
    mode: "remote",
    baseUrl: DEFAULT_BASE_URL,
    name: ""
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if ((a === "--mode" || a === "-m") && next) {
      args.mode = next;
      i += 1;
    } else if ((a === "--base-url" || a === "-b") && next) {
      args.baseUrl = next;
      i += 1;
    } else if ((a === "--name" || a === "-n") && next) {
      args.name = next;
      i += 1;
    } else if (a === "--help" || a === "-h") {
      args.help = true;
    }
  }
  return args;
}

class LocalEngine {
  constructor() {
    this.service = createMudService();
  }

  async runAction(payload) {
    const result = this.service.runAction(payload || {});
    if (!result.ok) throw new Error(result.error || "本地引擎执行失败");
    return result.payload;
  }
}

class RemoteEngine {
  constructor(baseUrl) {
    this.endpoint = `${baseUrl.replace(/\/$/, "")}/api/mud/run`;
  }

  async runAction(payload) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`远程请求失败 (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  }
}

function printRun(run) {
  const recent = (run.log || []).slice(-5);
  const hand = (run.hand || []).map((c, idx) => `${idx + 1}. ${c.title} [${c.tag}] (${c.id})`);
  console.clear();
  console.log("==================== CARD MUD CLI ====================");
  console.log(`玩家: ${run.player.name} (${run.player.profession})`);
  console.log(`状态: ${run.mode}  ${run.story.lifeStage}  Day ${run.day} / Turn ${run.turn}  位置: ${run.location}`);
  console.log(`Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`);
  console.log(`HP ${run.player.hp}/${run.player.maxHp} MP ${run.player.mp}/${run.player.maxMp} 金币 ${run.player.gold}`);
  console.log(`精神 ${run.city.morale} 疲劳 ${run.city.fatigue} 债务 ${run.city.debt} 热度 ${run.city.heat}`);
  console.log(`组织: ${run.player.sect || "未选"} 天赋: ${run.player.perk || "未选"}`);
  console.log(`出牌 ${run.metrics.cardPlays} 关键事件 ${run.metrics.keyEvents}`);
  if (run.pendingChoice) {
    console.log(`\n[关键抉择] ${run.pendingChoice.title}`);
    for (const item of run.pendingChoice.options) console.log(`- ${item.id}: ${item.label}`);
  }
  console.log("\n当前手牌:");
  if (!hand.length) console.log("- 无（可使用 draw）");
  else hand.forEach((line) => console.log(`- ${line}`));
  console.log("\n最近日志:");
  recent.forEach((line) => console.log(`- ${line}`));
  console.log("=======================================================");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`mud-cli 使用说明:

  mud-cli [--mode remote|local] [--base-url URL] [--name NAME]

卡牌协议动作: new/status/draw/play/choose`);
    return;
  }

  let engine = args.mode === "local" ? new LocalEngine() : new RemoteEngine(args.baseUrl);
  const rl = createInterface({ input: stdin, output: stdout });
  let run = null;

  try {
    const init = await engine.runAction({ action: "new", name: args.name });
    run = init.run;

    while (true) {
      printRun(run);
      console.log("\n操作菜单:");
      console.log("1) 抽牌");
      console.log("2) 出牌");
      console.log("3) 处理关键抉择");
      console.log("4) 新开一局");
      console.log("5) 切换到本地模式");
      console.log("6) 退出");

      const choice = (await rl.question("\n请输入选项 [1-6]: ")).trim();
      if (choice === "6") break;

      if (choice === "1") {
        const resp = await engine.runAction({ action: "draw", run });
        run = resp.run;
      } else if (choice === "2") {
        if (!run.hand || !run.hand.length) {
          await rl.question("当前无手牌，回车继续...");
        } else {
          const cardInput = (await rl.question("输入卡牌序号或 cardId: ")).trim();
          const asIndex = Number(cardInput);
          let cardId = cardInput;
          if (Number.isFinite(asIndex) && asIndex >= 1 && asIndex <= run.hand.length) {
            cardId = run.hand[asIndex - 1].id;
          }
          const resp = await engine.runAction({ action: "play", cardId, run });
          run = resp.run;
        }
      } else if (choice === "3") {
        if (!run.pendingChoice) {
          await rl.question("当前没有关键抉择，回车继续...");
        } else {
          const opt = (await rl.question(`输入 option id (${run.pendingChoice.options.map((o) => o.id).join("/")}): `)).trim();
          const resp = await engine.runAction({ action: "choose", option: opt, run });
          run = resp.run;
        }
      } else if (choice === "4") {
        const name = (await rl.question("新角色名(可空): ")).trim();
        const resp = await engine.runAction({ action: "new", name, run: null });
        run = resp.run;
      } else if (choice === "5") {
        engine = new LocalEngine();
        const resp = await engine.runAction({ action: "new", name: run && run.player ? run.player.name : "" });
        run = resp.run;
      } else {
        await rl.question("无效输入，回车继续...");
      }
    }
  } catch (err) {
    console.error(`\n运行失败: ${err.message}`);
    console.error("可尝试: mud-cli --mode local");
  } finally {
    rl.close();
  }
}

main();
