function apiKeyGuard(req, res, next) {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) return next();

  const provided = req.get("x-api-key");
  if (!provided)
    return res.status(401).json({ error: "unauthorized", message: "missing x-api-key header. who are you?" });

  if (provided !== requiredKey)
    return res.status(403).json({ error: "forbidden", message: "wrong api key. nice try though." });

  next();
}

module.exports = { apiKeyGuard };
