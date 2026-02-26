#!/usr/bin/env node

const { createInterface } = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

const DEFAULT_BASE_URL = process.env.MUD_BASE_URL || 'https://adventure-simulator.vercel.app';

const JOBS = ['剑客', '武僧', '策士', '游侠'];
const LOCATIONS = ['城中村', '地铁站', '写字楼', '夜市', '旧工业区', '高架桥下'];
const SECTS = [
  { id: 'logistics', name: '物流突击队', bonus: { atk: 2, hp: 4 } },
  { id: 'nightschool', name: '夜校互助会', bonus: { maxMp: 6, mp: 6 } },
  { id: 'coder', name: '代码搬运宗', bonus: { def: 2, atk: 1 } }
];
const PERKS = [
  { id: 'burst', name: '加班爆发', bonus: { atk: 3 } },
  { id: 'guard', name: '抗压护体', bonus: { def: 2 } },
  { id: 'fortune', name: '节流达人', bonus: { goldGain: 1.25 } }
];

function parseArgs(argv) {
  const args = {
    mode: 'remote',
    baseUrl: DEFAULT_BASE_URL,
    name: '',
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if ((a === '--mode' || a === '-m') && next) {
      args.mode = next;
      i += 1;
    } else if ((a === '--base-url' || a === '-b') && next) {
      args.baseUrl = next;
      i += 1;
    } else if ((a === '--name' || a === '-n') && next) {
      args.name = next;
      i += 1;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

class LocalEngine {
  createRun(name) {
    const profession = pick(JOBS);
    const playerName = name && String(name).trim() ? String(name).trim() : `打工人${randomInt(100, 999)}`;
    return {
      mode: 'running',
      turn: 0,
      day: 1,
      location: pick(LOCATIONS),
      pendingChoice: null,
      flags: { sectChosen: false, perkChosen: false, bossDefeated: false },
      metrics: { battles: 0, wins: 0, events: 0, sideJobs: 0 },
      log: ['你在城市夜色中醒来。'],
      player: {
        name: playerName,
        profession,
        level: 1,
        exp: 0,
        nextExp: 40,
        hp: 60,
        maxHp: 60,
        mp: 20,
        maxMp: 20,
        atk: 10,
        def: 4,
        gold: 50,
        sect: null,
        perk: null,
        goldGain: 1
      }
    };
  }

  gainExp(run, amount) {
    const p = run.player;
    p.exp += amount;
    while (p.exp >= p.nextExp) {
      p.exp -= p.nextExp;
      p.level += 1;
      p.nextExp += 24;
      p.maxHp += 8;
      p.hp = p.maxHp;
      p.maxMp += 4;
      p.mp = p.maxMp;
      p.atk += 2;
      p.def += 1;
      run.log.push(`升级到 Lv.${p.level}，状态已恢复。`);
    }
  }

  maybeChoice(run) {
    const p = run.player;
    if (!run.flags.sectChosen && p.level >= 2) {
      run.pendingChoice = {
        type: 'sect',
        title: '选择组织',
        options: SECTS.map((s) => ({ id: s.id, label: s.name }))
      };
      return;
    }
    if (!run.flags.perkChosen && p.level >= 4) {
      run.pendingChoice = {
        type: 'perk',
        title: '选择天赋',
        options: PERKS.map((s) => ({ id: s.id, label: s.name }))
      };
    }
  }

  applyChoice(run, option) {
    if (!run.pendingChoice) {
      return '当前没有待选择项。';
    }
    if (run.pendingChoice.type === 'sect') {
      const picked = SECTS.find((s) => s.id === option);
      if (!picked) return '无效组织选项。';
      run.player.sect = picked.name;
      run.player.atk += picked.bonus.atk || 0;
      run.player.def += picked.bonus.def || 0;
      run.player.maxHp += picked.bonus.hp || 0;
      run.player.hp += picked.bonus.hp || 0;
      run.player.maxMp += picked.bonus.maxMp || 0;
      run.player.mp += picked.bonus.mp || 0;
      run.flags.sectChosen = true;
      run.log.push(`你加入了 ${picked.name}。`);
    } else {
      const picked = PERKS.find((s) => s.id === option);
      if (!picked) return '无效天赋选项。';
      run.player.perk = picked.name;
      run.player.atk += picked.bonus.atk || 0;
      run.player.def += picked.bonus.def || 0;
      run.player.goldGain = picked.bonus.goldGain || run.player.goldGain;
      run.flags.perkChosen = true;
      run.log.push(`你掌握了天赋 ${picked.name}。`);
    }
    run.pendingChoice = null;
    return '选择已生效。';
  }

  step(run) {
    if (run.mode !== 'running') return '本局已结束。';
    if (run.pendingChoice) return '存在关键抉择，先 choose。';

    run.turn += 1;
    if (run.turn % 8 === 0) run.day += 1;
    run.location = pick(LOCATIONS);
    const p = run.player;

    const roll = Math.random();
    if (roll < 0.42) {
      run.metrics.battles += 1;
      const enemyHp = randomInt(20, 40) + p.level * 2;
      const enemyAtk = randomInt(6, 12) + p.level;
      const damageToEnemy = Math.max(6, p.atk + randomInt(-2, 4));
      const damageToPlayer = Math.max(1, enemyAtk - p.def + randomInt(-2, 2));
      if (damageToEnemy >= enemyHp) {
        run.metrics.wins += 1;
        const gainGold = Math.floor(randomInt(12, 30) * (p.goldGain || 1));
        p.gold += gainGold;
        this.gainExp(run, randomInt(15, 28));
        run.log.push(`你击退对手，获得 ${gainGold} 金币。`);
      } else {
        p.hp -= damageToPlayer;
        run.log.push(`遭遇冲突受伤，损失 ${damageToPlayer} 生命。`);
      }
    } else if (roll < 0.72) {
      run.metrics.events += 1;
      const gain = randomInt(10, 24);
      p.gold += gain;
      this.gainExp(run, randomInt(8, 16));
      run.log.push(`触发城市事件，赚到 ${gain} 金币。`);
    } else {
      run.metrics.sideJobs += 1;
      const heal = randomInt(4, 10);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      run.log.push(`跑完一单兼职，恢复 ${heal} 生命。`);
    }

    if (!run.flags.bossDefeated && p.level >= 6 && run.turn >= 18 && Math.random() < 0.22) {
      run.metrics.battles += 1;
      const bossHp = 90 + p.level * 8;
      const bossAtk = 18 + p.level * 2;
      const playerBurst = p.atk + randomInt(10, 22);
      if (playerBurst >= bossHp) {
        run.flags.bossDefeated = true;
        p.gold += 180;
        this.gainExp(run, 80);
        run.log.push('终局敌人出现，你一击定局。');
      } else {
        const hit = Math.max(6, bossAtk - p.def + randomInt(0, 6));
        p.hp -= hit;
        run.log.push(`终局敌人重创你，损失 ${hit} 生命。`);
      }
    }

    this.maybeChoice(run);
    if (p.hp <= 0) {
      p.hp = 0;
      run.mode = 'ended';
      run.log.push('你在城市夹缝中倒下，本轮结束。');
    }
    if (run.flags.bossDefeated) {
      run.mode = 'ended';
      run.log.push('你击败了终局敌人，成功通关。');
    }
    if (run.log.length > 60) run.log = run.log.slice(-60);
    return '已推进 1 回合。';
  }

  runAction(payload) {
    const { action = 'status', run, option, steps = 1, name } = payload || {};
    let currentRun = run;
    let message = '';
    if (action === 'new' || !currentRun) {
      currentRun = this.createRun(name);
      message = '新局已创建。';
    } else if (action === 'status') {
      message = '状态读取成功。';
    } else if (action === 'choose') {
      message = this.applyChoice(currentRun, option);
    } else if (action === 'step') {
      message = this.step(currentRun);
    } else if (action === 'auto') {
      const count = Math.max(1, Math.min(200, Number(steps) || 1));
      for (let i = 0; i < count; i += 1) {
        this.step(currentRun);
        if (currentRun.mode !== 'running' || currentRun.pendingChoice) break;
      }
      message = `批量推进完成。`;
    } else {
      throw new Error(`不支持的 action: ${action}`);
    }
    return { success: true, action, message, run: currentRun };
  }
}

class RemoteEngine {
  constructor(baseUrl) {
    this.endpoint = `${baseUrl.replace(/\/$/, '')}/api/mud/run`;
  }

  async runAction(payload) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
  console.log('==================== MUD CLI ====================');
  console.log(`玩家: ${run.player.name} (${run.player.profession})`);
  console.log(`状态: ${run.mode}  Day ${run.day} / Turn ${run.turn}  位置: ${run.location}`);
  console.log(`Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`);
  console.log(`HP ${run.player.hp}/${run.player.maxHp}  MP ${run.player.mp}/${run.player.maxMp}`);
  console.log(`ATK ${run.player.atk} DEF ${run.player.def}  金币 ${run.player.gold}`);
  console.log(`组织: ${run.player.sect || '未选'}  天赋: ${run.player.perk || '未选'}`);
  console.log(`战斗 ${run.metrics.battles} 胜利 ${run.metrics.wins} 事件 ${run.metrics.events} 兼职 ${run.metrics.sideJobs}`);
  if (run.pendingChoice) {
    console.log(`\n[关键抉择] ${run.pendingChoice.title}`);
    for (const item of run.pendingChoice.options) {
      console.log(`- ${item.id}: ${item.label}`);
    }
  }
  console.log('\n最近日志:');
  for (const line of recent) console.log(`- ${line}`);
  console.log('=================================================');
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

  let engine = null;
  if (args.mode === 'local') {
    engine = new LocalEngine();
  } else {
    engine = new RemoteEngine(args.baseUrl);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  let run = null;

  try {
    const init = await engine.runAction({ action: 'new', name: args.name });
    run = init.run;

    while (true) {
      printRun(run);
      console.log('\n操作菜单:');
      console.log('1) 推进 1 回合');
      console.log('2) 自动推进 5 回合');
      console.log('3) 处理关键抉择');
      console.log('4) 新开一局');
      console.log('5) 切换到本地模式');
      console.log('6) 退出');

      const choice = (await rl.question('\n请输入选项 [1-6]: ')).trim();

      if (choice === '6') break;

      if (choice === '1') {
        const resp = await engine.runAction({ action: 'step', run });
        run = resp.run;
      } else if (choice === '2') {
        const resp = await engine.runAction({ action: 'auto', steps: 5, run });
        run = resp.run;
      } else if (choice === '3') {
        if (!run.pendingChoice) {
          await rl.question('当前没有关键抉择，回车继续...');
        } else {
          const opt = (await rl.question(`输入 option id (${run.pendingChoice.options.map((o) => o.id).join('/')}): `)).trim();
          const resp = await engine.runAction({ action: 'choose', option: opt, run });
          run = resp.run;
        }
      } else if (choice === '4') {
        const name = (await rl.question('新角色名(可空): ')).trim();
        const resp = await engine.runAction({ action: 'new', name, run: null });
        run = resp.run;
      } else if (choice === '5') {
        engine = new LocalEngine();
        const resp = await engine.runAction({ action: 'new', name: run?.player?.name || '' });
        run = resp.run;
      } else {
        await rl.question('无效输入，回车继续...');
      }
    }
  } catch (err) {
    console.error(`\n运行失败: ${err.message}`);
    console.error('可尝试: mud-cli --mode local');
  } finally {
    rl.close();
  }
}

main();
