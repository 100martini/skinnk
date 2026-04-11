const prisma = require("../config/database");
const { validateUrl, validateSlug, validateExpiry } = require("../utils/validators");
const { generateUniqueSlug } = require("../utils/slugGenerator");
const QRCode = require("qrcode");

async function createLink(req, res, next) {
  try {
    const { url, slug: customSlug, expiresInDays } = req.body;

    const urlCheck = validateUrl(url);
    if (!urlCheck.ok) return res.status(400).json({ error: "invalid_url", message: urlCheck.reason });

    const slugCheck = validateSlug(customSlug);
    if (!slugCheck.ok) return res.status(400).json({ error: "invalid_slug", message: slugCheck.reason });

    if (slugCheck.slug) {
      const taken = await prisma.link.findUnique({ where: { slug: slugCheck.slug } });
      if (taken) return res.status(409).json({ error: "slug_taken", message: "that slug is taken. be more creative." });
    }

    const slug = slugCheck.slug || (await generateUniqueSlug(prisma));
    const { days } = validateExpiry(expiresInDays);

    const link = await prisma.link.create({
      data: {
        slug,
        original: urlCheck.cleaned,
        expiresAt: new Date(Date.now() + days * 86400000),
      },
    });

    res.status(201).json({
      id: link.id,
      slug: link.slug,
      shortUrl: `${process.env.BASE_URL}/${link.slug}`,
      original: link.original,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

async function getAllLinks(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || "";
    const status = req.query.status;
    const sortBy = req.query.sort || "createdAt";
    const order = req.query.order === "asc" ? "asc" : "desc";

    const where = {};

    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { original: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") where.expiresAt = { gt: new Date() };
    if (status === "expired") where.expiresAt = { lte: new Date() };

    const allowedSorts = ["createdAt", "expiresAt", "slug"];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "createdAt";

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { clicks: true } } },
      }),
      prisma.link.count({ where }),
    ]);

    res.json({
      data: links.map((l) => ({
        id: l.id,
        slug: l.slug,
        shortUrl: `${process.env.BASE_URL}/${l.slug}`,
        original: l.original,
        clicks: l._count.clicks,
        createdAt: l.createdAt,
        expiresAt: l.expiresAt,
        active: l.expiresAt > new Date(),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getLink(req, res, next) {
  try {
    const link = await prisma.link.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { clicks: true } } },
    });

    if (!link)
      return res.status(404).json({ error: "not_found", message: "that link doesn't exist. never did." });

    res.json({
      id: link.id, slug: link.slug, shortUrl: `${process.env.BASE_URL}/${link.slug}`,
      original: link.original, clicks: link._count.clicks, createdAt: link.createdAt,
      expiresAt: link.expiresAt, active: link.expiresAt > new Date(),
    });
  } catch (err) {
    next(err);
  }
}

async function getLinkStats(req, res, next) {
  try {
    const link = await prisma.link.findUnique({ where: { slug: req.params.slug } });
    if (!link)
      return res.status(404).json({ error: "not_found", message: "can't show stats for a ghost." });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const [totalClicks, recentClicks, dailyBreakdown, topReferrers] = await Promise.all([
      prisma.click.count({ where: { linkId: link.id } }),
      prisma.click.count({ where: { linkId: link.id, timestamp: { gte: sevenDaysAgo } } }),
      prisma.$queryRaw`
        SELECT DATE(timestamp) as day, COUNT(*)::int as clicks
        FROM clicks WHERE link_id = ${link.id} AND timestamp >= ${sevenDaysAgo}
        GROUP BY DATE(timestamp) ORDER BY day ASC`,
      prisma.$queryRaw`
        SELECT COALESCE(referrer, 'direct') as source, COUNT(*)::int as count
        FROM clicks WHERE link_id = ${link.id}
        GROUP BY referrer ORDER BY count DESC LIMIT 5`,
    ]);

    res.json({ slug: link.slug, original: link.original, totalClicks, last7Days: recentClicks, dailyBreakdown, topReferrers, createdAt: link.createdAt, expiresAt: link.expiresAt });
  } catch (err) {
    next(err);
  }
}

async function getLinkQR(req, res, next) {
  try {
    const link = await prisma.link.findUnique({ where: { slug: req.params.slug } });
    if (!link)
      return res.status(404).json({ error: "not_found", message: "no link, no qr. that's the deal." });

    const shortUrl = `${process.env.BASE_URL}/${link.slug}`;
    const format = req.query.format || "png";

    if (format === "svg") {
      const svg = await QRCode.toString(shortUrl, { type: "svg", margin: 2 });
      res.setHeader("Content-Type", "image/svg+xml");
      return res.send(svg);
    }

    const png = await QRCode.toBuffer(shortUrl, {
      width: parseInt(req.query.size) || 300,
      margin: 2,
      color: { dark: "#1c1917", light: "#faf9f7" },
    });
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    next(err);
  }
}

async function updateLink(req, res, next) {
  try {
    const link = await prisma.link.findUnique({ where: { slug: req.params.slug } });
    if (!link)
      return res.status(404).json({ error: "not_found", message: "can't update what doesn't exist." });

    const updates = {};
    if (req.body.url) {
      const urlCheck = validateUrl(req.body.url);
      if (!urlCheck.ok) return res.status(400).json({ error: "invalid_url", message: urlCheck.reason });
      updates.original = urlCheck.cleaned;
    }
    if (req.body.expiresInDays) {
      const { days } = validateExpiry(req.body.expiresInDays);
      updates.expiresAt = new Date(Date.now() + days * 86400000);
    }

    const updated = await prisma.link.update({
      where: { slug: req.params.slug },
      data: updates,
      include: { _count: { select: { clicks: true } } },
    });

    res.json({
      id: updated.id, slug: updated.slug, shortUrl: `${process.env.BASE_URL}/${updated.slug}`,
      original: updated.original, clicks: updated._count.clicks, createdAt: updated.createdAt, expiresAt: updated.expiresAt,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteLink(req, res, next) {
  try {
    const link = await prisma.link.findUnique({ where: { slug: req.params.slug } });
    if (!link)
      return res.status(404).json({ error: "not_found", message: "already gone. you're too late." });
    await prisma.link.delete({ where: { slug: req.params.slug } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function bulkDelete(req, res, next) {
  try {
    const { slugs } = req.body;
    if (!Array.isArray(slugs) || slugs.length === 0)
      return res.status(400).json({ error: "invalid_body", message: "send an array of slugs. not whatever that was." });
    if (slugs.length > 50)
      return res.status(400).json({ error: "too_many", message: "max 50 at a time. we have limits." });

    const result = await prisma.link.deleteMany({ where: { slug: { in: slugs } } });
    res.json({ deleted: result.count, message: `${result.count} links sent to the void.` });
  } catch (err) {
    next(err);
  }
}

async function getGlobalStats(req, res, next) {
  try {
    const now = new Date();
    const [totalLinks, activeLinks, totalClicks] = await Promise.all([
      prisma.link.count(),
      prisma.link.count({ where: { expiresAt: { gt: now } } }),
      prisma.click.count(),
    ]);
    res.json({ totalLinks, activeLinks, expiredLinks: totalLinks - activeLinks, totalClicks, avgClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0 });
  } catch (err) {
    next(err);
  }
}

module.exports = { createLink, getAllLinks, getLink, getLinkStats, getLinkQR, updateLink, deleteLink, bulkDelete, getGlobalStats };
