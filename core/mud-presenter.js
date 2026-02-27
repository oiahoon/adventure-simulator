"use strict";

function summarizeRun(run) {
  if (!run) return "空运行状态";
  const isV2 = run.engineVersion === "v2" || run.schemaVersion === 2;
  const status = run.mode === "ended" ? "END" : "RUN";
  const choice = run.pendingChoice
    ? `${run.pendingChoice.title}: ${run.pendingChoice.options.map((o) => `${o.id}/${o.label}`).join(", ")}`
    : "无";
  const recent = (run.log || []).slice(-5).map((l) => `- ${l}`).join("\n");
  const handList = Array.isArray(run.handMeta) && run.handMeta.length
    ? run.handMeta
    : Array.isArray(run.hand)
    ? run.hand.map((id) => ({ id, title: id, tag: "card" }))
    : [];
  const hand = handList.length
    ? handList.map((c) => `${c.id}/${c.title}[${c.tag}]`).join(" | ")
    : "无";

  return [
    `=== CARD MUD ${isV2 ? "V2 " : ""}(${status}) ===`,
    `玩家: ${run.player.name} (${run.player.profession})`,
    `阶段: ${isV2 ? run.storyStage : run.story.lifeStage}  Day ${run.day} / Turn ${run.turn}  位置: ${run.location}`,
    `Lv.${run.player.level} EXP ${run.player.exp}/${run.player.nextExp}`,
    `HP ${run.player.hp}/${run.player.maxHp}  MP ${run.player.mp}/${run.player.maxMp}`,
    `金币 ${run.player.gold}  精神 ${run.city.morale}  疲劳 ${run.city.fatigue}  债务 ${run.city.debt}  热度 ${run.city.heat}`,
    `组织: ${run.player.sect || "未选"}  天赋: ${run.player.perk || "未选"}`,
    `出牌 ${run.metrics.cardPlays} 弃置 ${run.metrics.discards || 0} 延后 ${run.metrics.defers || 0} 关键事件 ${run.metrics.keyEvents} 战斗杂项 ${run.metrics.battles + run.metrics.events}`,
    `待选择: ${choice}`,
    `当前手牌: ${hand}`,
    "",
    "最近日志:",
    recent || "- 无",
    "",
    "可用动作:",
    "- new                 新开一局",
    "- status              查看状态",
    "- draw                发牌（无手牌时）",
    "- play                出牌（传 cardId）",
    "- discard             弃置手牌（传 cardId）",
    "- defer               延后手牌（传 cardId）",
    "- prefer              设置机会偏好（balanced/survival/growth/debt）",
    "- choose              处理关键抉择（传 option）"
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
