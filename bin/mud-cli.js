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
    if (!result.ok) {
      throw new Error(result.error || "本地引擎执行失败");
    }
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
      headers: {
        "Content-Type": "application/json"
      },
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
  const recent = (run.log || []).slice(-4);
  console.clear();
  console.log("==================== MUD CLI ====================");
  console.log(`玩家: ${run.player.name} (${run.player.profession})`);
  console.log(`状态: ${run.mode}  Day ${run.day} / Turn ${run.turn}  位置: ${run.location}`);
  console.log(`Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`);
  console.log(`HP ${run.player.hp}/${run.player.maxHp}  MP ${run.player.mp}/${run.player.maxMp}`);
  console.log(`ATK ${run.player.atk} DEF ${run.player.def}  金币 ${run.player.gold}`);
  console.log(`组织: ${run.player.sect || "未选"}  天赋: ${run.player.perk || "未选"}`);
  console.log(
    `战斗 ${run.metrics.battles} 胜利 ${run.metrics.wins} 事件 ${run.metrics.events} 兼职 ${run.metrics.sideJobs}`
  );
  if (run.pendingChoice) {
    console.log(`\n[关键抉择] ${run.pendingChoice.title}`);
    for (const item of run.pendingChoice.options) {
      console.log(`- ${item.id}: ${item.label}`);
    }
  }
  console.log("\n最近日志:");
  for (const line of recent) console.log(`- ${line}`);
  console.log("=================================================");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`mud-cli 使用说明:

  mud-cli [--mode remote|local] [--base-url URL] [--name NAME]

默认 remote 模式会调用线上 API。
如果线上 API 不可用，建议使用 --mode local 直接本地单机游玩。`);
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
      console.log("1) 推进 1 回合");
      console.log("2) 自动推进 5 回合");
      console.log("3) 处理关键抉择");
      console.log("4) 新开一局");
      console.log("5) 切换到本地模式");
      console.log("6) 退出");

      const choice = (await rl.question("\n请输入选项 [1-6]: ")).trim();

      if (choice === "6") break;

      if (choice === "1") {
        const resp = await engine.runAction({ action: "step", run });
        run = resp.run;
      } else if (choice === "2") {
        const resp = await engine.runAction({ action: "auto", steps: 5, run });
        run = resp.run;
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
