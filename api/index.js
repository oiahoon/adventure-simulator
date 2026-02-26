const express = require('express');
const cors = require('cors');

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 简单的LLM服务类
class SimpleLLMService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_TOKEN;
        this.baseURL = 'https://api.deepseek.com/v1';
    }

    isAvailable() {
        return !!this.apiKey;
    }

    async generateWuxiaEvent(character, location, context = {}) {
        if (!this.isAvailable()) {
            throw new Error('LLM服务不可用：缺少API密钥');
        }

        const prompt = `请为武侠MUD游戏生成一个事件。

角色信息：
- 姓名：${character.name}
- 等级：${character.level}
- 职业：${character.profession}
- 当前地点：${location}

请生成一个适合的武侠风格事件，包含：
1. 事件标题
2. 详细描述（150-200字）
3. 奖励设置

输出JSON格式：
{
  "title": "事件标题",
  "description": "详细描述",
  "effects": {
    "status": {
      "experience": 30,
      "wealth": 20
    }
  },
  "rarity": "common"
}`;

        try {
            const axios = require('axios');
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是专业的武侠小说作家和游戏设计师。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.9,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const content = response.data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    ...parsed,
                    id: `llm_${Date.now()}`,
                    source: 'DeepSeek LLM',
                    generated_at: new Date().toISOString()
                };
            }
            
            throw new Error('无法解析LLM响应');

        } catch (error) {
            console.error('LLM API调用失败:', error);
            throw error;
        }
    }
}

// 初始化LLM服务
const llmService = new SimpleLLMService();

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

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

function isCliRequest(req) {
    const mode = String(req.headers['x-client-mode'] || '').toLowerCase();
    const accept = String(req.headers.accept || '').toLowerCase();
    const userAgent = String(req.headers['user-agent'] || '').toLowerCase();
    return (
        mode === 'cli' ||
        accept.includes('text/plain') ||
        userAgent.includes('curl') ||
        userAgent.includes('wget') ||
        userAgent.includes('httpie')
    );
}

function createRun(name) {
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

function pushLog(run, text) {
    run.log.push(text);
    if (run.log.length > 40) {
        run.log = run.log.slice(-40);
    }
}

function gainExp(run, amount) {
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
        pushLog(run, `升级到 Lv.${p.level}，状态已恢复。`);
    }
}

function maybeOpenChoice(run) {
    const p = run.player;
    if (!run.flags.sectChosen && p.level >= 2) {
        run.pendingChoice = {
            type: 'sect',
            title: '选择组织',
            options: SECTS.map((s) => ({ id: s.id, label: s.name }))
        };
        return true;
    }
    if (!run.flags.perkChosen && p.level >= 4) {
        run.pendingChoice = {
            type: 'perk',
            title: '选择天赋',
            options: PERKS.map((s) => ({ id: s.id, label: s.name }))
        };
        return true;
    }
    return false;
}

function applyChoice(run, option) {
    if (!run.pendingChoice) {
        return '当前没有待选择项。';
    }
    const choice = run.pendingChoice;
    if (choice.type === 'sect') {
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
        pushLog(run, `你加入了 ${picked.name}。`);
    } else if (choice.type === 'perk') {
        const picked = PERKS.find((s) => s.id === option);
        if (!picked) return '无效天赋选项。';
        run.player.perk = picked.name;
        run.player.atk += picked.bonus.atk || 0;
        run.player.def += picked.bonus.def || 0;
        run.player.goldGain = picked.bonus.goldGain || run.player.goldGain;
        run.flags.perkChosen = true;
        pushLog(run, `你掌握了天赋 ${picked.name}。`);
    }
    run.pendingChoice = null;
    return '选择已生效。';
}

function endIfNeeded(run) {
    if (run.player.hp <= 0) {
        run.player.hp = 0;
        run.mode = 'ended';
        pushLog(run, '你在城市夹缝中倒下，本轮结束。');
        return true;
    }
    if (run.flags.bossDefeated) {
        run.mode = 'ended';
        pushLog(run, '你击败了终局敌人，成功通关。');
        return true;
    }
    return false;
}

function stepRun(run) {
    if (run.mode !== 'running') {
        return '本局已结束，请 new 开始新局。';
    }
    if (run.pendingChoice) {
        return '存在关键抉择，先 choose。';
    }
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
            gainExp(run, randomInt(15, 28));
            pushLog(run, `你击退对手，获得 ${gainGold} 金币。`);
        } else {
            p.hp -= damageToPlayer;
            pushLog(run, `遭遇冲突受伤，损失 ${damageToPlayer} 生命。`);
        }
    } else if (roll < 0.72) {
        run.metrics.events += 1;
        const gain = randomInt(10, 24);
        p.gold += gain;
        gainExp(run, randomInt(8, 16));
        pushLog(run, `触发城市事件，赚到 ${gain} 金币。`);
    } else {
        run.metrics.sideJobs += 1;
        const heal = randomInt(4, 10);
        p.hp = Math.min(p.maxHp, p.hp + heal);
        pushLog(run, `跑完一单兼职，恢复 ${heal} 生命。`);
    }

    if (!run.flags.bossDefeated && p.level >= 6 && run.turn >= 18 && Math.random() < 0.22) {
        run.metrics.battles += 1;
        const bossHp = 90 + p.level * 8;
        const bossAtk = 18 + p.level * 2;
        const playerBurst = p.atk + randomInt(10, 22);
        if (playerBurst >= bossHp) {
            run.flags.bossDefeated = true;
            p.gold += 180;
            gainExp(run, 80);
            pushLog(run, '终局敌人出现，你一击定局。');
        } else {
            const hit = Math.max(6, bossAtk - p.def + randomInt(0, 6));
            p.hp -= hit;
            pushLog(run, `终局敌人重创你，损失 ${hit} 生命。`);
        }
    }

    maybeOpenChoice(run);
    endIfNeeded(run);
    return '已推进 1 回合。';
}

function summarizeRun(run) {
    const status = run.mode === 'ended' ? 'END' : 'RUN';
    const choice = run.pendingChoice
        ? `${run.pendingChoice.title}: ${run.pendingChoice.options.map((o) => `${o.id}/${o.label}`).join(', ')}`
        : '无';
    const recent = run.log.slice(-4).map((l) => `- ${l}`).join('\n');
    return [
        `=== CLI MUD (${status}) ===`,
        `玩家: ${run.player.name} (${run.player.profession})`,
        `等级: Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`,
        `生命/体力: ${run.player.hp}/${run.player.maxHp}  MP ${run.player.mp}/${run.player.maxMp}`,
        `战力: ATK ${run.player.atk} DEF ${run.player.def}`,
        `金币: ${run.player.gold}  位置: ${run.location}  天数: ${run.day}  回合: ${run.turn}`,
        `组织: ${run.player.sect || '未选'}  天赋: ${run.player.perk || '未选'}`,
        `战斗: ${run.metrics.battles} 胜利: ${run.metrics.wins} 事件: ${run.metrics.events} 兼职: ${run.metrics.sideJobs}`,
        `待选择: ${choice}`,
        '',
        '最近日志:',
        recent || '- 无',
        '',
        '可用动作:',
        '- new            新开一局',
        '- status         查看状态',
        '- step           推进 1 回合',
        '- auto           批量推进，传 steps',
        '- choose         处理抉择，传 option'
    ].join('\n');
}

function respondGame(req, res, payload) {
    if (isCliRequest(req)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(summarizeRun(payload.run));
    }
    return res.json(payload);
}

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: '江湖奇缘后端API',
        llm_available: llmService.isAvailable()
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '江湖奇缘 - 智能文字MUD游戏后端API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            events: '/api/events/generate',
            mud_run: '/api/mud/run'
        }
    });
});

// 事件生成API
app.post('/api/events/generate', async (req, res) => {
    try {
        const { character, location, context } = req.body;
        
        if (!character || !location) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['character', 'location']
            });
        }

        console.log(`🎭 生成事件请求: ${character.name} 在 ${location}`);

        const event = await llmService.generateWuxiaEvent(character, location, context);

        res.json({
            success: true,
            events: [event],
            generated_at: new Date().toISOString(),
            source: 'LLM'
        });

    } catch (error) {
        console.error('事件生成失败:', error);
        res.status(500).json({
            error: '事件生成失败',
            message: error.message
        });
    }
});

// MUD状态API
app.get('/api/mud/status', (req, res) => {
    res.json({
        success: true,
        service: 'MUD LLM Service',
        available: llmService.isAvailable(),
        features: [
            'LLM事件生成',
            '武侠风格内容',
            '动态剧情创造',
            'CLI文本模式（x-client-mode: cli）'
        ],
        version: '1.0.0'
    });
});

// CLI/Web统一MUD运行接口
app.post('/api/mud/run', (req, res) => {
    try {
        const { action = 'status', run, option, steps = 1, name } = req.body || {};
        let currentRun = run || null;
        let message = '';

        if (action === 'new' || !currentRun) {
            currentRun = createRun(name);
            message = '新局已创建。';
        } else if (action === 'status') {
            message = '状态读取成功。';
        } else if (action === 'choose') {
            message = applyChoice(currentRun, option);
        } else if (action === 'step') {
            message = stepRun(currentRun);
        } else if (action === 'auto') {
            const count = Math.max(1, Math.min(200, Number(steps) || 1));
            for (let i = 0; i < count; i += 1) {
                const result = stepRun(currentRun);
                message = `批量推进 ${count} 回合完成。`;
                if (currentRun.mode !== 'running' || currentRun.pendingChoice || result.includes('关键抉择')) {
                    break;
                }
            }
        } else {
            return res.status(400).json({
                error: '不支持的 action',
                supported: ['new', 'status', 'step', 'auto', 'choose']
            });
        }

        return respondGame(req, res, {
            success: true,
            action,
            message,
            run: currentRun
        });
    } catch (error) {
        console.error('MUD运行失败:', error);
        return res.status(500).json({
            error: 'MUD运行失败',
            message: error.message
        });
    }
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('API错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl
    });
});

// 导出为Vercel函数
module.exports = app;
