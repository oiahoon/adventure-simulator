import { getMudService } from "../_service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const sessionId = req.query?.sessionId;
  const result = getMudService().runAction({ action: "state", sessionId });
  res.status(result.ok ? 200 : 400).json(result);
}
