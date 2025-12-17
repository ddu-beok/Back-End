const { pool } = require("../db.config");

// 가중치 랜덤 3개: -LOG(RAND())/weight 방식 (weight 높을수록 뽑힐 확률 ↑)
function getTop3Weighted() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, title, img, weight, latitude, longitude, description
      FROM recommend
      ORDER BY (-LOG(RAND()) / GREATEST(weight, 1))
      LIMIT 3
    `;
    pool.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function getRecommendations() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id, title, img, weight, latitude, longitude, description FROM recommend`;
    pool.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

module.exports = { getRecommendations, getTop3Weighted };
