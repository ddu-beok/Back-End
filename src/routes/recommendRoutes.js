const express = require("express");
const recommendController = require("../controllers/recommendController");

const router = express.Router();

router.get("/", recommendController.getRecommend);
router.get("/top3", recommendController.getTop3); 

module.exports = router;
