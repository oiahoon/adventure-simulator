"use strict";

const express = require("express");
const cors = require("cors");
const { createMudService } = require("../core/mud-engine");
const { createCardEngineV2 } = require("../core/card-v2/engine");
const { summarizeRun, isCliLikeRequest } = require("../core/mud-presenter");

const app = express();
const mud = createMudService();
const mudV2 = createCardEngineV2();

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
      mud_status: "/api/mud/status"
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

app.use("*", (req, res) => {
  res.status(404).json({ error: "接口不存在", path: req.originalUrl });
});

module.exports = app;
