import { getMudService } from "../_service.js";
import { formatStateForCli, isCliRequest } from "../../core/mud-presenter.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const payload = req.body || {};
  const result = getMudService().runAction(payload);

  if (isCliRequest(req.headers || {})) {
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.status(result.ok ? 200 : 400).send(formatStateForCli(result));
    return;
  }

  res.status(result.ok ? 200 : 400).json(result);
}
