function escapeXml(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parsePayload(raw = "") {
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return {
      title: String(parsed?.title || "都市生存结局"),
      subtitle: String(parsed?.subtitle || ""),
      score: Number(parsed?.score || 0),
      days: Number(parsed?.days || 0),
      avatarUrl: String(parsed?.avatarUrl || ""),
      role: String(parsed?.role || "都市求生者"),
    };
  } catch {
    return {
      title: "都市生存结局",
      subtitle: "",
      score: 0,
      days: 0,
      avatarUrl: "",
      role: "都市求生者",
    };
  }
}

export default function handler(req, res) {
  const payload = parsePayload(req.query?.d || "");
  const title = escapeXml(payload.title).slice(0, 24);
  const subtitle = escapeXml(payload.subtitle).slice(0, 40);
  const role = escapeXml(payload.role).slice(0, 20);
  const avatar = escapeXml(payload.avatarUrl);

  const avatarNode = avatar
    ? `<image href="${avatar}" x="80" y="175" width="190" height="190" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<rect x="80" y="175" width="190" height="190" rx="24" fill="#e8deca" />`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7efe2" />
      <stop offset="100%" stop-color="#f2e4cb" />
    </linearGradient>
    <clipPath id="avatarClip">
      <rect x="80" y="175" width="190" height="190" rx="24" />
    </clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="52" y="52" width="1096" height="526" rx="32" fill="#fffaf0" stroke="#d8c8aa" stroke-width="4" />
  <text x="330" y="180" fill="#1d2638" font-size="62" font-weight="800">是男人就坚持100天</text>
  <text x="330" y="238" fill="#5f6573" font-size="36">${role}</text>
  <text x="330" y="340" fill="#1d2638" font-size="54" font-weight="700">${title}</text>
  <text x="330" y="398" fill="#7a5d34" font-size="32">${subtitle}</text>
  <text x="330" y="480" fill="#ef6a3a" font-size="42" font-weight="700">生存 ${payload.days} 天 · 分数 ${payload.score}</text>
  <text x="330" y="542" fill="#5f6573" font-size="28">点击链接立即开玩</text>
  <rect x="80" y="175" width="190" height="190" rx="24" fill="#f7f1e4" stroke="#d8cfba" stroke-width="3" />
  ${avatarNode}
</svg>`;

  res.setHeader("content-type", "image/svg+xml; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=60");
  res.status(200).send(svg);
}
