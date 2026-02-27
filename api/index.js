import health from "./health.js";
import run from "./mud/run.js";
import storySummary from "./story/summary.js";
import status from "./mud/status.js";

export default async function handler(req, res) {
  const path = req.url?.split("?")[0] || "/";
  if (path === "/api/health") {
    return health(req, res);
  }
  if (path === "/api/mud/run") {
    return run(req, res);
  }
  if (path === "/api/mud/status") {
    return status(req, res);
  }
  if (path === "/api/story/summary") {
    return storySummary(req, res);
  }
  res.status(404).json({ ok: false, error: "not_found" });
}
