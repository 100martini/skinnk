const recentClicks = new Map();

const DEDUP_WINDOW_MS = 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function getVisitorIp(req) {
  return req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
}

function isDuplicateClick(slug, ip) {
  const key = `${slug}:${ip}`;
  const lastClick = recentClicks.get(key);
  const now = Date.now();

  if (lastClick && now - lastClick < DEDUP_WINDOW_MS) return true;

  recentClicks.set(key, now);
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentClicks) {
    if (now - timestamp > DEDUP_WINDOW_MS) recentClicks.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

module.exports = { isDuplicateClick, getVisitorIp };
