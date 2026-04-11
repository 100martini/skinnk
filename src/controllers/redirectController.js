const prisma = require("../config/database");
const { isDuplicateClick, getVisitorIp } = require("../utils/clickDedup");
const { deadLinkPage, expiredLinkPage } = require("../utils/errorPages");

async function handleRedirect(req, res, next) {
  try {
    const { slug } = req.params;
    const link = await prisma.link.findUnique({ where: { slug } });

    if (!link) {
      res.status(404).type("html").send(deadLinkPage(slug));
      return;
    }

    if (link.expiresAt <= new Date()) {
      res.status(410).type("html").send(expiredLinkPage(slug));
      return;
    }

    const ip = getVisitorIp(req);

    if (!isDuplicateClick(slug, ip)) {
      prisma.click.create({
        data: {
          linkId: link.id,
          referrer: req.get("referer") || null,
          userAgent: req.get("user-agent") || null,
          ip: ip,
        },
      }).catch(() => {});
    }

    res.redirect(301, link.original);
  } catch (err) {
    next(err);
  }
}

module.exports = { handleRedirect };
