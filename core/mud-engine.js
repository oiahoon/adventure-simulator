import { createRun } from "./run/engine.js";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function summarizeRun(runState) {
  const battle = runState.battle?.state;
  const hand = battle?.player?.hand || [];
  return {
    mode: runState.mode,
    nodeIndex: runState.nodeIndex,
    nodeTotal: runState.nodes.length,
    nodeType: runState.nodes[runState.nodeIndex]?.type || null,
    playerHp: runState.playerHp,
    playerMaxHp: runState.playerMaxHp,
    deckSize: runState.deck.length,
    rewardOptions: [...runState.rewardOptions],
    story: {
      current: runState.story?.current || null,
      history: runState.story?.history?.slice(-5) || [],
    },
    battle: battle
      ? {
          turn: battle.turn,
          phase: battle.phase,
          winner: battle.winner,
          player: {
            hp: battle.player.hp,
            block: battle.player.block,
            energy: battle.player.energy,
            hand: hand.map((card) => ({
              id: card.id,
              name: card.name,
              cost: card.cost,
              text: card.text,
            })),
          },
          enemy: {
            id: battle.enemy.id,
            name: battle.enemy.name,
            hp: battle.enemy.hp,
            maxHp: battle.enemy.maxHp,
            block: battle.enemy.block,
          },
          logs: battle.logs.slice(-8),
        }
      : null,
  };
}

function createSessionStore() {
  const sessions = new Map();

  function createSession(seed = Date.now()) {
    const run = createRun({ seed });
    const sessionId = `${seed}-${Math.random().toString(36).slice(2, 8)}`;
    sessions.set(sessionId, {
      sessionId,
      run,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return sessions.get(sessionId);
  }

  function getSession(sessionId) {
    const entry = sessions.get(sessionId);
    if (!entry) {
      return null;
    }
    entry.updatedAt = Date.now();
    return entry;
  }

  return {
    createSession,
    getSession,
    count() {
      return sessions.size;
    },
  };
}

export function createMudService() {
  const store = createSessionStore();

  function response(sessionId, state) {
    return {
      ok: true,
      sessionId,
      state,
    };
  }

  function runAction(payload = {}) {
    const action = payload.action || "state";

    if (action === "new") {
      const seed = toNumber(payload.seed, Date.now());
      const session = store.createSession(seed);
      return response(session.sessionId, summarizeRun(session.run.state));
    }

    const sessionId = payload.sessionId;
    if (!sessionId) {
      return { ok: false, error: "sessionId_required" };
    }
    const session = store.getSession(sessionId);
    if (!session) {
      return { ok: false, error: "session_not_found" };
    }

    if (action === "state") {
      return response(sessionId, summarizeRun(session.run.state));
    }
    if (action === "play") {
      session.run.playCard(toNumber(payload.cardIndex, -1));
      return response(sessionId, summarizeRun(session.run.state));
    }
    if (action === "end") {
      session.run.endTurn();
      return response(sessionId, summarizeRun(session.run.state));
    }
    if (action === "reward") {
      session.run.chooseReward(payload.cardId ?? null);
      return response(sessionId, summarizeRun(session.run.state));
    }
    if (action === "remove") {
      const removed = session.run.removeCard(payload.cardId);
      return {
        ...response(sessionId, summarizeRun(session.run.state)),
        removed,
      };
    }
    if (action === "next") {
      session.run.nextNode();
      return response(sessionId, summarizeRun(session.run.state));
    }
    if (action === "story_branch") {
      const picked = session.run.chooseStoryBranch(payload.branchId);
      return {
        ...response(sessionId, summarizeRun(session.run.state)),
        picked,
      };
    }
    if (action === "restart") {
      const seed = toNumber(payload.seed, Date.now());
      session.run.restart(seed);
      return response(sessionId, summarizeRun(session.run.state));
    }

    return { ok: false, error: "unknown_action" };
  }

  return {
    runAction,
    debugSessionCount: () => store.count(),
  };
}
