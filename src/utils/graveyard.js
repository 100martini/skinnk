const prisma = require("../config/database");

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const GRACE_PERIOD_DAYS = 7;

async function buryTheDeadLinks() {
  try {
    const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 86400000);

    const victims = await prisma.link.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    if (victims.count > 0) {
      console.log(`[graveyard] buried ${victims.count} expired link${victims.count === 1 ? "" : "s"}. rest in pieces.`);
    }
  } catch (err) {
    console.error("[graveyard] cleanup failed:", err.message);
  }
}

function startGraveyard() {
  buryTheDeadLinks();
  setInterval(buryTheDeadLinks, CLEANUP_INTERVAL_MS);
  console.log(`[graveyard] running every ${CLEANUP_INTERVAL_MS / 60000}min. expired links get ${GRACE_PERIOD_DAYS}d grace period.`);
}

module.exports = { startGraveyard };
