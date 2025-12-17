const devService = require("../services/devService");

async function migrateRecommend(req, res) {
  try {
    const result = await devService.migrateRecommendWeight();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "migrate 실패" });
  }
}

async function seedRecommend(req, res) {
  try {
    const result = await devService.seedRecommendData();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "seed 실패" });
  }
}

module.exports = { migrateRecommend, seedRecommend };
