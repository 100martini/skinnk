require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const apiRoutes = require("./routes/api");
const { handleRedirect } = require("./controllers/redirectController");
const { apiKeyGuard } = require("./middleware/apiKeyGuard");
const { startGraveyard } = require("./utils/graveyard");

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "10kb" }));

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "slow down. the links aren't going anywhere." },
});

const creationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "10 links per minute. you're not a machine. or are you?" },
});

app.use("/api", globalLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "alive", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use("/api", apiKeyGuard);

app.post("/api/links", creationLimiter);

app.use("/api", apiRoutes);

app.get("/:slug([a-z0-9-]{2,20})", handleRedirect);

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));

app.use((req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: "not_found", message: "nothing here." });
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`skinnk running on port ${PORT}`);
  console.log(`redirects:  http://localhost:${PORT}/:slug`);
  console.log(`api:        http://localhost:${PORT}/api/links`);
  console.log(`health:     http://localhost:${PORT}/health`);
  if (process.env.API_KEY) console.log("api key:    enabled");
  startGraveyard();
});
