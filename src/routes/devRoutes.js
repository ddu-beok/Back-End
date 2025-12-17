const express = require("express");
const devController = require("../controllers/devController");

const router = express.Router();

router.post("/recommend/migrate", devController.migrateRecommend);
router.post("/recommend/seed", devController.seedRecommend);

module.exports = router;
