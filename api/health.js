export default async function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: "neon-deck-api",
    ts: new Date().toISOString(),
  });
}
