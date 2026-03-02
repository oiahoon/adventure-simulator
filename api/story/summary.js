function sanitizeStoryText(text = "") {
  return String(text)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*>\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pickPoeticFallback(payload = {}) {
  const days = Number(payload.daysSurvived) || 0;
  const stats = payload.stats || {};
  const lowEnergy = Number(stats.energy) <= 2;
  const lowMoney = Number(stats.money) <= 2;
  const highHeat = Number(stats.heat) >= 7;

  if (days >= 100) {
    return "正所谓：长风破浪会有时，直挂云帆济沧海。山重水复疑无路，柳暗花明又一村。";
  }
  if (lowEnergy || lowMoney) {
    return "正所谓：行到水穷处，坐看云起时。千磨万击还坚劲，任尔东西南北风。";
  }
  if (highHeat) {
    return "正所谓：不畏浮云遮望眼，自缘身在最高层。沉舟侧畔千帆过，病树前头万木春。";
  }
  return "正所谓：山重水复疑无路，柳暗花明又一村。长风破浪会有时，直挂云帆济沧海。";
}

function ensurePoeticEnding(story, payload) {
  if (!story) return story;
  if (/正所谓[:：]/.test(story)) return story;
  return `${story}\n${pickPoeticFallback(payload)}`;
}

function normalizePersonaPayload(persona = {}) {
  const traits = Array.isArray(persona.traits) ? persona.traits : [];
  return {
    title: String(persona.title || "观察中"),
    confidence: Number(persona.confidence) || 0,
    lowConfidence: Boolean(persona.lowConfidence),
    note: String(persona.note || ""),
    sample: persona.sample || {},
    traits: traits.map((item) => ({
      id: String(item.id || ""),
      name: String(item.name || ""),
      score: Number(item.score) || 0,
      label: String(item.label || ""),
      confidence: Number(item.confidence) || 0,
    })),
    evidence: Array.isArray(persona.evidence) ? persona.evidence.map((s) => String(s)) : [],
    tips: Array.isArray(persona.tips) ? persona.tips.map((s) => String(s)) : [],
  };
}

function buildPrompt(payload = {}) {
  const history = Array.isArray(payload.history) ? payload.history : [];
  const stats = payload.stats || {};
  const ending = payload.ending || {};
  const reasonBullets = Array.isArray(payload.reasonBullets) ? payload.reasonBullets : [];
  const review = payload.review || {};
  const persona = normalizePersonaPayload(payload.personality || {});
  const targetDay = Number(payload.targetDay) || 100;
  const daysSurvived = Number(payload.daysSurvived) || history.length || 1;

  const timeline = history
    .map(
      (item) =>
        `Day ${item.day}: 事件《${item.eventTitle || item.eventId}》，你选择「${item.optionLabel || item.optionId}」，结果：${item.impactText || "无"}`
    )
    .join("\n");

  const colloquialStats = `兜里余额${stats.money ?? "?"} 精力槽${stats.energy ?? "?"} 情绪值${stats.mood ?? "?"} 口碑面子${stats.reputation ?? "?"} 围观热度${stats.heat ?? "?"}`;
  const traitLines = persona.traits
    .map((item) => `${item.name}(${item.id}) 分值${item.score >= 0 ? "+" : ""}${item.score} 标签:${item.label} 置信:${item.confidence}%`)
    .join("；");

  return [
    "你是都市生存题材剧情文案编辑 + 行为画像解读员。",
    "请根据以下记录一次性输出 JSON，不要输出 JSON 以外内容，不要 markdown。",
    "JSON schema：",
    "{",
    '  "story": "140-260字第一人称故事，贴吧老哥口吻，必须解释结局原因且含至少1个转折。最后另起一行以正所谓：开头接两句诗词总结",',
    '  "persona": {',
    '    "title": "18字以内人格标题",',
    '    "summary": "80-140字画像总评，必须结合雷达分数和关键决策",',
    '    "lowConfidenceNote": "当 lowConfidence=true 时给1句样本不足提示，否则留空字符串",',
    '    "traitComments": [',
    '      {"id":"riskCalibration","line":"一句贴近生活的解释"},',
    '      {"id":"socialDrive","line":"一句贴近生活的解释"},',
    '      {"id":"stressRecovery","line":"一句贴近生活的解释"},',
    '      {"id":"horizonFocus","line":"一句贴近生活的解释"},',
    '      {"id":"executionDrive","line":"一句贴近生活的解释"}',
    "    ],",
    '    "tips": ["2条以内可执行建议"]',
    "  }",
    "}",
    "硬性规则：",
    "1) 不要出现 markdown 符号，不要星号。",
    "2) 禁止直接使用“现金/体力/心态/人设/热度”这组术语，改成生活化表达。",
    "3) 必须贴合给定雷达分数，不允许与分值方向冲突。",
    "4) 当 lowConfidence=true，persona.lowConfidenceNote 必须明确“样本不足仅供参考”。",
    "5) 当 lowConfidence=false，persona.lowConfidenceNote 必须为空字符串。",
    `结局：${ending.title || "未知结局"}；结局说明：${ending.subtitle || ""}`,
    `目标与进度：目标 ${targetDay} 天，实际 ${daysSurvived} 天`,
    `最终状态：${colloquialStats}`,
    `成因摘要：${reasonBullets.join("；") || "无"}`,
    `关键因果节点Top3：${(review.topNodes || []).join("；") || "无"}`,
    `关键决策Top3：${(review.topDecisions || []).join("；") || "无"}`,
    `因果链摘要：${review.chainSummary || "无"}`,
    `人格雷达标题：${persona.title}；总体置信：${persona.confidence}%；lowConfidence=${persona.lowConfidence}`,
    `人格雷达分数：${traitLines || "无"}`,
    `证据样本：有效样本${Number(persona.sample?.behaviorEntries) || 0}，证据命中${Number(persona.sample?.totalEvidence) || 0}`,
    "时间线：",
    timeline || "无记录",
  ].join("\n");
}

function parseJsonPayload(text = "") {
  const clean = String(text).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const candidate = clean.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function normalizeModelOutput(modelText, payload) {
  const parsed = parseJsonPayload(modelText);
  if (!parsed) {
    return {
      story: ensurePoeticEnding(sanitizeStoryText(modelText), payload),
      persona: null,
    };
  }

  const story = ensurePoeticEnding(sanitizeStoryText(parsed.story || ""), payload);
  const rawPersona = parsed.persona && typeof parsed.persona === "object" ? parsed.persona : {};
  const traitComments = Array.isArray(rawPersona.traitComments) ? rawPersona.traitComments : [];
  const tips = Array.isArray(rawPersona.tips) ? rawPersona.tips : [];

  return {
    story,
    persona: {
      title: sanitizeStoryText(rawPersona.title || ""),
      summary: sanitizeStoryText(rawPersona.summary || ""),
      lowConfidenceNote: sanitizeStoryText(rawPersona.lowConfidenceNote || ""),
      traitComments: traitComments
        .map((item) => ({
          id: String(item?.id || ""),
          line: sanitizeStoryText(item?.line || ""),
        }))
        .filter((item) => item.id && item.line),
      tips: tips.map((item) => sanitizeStoryText(item)).filter(Boolean).slice(0, 2),
    },
  };
}

function ensurePersonaFallback(payload, personaDraft) {
  const base = normalizePersonaPayload(payload.personality || {});
  if (!personaDraft) {
    return {
      title: base.title,
      summary: base.note || "本局样本较少，先看趋势，不做定型。",
      lowConfidenceNote: base.lowConfidence ? "样本不足，仅供参考。" : "",
      traitComments: [],
      tips: base.tips.slice(0, 2),
    };
  }
  return {
    title: personaDraft.title || base.title,
    summary: personaDraft.summary || base.note || "这局画像以行为趋势为主。",
    lowConfidenceNote: base.lowConfidence ? (personaDraft.lowConfidenceNote || "样本不足，仅供参考。") : "",
    traitComments: personaDraft.traitComments || [],
    tips: (personaDraft.tips && personaDraft.tips.length ? personaDraft.tips : base.tips || []).slice(0, 2),
  };
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
        temperature: 0.7,
        messages: [
          { role: "system", content: "你擅长中文叙事改写与行为画像解读，严格按 JSON schema 输出。" },
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
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      res.status(200).json({ ok: false, error: "deepseek_empty_response" });
      return;
    }

    const normalized = normalizeModelOutput(content, payload);
    const persona = ensurePersonaFallback(payload, normalized.persona);
    if (!normalized.story) {
      res.status(200).json({ ok: false, error: "deepseek_empty_story" });
      return;
    }
    res.status(200).json({ ok: true, story: normalized.story, persona });
  } catch (error) {
    res.status(200).json({ ok: false, error: "deepseek_exception", detail: String(error?.message || error) });
  }
}
