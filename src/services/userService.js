const { pool } = require('../db.config');

function getUserDduBeokById(userId) {
  return new Promise((resolve, reject) => {

    const sql = `
      SELECT *
      FROM ddu_beok
      WHERE user_id = ?
         OR JSON_CONTAINS(participant, CAST(? AS JSON), '$')
    `;

    pool.query(sql, [userId, userId], async (err, results) => {
      if (err) return reject(err);

      const processed = [];

      for (const row of results) {
        let participantArr = [];

        const participantIds = Array.isArray(row.participant)
          ? row.participant
          : row.participant
            ? JSON.parse(row.participant)
            : [];

        if (participantIds.length > 0) {
          const sqlUsers = `
            SELECT id AS user_id, profile_img
            FROM user
            WHERE id IN (?)
          `;

          participantArr = await new Promise((res, rej) => {
            pool.query(sqlUsers, [participantIds], (err2, userRows) => {
              if (err2) return rej(err2);
              res(userRows);
            });
          });
        }

        processed.push({
          id: row.id,
          title: row.title,
          location: row.location,
          start_date: row.start_date,
          end_date: row.end_date,
          img: row.img,
          isFavorite: row.is_favorite,
          participant: participantArr
        });
      }

      resolve(processed);
    });
  });
}

function getMeById(userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id, nickname, profile_img FROM user WHERE id = ? LIMIT 1`;
    pool.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}
function getUserFootprintsById(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, title, location, latitude, longitude
      FROM ddu_beok
      WHERE user_id = ?
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;
    pool.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

module.exports = { getUserDduBeokById, getMeById, getUserFootprintsById };
