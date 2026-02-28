function parsePayload(raw = "") {
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return {
      title: String(parsed?.title || "都市生存结局"),
      subtitle: String(parsed?.subtitle || ""),
      score: Number(parsed?.score || 0),
      days: Number(parsed?.days || 0),
      role: String(parsed?.role || "都市求生者"),
      reason: String(parsed?.reason || ""),
      topDecision: String(parsed?.topDecision || ""),
      poem: String(parsed?.poem || ""),
    };
  } catch {
    return {
      title: "都市生存结局",
      subtitle: "",
      score: 0,
      days: 0,
      role: "都市求生者",
      reason: "",
      topDecision: "",
      poem: "",
    };
  }
}

function htmlEscape(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function handler(req, res) {
  const host = req.headers.host || "";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;

  const rawD = req.query?.d || "";
  const payload = parsePayload(rawD);
  const title = `我在《是男人就坚持100天》扛了 ${payload.days} 天`;
  const desc = [payload.title, `分数 ${payload.score}`, payload.reason || payload.subtitle].filter(Boolean).join("｜");
  const image = `${origin}/api/share-image?d=${encodeURIComponent(rawD)}`;
  const url = `${origin}/api/share?d=${encodeURIComponent(rawD)}`;
  const redirect = `${origin}/public/index.html`;

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(title)}</title>
    <meta name="description" content="${htmlEscape(desc)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${htmlEscape(title)}" />
    <meta property="og:description" content="${htmlEscape(desc)}" />
    <meta property="og:image" content="${htmlEscape(image)}" />
    <meta property="og:url" content="${htmlEscape(url)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${htmlEscape(title)}" />
    <meta name="twitter:description" content="${htmlEscape(desc)}" />
    <meta name="twitter:image" content="${htmlEscape(image)}" />
    <meta http-equiv="refresh" content="0;url=${htmlEscape(redirect)}" />
    <style>body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans SC',sans-serif;padding:16px;color:#1d2638;background:#f8f6ef}a{color:#ef6a3a}</style>
  </head>
  <body>
    <p>正在进入游戏：<a href="${htmlEscape(redirect)}">是男人就坚持100天</a></p>
  </body>
</html>`;

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.status(200).send(html);
}
