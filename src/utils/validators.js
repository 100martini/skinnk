const validUrl = require("valid-url");

const SLUG_MIN = 2;
const SLUG_MAX = 20;
const URL_MAX = 2048;
const RESERVED_SLUGS = ["api", "health", "docs", "admin", "static", "favicon.ico"];

function validateUrl(candidate) {
  if (!candidate || typeof candidate !== "string")
    return { ok: false, reason: "url is required. can't shorten nothing." };

  const trimmed = candidate.trim();

  if (trimmed.length > URL_MAX)
    return { ok: false, reason: `url exceeds ${URL_MAX} chars. that's a novel, not a link.` };

  if (/\s/.test(trimmed))
    return { ok: false, reason: "urls don't have spaces. who taught you this." };

  const dressed = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;

  if (!validUrl.isWebUri(dressed))
    return { ok: false, reason: "that's not a url. that's keyboard salad." };

  try {
    const parsed = new URL(dressed);

    if (!parsed.hostname.includes("."))
      return { ok: false, reason: "a url without a dot is just a word with issues." };

    const tld = parsed.hostname.split(".").pop();
    if (tld.length < 2)
      return { ok: false, reason: "that tld is suspiciously short." };

    if (parsed.hostname.split(".").some((p) => p.length === 0))
      return { ok: false, reason: "consecutive dots? that's not how domains work." };

    return { ok: true, cleaned: dressed };
  } catch {
    return { ok: false, reason: "url parsing failed. it fought back and won." };
  }
}

function validateSlug(slug) {
  if (!slug) return { ok: true, slug: null };

  if (typeof slug !== "string")
    return { ok: false, reason: "slug must be a string. obviously." };

  const clean = slug.trim().toLowerCase();

  if (clean.length < SLUG_MIN)
    return { ok: false, reason: `slug needs at least ${SLUG_MIN} characters. have standards.` };

  if (clean.length > SLUG_MAX)
    return { ok: false, reason: `keep it under ${SLUG_MAX} chars. we're shortening, remember?` };

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(clean))
    return { ok: false, reason: "slugs: lowercase letters, numbers, dashes. no drama." };

  if (/--/.test(clean))
    return { ok: false, reason: "double dashes? what is this, morse code?" };

  if (RESERVED_SLUGS.includes(clean))
    return { ok: false, reason: `"${clean}" is reserved. pick something less important.` };

  return { ok: true, slug: clean };
}

function validateExpiry(days) {
  const parsed = parseInt(days);
  if (isNaN(parsed) || parsed < 1) return { ok: true, days: 7 };
  if (parsed > 90) return { ok: true, days: 90 };
  return { ok: true, days: parsed };
}

module.exports = { validateUrl, validateSlug, validateExpiry };
