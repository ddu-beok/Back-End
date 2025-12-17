// src/services/scheduleService.js
// ✅ 권한 체크(소유자/participant) 포함 버전
const { pool } = require("../db.config");

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function normalizeBlocks(blocksJsonStr) {
  if (!blocksJsonStr) return [];
  const parsed = safeJsonParse(blocksJsonStr, null);

  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.blocks)) return parsed.blocks;

  return [];
}

/**
 * ✅ participant 파싱 강화
 * - DB가 JSON 타입이면 값이 `"2,3,6"` 처럼 따옴표 포함 문자열로 내려올 수 있음
 * - 또는 `["2","3","6"]` 같은 JSON 배열 형태일 수도 있음
 * - 최종적으로 [2,3,6] 숫자 배열로 정규화
 */
function parseParticipantIds(participantStr) {
  if (participantStr == null) return [];

  let raw = participantStr;

  if (typeof raw === "string") {
    const t = raw.trim();

    // JSON 문자열("2,3,6") 또는 JSON 배열(["2","3","6"]) 형태 방어
    if ((t.startsWith('"') && t.endsWith('"')) || t.startsWith("[")) {
      const parsed = safeJsonParse(t, null);

      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => Number(String(v).trim()))
          .filter((n) => Number.isFinite(n) && n > 0);
      }

      if (typeof parsed === "string") raw = parsed; // "2,3,6" -> 2,3,6
    }
  }

  return String(raw)
    .replace(/\s+/g, "")   // 공백 제거
    .replace(/^"|"$/g, "") // 양끝 따옴표 제거(혹시 남아있으면)
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * ✅ ddu_beok 접근 가능 여부 체크
 * - 존재 X -> NOT_FOUND_DDU_BEOK
 * - 권한 X -> FORBIDDEN_DDU_BEOK
 * - return: { isOwner, start, end }
 */
function ensureDduBeokAccessible(dduBeokId, userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, user_id, participant,
             DATE_FORMAT(start_date, '%Y-%m-%d') AS s,
             DATE_FORMAT(end_date, '%Y-%m-%d') AS e
      FROM ddu_beok
      WHERE id = ?
      LIMIT 1
    `;

    pool.query(sql, [dduBeokId], (err, rows) => {
      if (err) return reject(err);
      if (!rows || rows.length === 0) return reject(new Error("NOT_FOUND_DDU_BEOK"));

      const row = rows[0];
      const ownerId = Number(row.user_id);
      const isOwner = ownerId === Number(userId);

      const participants = parseParticipantIds(row.participant);
      const isParticipant = participants.includes(Number(userId));

      if (!isOwner && !isParticipant) return reject(new Error("FORBIDDEN_DDU_BEOK"));

      resolve({ isOwner, start: row.s || null, end: row.e || null });
    });
  });
}

/** ✅ 일정 전체 조회: { dduBeokId, items } */
function getSchedulesByDduBeokId(dduBeokId, userId) {
  return new Promise((resolve, reject) => {
    ensureDduBeokAccessible(dduBeokId, userId)
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
    ensureDduBeokAccessible(dduBeokId, userId)
      .then(({ start, end }) => {
        // ✅ 기간 체크
        if (start && end) {
          if (date < start || date > end) {
            return reject(new Error("DATE_OUT_OF_RANGE"));
          }
        }

        // ✅ day_num 계산
        const dayNumSql = `
          SELECT DATEDIFF(?, DATE(start_date)) + 1 AS day_num
          FROM ddu_beok
          WHERE id = ?
        `;

        pool.query(dayNumSql, [date, dduBeokId], (err, rows) => {
          if (err) return reject(err);
          if (!rows || rows.length === 0 || rows[0].day_num == null) {
            return reject(new Error("NOT_FOUND_DDU_BEOK"));
          }

          const dayNum = Number(rows[0].day_num);

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
            getSchedulesByDduBeokId(dduBeokId, userId).then(resolve).catch(reject);
          });
        });
      })
      .catch(reject);
  });
}

/** ✅ 일정 삭제 후 { dduBeokId, items } 반환 */
function deleteScheduleAndReturnSchedules({ dduBeokId, scheduleId, userId }) {
  return new Promise((resolve, reject) => {
    ensureDduBeokAccessible(dduBeokId, userId)
      .then(({ isOwner }) => {
        // ✅ 소유자: 해당 뚜벅 일정 전체 삭제 가능(누가 만들었든)
        // ✅ 참여자: 본인 userId가 만든 일정만 삭제 가능
        const delSqlOwner = `
          DELETE FROM schedule
          WHERE id = ?
            AND ddu_beok_id = ?
        `;

        const delSqlParticipant = `
          DELETE FROM schedule
          WHERE id = ?
            AND ddu_beok_id = ?
            AND user_id = ?
        `;

        const sql = isOwner ? delSqlOwner : delSqlParticipant;
        const params = isOwner
          ? [scheduleId, dduBeokId]
          : [scheduleId, dduBeokId, userId];

        pool.query(sql, params, (err, result) => {
          if (err) return reject(err);

          if (!result || result.affectedRows === 0) {
            return reject(new Error("NOT_FOUND_SCHEDULE"));
          }

          getSchedulesByDduBeokId(dduBeokId, userId).then(resolve).catch(reject);
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
