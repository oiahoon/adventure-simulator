#!/usr/bin/env node

"use strict";

const { createInterface } = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { createMudService } = require("../core/mud-engine");
const { createCardEngineV2 } = require("../core/card-v2/engine");

const DEFAULT_BASE_URL = process.env.MUD_BASE_URL || "https://adventure-simulator.vercel.app";

function parseArgs(argv) {
  const args = {
    mode: "remote",
    baseUrl: DEFAULT_BASE_URL,
    name: "",
    engine: "v2"
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
    } else if ((a === "--engine" || a === "-e") && next) {
      args.engine = next.toLowerCase();
      i += 1;
    } else if (a === "--help" || a === "-h") {
      args.help = true;
    }
  }
  return args;
}

class LocalEngine {
  constructor(engineVersion) {
    this.engineVersion = engineVersion === "v2" ? "v2" : "v1";
    this.service = this.engineVersion === "v2" ? createCardEngineV2() : createMudService();
  }

  async runAction(payload) {
    const result = this.service.runAction(payload || {});
    if (!result.ok) throw new Error(result.error || "本地引擎执行失败");
    return result.payload;
  }
}

class RemoteEngine {
  constructor(baseUrl, engineVersion) {
    this.endpoint = `${baseUrl.replace(/\/$/, "")}/api/mud/run`;
    this.engineVersion = engineVersion === "v2" ? "v2" : "v1";
  }

  async runAction(payload) {
    const body = { ...(payload || {}), engineVersion: this.engineVersion };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
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
  const handMeta = Array.isArray(run.handMeta)
    ? run.handMeta
    : Array.isArray(run.hand)
    ? run.hand.map((id) => ({ id, title: id, tag: "card" }))
    : [];
  const hand = handMeta.map((c, idx) => `${idx + 1}. ${c.title} [${c.tag}] (${c.id})`);
  const stage = run.story && run.story.lifeStage ? run.story.lifeStage : run.storyStage || "未知阶段";
  const city = run.city || { morale: "-", fatigue: "-", debt: "-", heat: "-" };
  console.clear();
  console.log("==================== CARD MUD CLI ====================");
  console.log(`玩家: ${run.player.name} (${run.player.profession})`);
  console.log(`状态: ${run.mode}  ${stage}  Day ${run.day} / Turn ${run.turn}  位置: ${run.location}`);
  console.log(`Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`);
  console.log(`HP ${run.player.hp}/${run.player.maxHp} MP ${run.player.mp}/${run.player.maxMp} 金币 ${run.player.gold}`);
  console.log(`精神 ${city.morale} 疲劳 ${city.fatigue} 债务 ${city.debt} 热度 ${city.heat}`);
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

  mud-cli [--mode remote|local] [--base-url URL] [--name NAME] [--engine v2|v1]

卡牌协议动作: new/status/draw/play/discard/defer/prefer/choose`);
    return;
  }

  let engine = args.mode === "local" ? new LocalEngine(args.engine) : new RemoteEngine(args.baseUrl, args.engine);
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
      console.log("3) 弃置手牌");
      console.log("4) 延后手牌");
      console.log("5) 处理关键抉择");
      console.log("6) 新开一局");
      console.log("7) 切换到本地模式");
      console.log("8) 设置机会偏好");
      console.log("9) 退出");

      const choice = (await rl.question("\n请输入选项 [1-9]: ")).trim();
      if (choice === "9") break;

      if (choice === "1") {
        const resp = await engine.runAction({ action: "draw", run });
        run = resp.run;
      } else if (choice === "2") {
        if (!run.hand || !run.hand.length) {
          await rl.question("当前无手牌，回车继续...");
        } else {
          const handMeta = Array.isArray(run.handMeta) ? run.handMeta : run.hand.map((id) => ({ id }));
          const cardInput = (await rl.question("输入卡牌序号或 cardId: ")).trim();
          const asIndex = Number(cardInput);
          let cardId = cardInput;
          if (Number.isFinite(asIndex) && asIndex >= 1 && asIndex <= handMeta.length) {
            cardId = handMeta[asIndex - 1].id;
          }
          const resp = await engine.runAction({ action: "play", cardId, run });
          run = resp.run;
        }
      } else if (choice === "3" || choice === "4") {
        if (!run.hand || !run.hand.length) {
          await rl.question("当前无手牌，回车继续...");
        } else {
          const handMeta = Array.isArray(run.handMeta) ? run.handMeta : run.hand.map((id) => ({ id }));
          const cardInput = (await rl.question("输入卡牌序号或 cardId: ")).trim();
          const asIndex = Number(cardInput);
          let cardId = cardInput;
          if (Number.isFinite(asIndex) && asIndex >= 1 && asIndex <= handMeta.length) {
            cardId = handMeta[asIndex - 1].id;
          }
          const action = choice === "3" ? "discard" : "defer";
          const resp = await engine.runAction({ action, cardId, run });
          run = resp.run;
        }
      } else if (choice === "5") {
        if (!run.pendingChoice) {
          await rl.question("当前没有关键抉择，回车继续...");
        } else {
          const opt = (await rl.question(`输入 option id (${run.pendingChoice.options.map((o) => o.id).join("/")}): `)).trim();
          const resp = await engine.runAction({ action: "choose", option: opt, run });
          run = resp.run;
        }
      } else if (choice === "6") {
        const name = (await rl.question("新角色名(可空): ")).trim();
        const resp = await engine.runAction({ action: "new", name, run: null });
        run = resp.run;
      } else if (choice === "7") {
        engine = new LocalEngine(args.engine);
        const resp = await engine.runAction({ action: "new", name: run && run.player ? run.player.name : "" });
        run = resp.run;
      } else if (choice === "8") {
        const pref = (await rl.question("输入偏好 (balanced/survival/growth/debt): ")).trim();
        const resp = await engine.runAction({ action: "prefer", preference: pref, run });
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
