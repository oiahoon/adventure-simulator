function buildPrompt(payload = {}) {
  const history = Array.isArray(payload.history) ? payload.history : [];
  const stats = payload.stats || {};
  const ending = payload.ending || {};
  const reasonBullets = Array.isArray(payload.reasonBullets) ? payload.reasonBullets : [];
  const review = payload.review || {};
  const targetDay = Number(payload.targetDay) || 100;
  const daysSurvived = Number(payload.daysSurvived) || history.length || 1;

  const timeline = history
    .map(
      (item) =>
        `Day ${item.day}: 事件《${item.eventTitle || item.eventId}》，你选择「${item.optionLabel || item.optionId}」，结果：${item.impactText || "无"}`
    )
    .join("\n");

  const colloquialStats = `兜里余额${stats.money ?? "?"} 精力槽${stats.energy ?? "?"} 情绪值${stats.mood ?? "?"} 口碑面子${stats.reputation ?? "?"} 围观热度${stats.heat ?? "?"}`;

  return [
    "你是都市生存题材剧情文案编辑。",
    `请把以下这局“目标坚持${targetDay}天、实际坚持${daysSurvived}天”的决策记录改写成一段120-220字的中文小故事，第一人称，语气参考贴吧老哥：有点调侃、有点刺激、但不低俗。`,
    "要求：",
    "1) 必须解释为什么会走到这个结局；",
    "2) 必须出现至少1个转折点；",
    "3) 结尾给一句可分享的“复盘句”；",
    "4) 要有轻微阴阳怪气和自嘲感，但不能攻击具体人群；",
    "5) 不要使用 Markdown，不要分点。",
    "6) 禁止直接使用“现金/体力/心态/人设/热度”这组游戏术语，改用生活化表达：现金=兜里余额，体力=精力槽，心态=情绪值，人设=口碑面子，热度=围观热度。",
    `结局：${ending.title || "未知结局"}；结局说明：${ending.subtitle || ""}`,
    `最终状态：${colloquialStats}`,
    `成因摘要：${reasonBullets.join("；") || "无"}`,
    `关键因果节点Top3：${(review.topNodes || []).join("；") || "无"}`,
    `关键决策Top3：${(review.topDecisions || []).join("；") || "无"}`,
    `因果链摘要：${review.chainSummary || "无"}`,
    "时间线：",
    timeline || "无记录",
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(200).json({ ok: false, error: "deepseek_api_key_missing" });
    return;
  }

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const payload = req.body || {};
  const prompt = buildPrompt(payload);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages: [
          { role: "system", content: "你擅长中文叙事改写与剧情压缩。" },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(200).json({ ok: false, error: "deepseek_request_failed", detail: text.slice(0, 300) });
      return;
    }

    const data = await response.json();
    const story = data?.choices?.[0]?.message?.content?.trim();
    if (!story) {
      res.status(200).json({ ok: false, error: "deepseek_empty_response" });
      return;
    }

    res.status(200).json({ ok: true, story });
  } catch (error) {
    res.status(200).json({ ok: false, error: "deepseek_exception", detail: String(error?.message || error) });
  }
}
