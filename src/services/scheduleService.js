// src/services/scheduleService.js
// ✅ Service는 DB 쿼리 + 응답 형태 가공을 담당합니다. (content blocks 포맷도 여기서 흡수)
const { pool } = require("../db.config");

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * ✅ DB content 호환 처리
 * - 최신: content = [ ...blocks ] (배열)
 * - 구버전: content = { "blocks": [ ...blocks ] } (객체)
 * - 그 외/깨짐: []
 */
function normalizeBlocks(blocksJsonStr) {
  if (!blocksJsonStr) return [];
  const parsed = safeJsonParse(blocksJsonStr, null);

  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.blocks)) return parsed.blocks;

  return [];
}

/** ✅ ddu_beok 존재 체크 */
function ensureDduBeokExists(dduBeokId) {
  return new Promise((resolve, reject) => {
    pool.query("SELECT 1 FROM ddu_beok WHERE id = ? LIMIT 1", [dduBeokId], (err, rows) => {
      if (err) return reject(err);
      if (!rows || rows.length === 0) return reject(new Error("NOT_FOUND_DDU_BEOK"));
      resolve();
    });
  });
}

/** ✅ 일정 전체 조회: { dduBeokId, items } */
function getSchedulesByDduBeokId(dduBeokId) {
  return new Promise((resolve, reject) => {
    ensureDduBeokExists(dduBeokId)
      .then(() => {
        const itemsSql = `
          SELECT s.id,
                 s.title,
                 DATE_FORMAT(
                   DATE_ADD(DATE(d.start_date), INTERVAL s.day_num - 1 DAY),
                   '%Y-%m-%d'
                 ) AS date,
                 TIME_FORMAT(s.start_time, '%H:%i') AS startTime,
                 TIME_FORMAT(s.end_time, '%H:%i') AS endTime,
                 s.loc_detail AS address,
                 s.latitude AS lat,
                 s.longitude AS lng,
                 s.content AS blocksJson
          FROM schedule s
          JOIN ddu_beok d ON d.id = s.ddu_beok_id
          WHERE s.ddu_beok_id = ?
          ORDER BY s.day_num ASC, s.start_time ASC, s.id ASC
        `;

        pool.query(itemsSql, [dduBeokId], (err2, itemRows) => {
          if (err2) return reject(err2);

          const items = (itemRows || []).map((r) => ({
            id: String(r.id),
            date: r.date,
            startTime: r.startTime || null,
            endTime: r.endTime || null,
            title: r.title || "",
            address: r.address || "",
            lat: r.lat,
            lng: r.lng,
            blocks: normalizeBlocks(r.blocksJson),
          }));

          resolve({ dduBeokId: String(dduBeokId), items });
        });
      })
      .catch(reject);
  });
}

/** ✅ 일정 추가 후 { dduBeokId, items } 반환 */
function createScheduleAndReturnSchedules({
  dduBeokId,
  userId,
  date,
  startTime,
  endTime,
  title,
  address,
  lat,
  lng,
  blocks,
}) {
  return new Promise((resolve, reject) => {
    // day_num 계산 + 기간 체크 (문자열로 비교 가능하도록 DATE_FORMAT 사용)
    const dayNumSql = `
      SELECT
        DATEDIFF(?, DATE(start_date)) + 1 AS day_num,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS s,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS e
      FROM ddu_beok
      WHERE id = ?
    `;

    pool.query(dayNumSql, [date, dduBeokId], (err, rows) => {
      if (err) return reject(err);
      if (!rows || rows.length === 0 || rows[0].day_num == null) {
        return reject(new Error("NOT_FOUND_DDU_BEOK"));
      }

      const dayNum = Number(rows[0].day_num);
      const start = rows[0].s;
      const end = rows[0].e;

      if (start && end) {
        if (date < start || date > end) {
          return reject(new Error("DATE_OUT_OF_RANGE"));
        }
      }

      const blocksArray = Array.isArray(blocks) ? blocks : [];
      const blocksJson = JSON.stringify(blocksArray);

      const insertSql = `
        INSERT INTO schedule
          (ddu_beok_id, user_id, title, content,
           start_time, end_time, loc_detail, latitude, longitude, day_num)
        VALUES
          (?, ?, ?, ?,
           ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        dduBeokId,
        userId,
        title,
        blocksJson,
        startTime,
        endTime,
        address,
        lat,
        lng,
        dayNum,
      ];

      pool.query(insertSql, params, (err2) => {
        if (err2) return reject(err2);
        getSchedulesByDduBeokId(dduBeokId).then(resolve).catch(reject);
      });
    });
  });
}

/** ✅ 일정 삭제 후 { dduBeokId, items } 반환 */
function deleteScheduleAndReturnSchedules({ dduBeokId, scheduleId, userId }) {
  return new Promise((resolve, reject) => {
    // ddu_beok 존재 체크(에러 메시지 분리)
    ensureDduBeokExists(dduBeokId)
      .then(() => {
        const delSql = `
          DELETE FROM schedule
          WHERE id = ?
            AND ddu_beok_id = ?
            AND user_id = ?
        `;

        pool.query(delSql, [scheduleId, dduBeokId, userId], (err, result) => {
          if (err) return reject(err);

          if (!result || result.affectedRows === 0) {
            return reject(new Error("NOT_FOUND_SCHEDULE"));
          }

          getSchedulesByDduBeokId(dduBeokId).then(resolve).catch(reject);
        });
      })
      .catch(reject);
  });
}

module.exports = {
  getSchedulesByDduBeokId,
  createScheduleAndReturnSchedules,
  deleteScheduleAndReturnSchedules,
};
