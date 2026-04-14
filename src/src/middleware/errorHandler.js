function notFound(req, res, next) {
  res.status(404).json({
    error: "not_found",
    message: `route ${req.method} ${req.path} doesn't exist. it never did.`,
  });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "something broke. we're looking into it (probably)."
      : err.message;

  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  res.status(status).json({
    error: err.code || "internal_error",
    message,
  });
}

module.exports = { notFound, errorHandler };
