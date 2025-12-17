const { pool } = require("../db.config");

// weight 컬럼이 없으면 추가 (idempotent)
function migrateRecommendWeight() {
  return new Promise((resolve, reject) => {
    const checkSql = `
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'recommend'
        AND COLUMN_NAME = 'weight'
    `;

    pool.query(checkSql, (err, rows) => {
      if (err) return reject(err);

      const exists = rows?.[0]?.cnt > 0;
      if (exists) return resolve({ migrated: false, message: "weight already exists" });

      const alterSql = `ALTER TABLE recommend ADD COLUMN weight INT NOT NULL DEFAULT 1`;
      pool.query(alterSql, (err2) => {
        if (err2) return reject(err2);
        resolve({ migrated: true, message: "weight added" });
      });
    });
  });
}

// recommend 테이블이 비어있으면 더미 데이터 넣기 (idempotent)
function seedRecommendData() {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT COUNT(*) AS cnt FROM recommend`, (err, rows) => {
      if (err) return reject(err);

      const cnt = rows?.[0]?.cnt ?? 0;
      if (cnt > 0) return resolve({ seeded: false, message: "already has data", count: cnt });

      // title, img, weight
      const data = [
        ["제주도", null, 8],
        ["부산", null, 7],
        ["강릉", null, 6],
        ["여수", null, 4],
        ["경주", null, 4],
        ["전주", null, 3],
        ["속초", null, 3],
        ["서울", null, 2],
        ["춘천", null, 2],
      ];

      const sql = `INSERT INTO recommend (title, img, weight) VALUES ?`;
      pool.query(sql, [data], (err2, result) => {
        if (err2) return reject(err2);
        resolve({ seeded: true, inserted: result.affectedRows });
      });
    });
  });
}

module.exports = { migrateRecommendWeight, seedRecommendData };
