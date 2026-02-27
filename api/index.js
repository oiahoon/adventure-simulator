"use strict";

const express = require("express");
const cors = require("cors");
const { createMudService } = require("../core/mud-engine");
const { createCardEngineV2 } = require("../core/card-v2/engine");
const { summarizeRun, isCliLikeRequest } = require("../core/mud-presenter");

const app = express();
const mud = createMudService();
const mudV2 = createCardEngineV2();
const uxStats = {
  received: 0,
  byVariant: { single: 0, hand: 0, auto: 0, unknown: 0 },
  totalTurns: 0,
  totalPlays: 0,
  totalShares: 0,
  recent: []
};

app.use(cors());
app.use(express.json());

function respondRun(req, res, payload) {
  if (isCliLikeRequest(req)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(summarizeRun(payload.run));
  }
  return res.json(payload);
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "urban-survival-api"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "都市生存模拟器 API",
    version: "2.0.0",
    endpoints: {
      health: "/api/health",
      mud_run: "/api/mud/run",
      mud_status: "/api/mud/status",
      ux_track: "/api/ux/track",
      ux_summary: "/api/ux/summary"
    }
  });
});

app.get("/api/mud/status", (req, res) => {
  res.json({
    success: true,
    engine: "core/mud-engine + core/card-v2/engine",
    mode: ["web", "cli"],
    supportedActions: {
      v1: mud.constants.SUPPORTED_ACTIONS,
      v2: mudV2.constants.SUPPORTED_ACTIONS
    },
    v2ContentSource: mudV2.metadata ? mudV2.metadata.source : "unknown",
    v2Warnings: mudV2.metadata ? mudV2.metadata.warnings : []
  });
});

app.post("/api/mud/run", (req, res) => {
  try {
    const body = req.body || {};
    const version = String(body.engineVersion || body.engine || "v2").toLowerCase();
    const service = version === "v2" ? mudV2 : mud;
    const result = service.runAction(body);
    if (!result.ok) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
        supported: result.supported || []
      });
    }
    return respondRun(req, res, result.payload);
  } catch (error) {
    return res.status(500).json({
      error: "MUD运行失败",
      message: error.message
    });
  }
});

app.post("/api/ux/track", (req, res) => {
  try {
    const body = req.body || {};
    uxStats.received += 1;
    const v = String(body.variant || "unknown").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(uxStats.byVariant, v)) uxStats.byVariant[v] += 1;
    else uxStats.byVariant.unknown += 1;
    uxStats.totalTurns += Number(body.turns || 0);
    uxStats.totalPlays += Number(body.plays || 0);
    uxStats.totalShares += Number(body.shares || 0);
    uxStats.recent.unshift({
      at: new Date().toISOString(),
      variant: v,
      turns: Number(body.turns || 0),
      plays: Number(body.plays || 0),
      swipeRate: Number(body.swipeRate || 0),
      win: !!body.win
    });
    uxStats.recent = uxStats.recent.slice(0, 40);
    return res.json({ ok: true, received: uxStats.received });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("/api/ux/summary", (req, res) => {
  const avgTurn = uxStats.received > 0 ? uxStats.totalTurns / uxStats.received : 0;
  const avgPlay = uxStats.received > 0 ? uxStats.totalPlays / uxStats.received : 0;
  const shareRate = uxStats.received > 0 ? uxStats.totalShares / uxStats.received : 0;
  res.json({
    ok: true,
    received: uxStats.received,
    byVariant: uxStats.byVariant,
    averages: {
      turns: Math.round(avgTurn * 100) / 100,
      plays: Math.round(avgPlay * 100) / 100,
      shares: Math.round(shareRate * 1000) / 1000
    },
    recent: uxStats.recent
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "接口不存在", path: req.originalUrl });
});

module.exports = app;
