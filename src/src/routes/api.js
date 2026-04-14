const { Router } = require("express");
const links = require("../controllers/linkController");

const router = Router();

router.get("/stats", links.getGlobalStats);

router.post("/links", links.createLink);
router.get("/links", links.getAllLinks);
router.get("/links/:slug", links.getLink);
router.get("/links/:slug/stats", links.getLinkStats);
router.get("/links/:slug/qr", links.getLinkQR);
router.patch("/links/:slug", links.updateLink);
router.delete("/links/:slug", links.deleteLink);
router.post("/links/bulk-delete", links.bulkDelete);

module.exports = router;
