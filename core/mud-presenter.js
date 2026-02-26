"use strict";

function summarizeRun(run) {
  const status = run.mode === "ended" ? "END" : "RUN";
  const choice = run.pendingChoice
    ? `${run.pendingChoice.title}: ${run.pendingChoice.options.map((o) => `${o.id}/${o.label}`).join(", ")}`
    : "无";
  const recent = (run.log || []).slice(-4).map((l) => `- ${l}`).join("\n");

  return [
    `=== CLI MUD (${status}) ===`,
    `玩家: ${run.player.name} (${run.player.profession})`,
    `等级: Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`,
    `生命/体力: ${run.player.hp}/${run.player.maxHp}  MP ${run.player.mp}/${run.player.maxMp}`,
    `战力: ATK ${run.player.atk} DEF ${run.player.def}`,
    `金币: ${run.player.gold}  位置: ${run.location}  天数: ${run.day}  回合: ${run.turn}`,
    `组织: ${run.player.sect || "未选"}  天赋: ${run.player.perk || "未选"}`,
    `战斗: ${run.metrics.battles} 胜利: ${run.metrics.wins} 事件: ${run.metrics.events} 兼职: ${run.metrics.sideJobs}`,
    `待选择: ${choice}`,
    "",
    "最近日志:",
    recent || "- 无",
    "",
    "可用动作:",
    "- new            新开一局",
    "- status         查看状态",
    "- step           推进 1 回合",
    "- auto           批量推进，传 steps",
    "- choose         处理抉择，传 option"
  ].join("\n");
}

function isCliLikeRequest(req) {
  const mode = String(req.headers["x-client-mode"] || "").toLowerCase();
  const accept = String(req.headers.accept || "").toLowerCase();
  const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
  return (
    mode === "cli" ||
    accept.includes("text/plain") ||
    userAgent.includes("curl") ||
    userAgent.includes("wget") ||
    userAgent.includes("httpie")
  );
}

module.exports = {
  summarizeRun,
  isCliLikeRequest
};
