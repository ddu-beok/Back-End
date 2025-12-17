const recommendService = require("../services/recommendService");

async function getRecommend(req, res) {
  try {
    const results = await recommendService.getRecommendations();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB 조회 중 오류 발생" });
  }
}

async function getTop3(req, res) {
  try {
    const results = await recommendService.getTop3Weighted();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB 조회 중 오류 발생" });
  }
}

module.exports = { getRecommend, getTop3 };
