// src/services/scheduleService.js
// ✅ 권한 체크(소유자/participant) 포함 버전 (async/await로 안정화)
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
 * - `"2,3,6"` / `["2","3"]` / `2,3,6` 모두 대응
 * - 최종적으로 [2,3,6] 숫자 배열로 정규화
 */
function parseParticipantIds(participantStr) {
  if (participantStr == null) return [];

  let raw = participantStr;

  if (typeof raw === "string") {
    const t = raw.trim();

    if ((t.startsWith('"') && t.endsWith('"')) || t.startsWith("[")) {
      const parsed = safeJsonParse(t, null);

      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => Number(String(v).trim()))
          .filter((n) => Number.isFinite(n) && n > 0);
      }

      if (typeof parsed === "string") raw = parsed;
    }
  }

  return String(raw)
    .replace(/\s+/g, "")
    .replace(/^"|"$/g, "")
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
async function ensureDduBeokAccessible(dduBeokId, userId) {
  const sql = `
    SELECT id, user_id, participant,
           DATE_FORMAT(start_date, '%Y-%m-%d') AS s,
           DATE_FORMAT(end_date, '%Y-%m-%d') AS e
    FROM ddu_beok
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await pool.promise().query(sql, [dduBeokId]);

  if (!rows || rows.length === 0) throw new Error("NOT_FOUND_DDU_BEOK");

  const row = rows[0];
  const ownerId = Number(row.user_id);
  const isOwner = ownerId === Number(userId);

  const participants = parseParticipantIds(row.participant);
  const isParticipant = participants.includes(Number(userId));

  if (!isOwner && !isParticipant) throw new Error("FORBIDDEN_DDU_BEOK");

  return { isOwner, start: row.s || null, end: row.e || null };
}

/** ✅ 일정 전체 조회: { dduBeokId, items } */
async function getSchedulesByDduBeokId(dduBeokId, userId) {
  await ensureDduBeokAccessible(dduBeokId, userId);

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

  const [itemRows] = await pool.promise().query(itemsSql, [dduBeokId]);

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

  return { dduBeokId: String(dduBeokId), items };
}

/** ✅ 일정 추가 후 { dduBeokId, items } 반환 */
async function createScheduleAndReturnSchedules({
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
  const { start, end } = await ensureDduBeokAccessible(dduBeokId, userId);

  // ✅ 기간 체크 (YYYY-MM-DD 문자열 비교는 안전)
  if (start && end) {
    if (date < start || date > end) {
      throw new Error("DATE_OUT_OF_RANGE");
    }
  }

  // ✅ day_num 계산
  const dayNumSql = `
    SELECT DATEDIFF(?, DATE(start_date)) + 1 AS day_num
    FROM ddu_beok
    WHERE id = ?
  `;
  const [rows] = await pool.promise().query(dayNumSql, [date, dduBeokId]);

  if (!rows || rows.length === 0 || rows[0].day_num == null) {
    throw new Error("NOT_FOUND_DDU_BEOK");
  }

  const dayNum = Number(rows[0].day_num);
  if (!Number.isFinite(dayNum) || dayNum <= 0) {
    throw new Error("DATE_OUT_OF_RANGE");
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
    startTime, // null 또는 "HH:mm"
    endTime,   // null 또는 "HH:mm"
    address,
    lat,
    lng,
    dayNum,
  ];

  await pool.promise().query(insertSql, params);
  return await getSchedulesByDduBeokId(dduBeokId, userId);
}

/** ✅ 일정 삭제 후 { dduBeokId, items } 반환 */
async function deleteScheduleAndReturnSchedules({ dduBeokId, scheduleId, userId }) {
  const { isOwner } = await ensureDduBeokAccessible(dduBeokId, userId);

  // ✅ 소유자: 해당 뚜벅의 일정 전체 삭제 가능(누가 만들었든)
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
  const params = isOwner ? [scheduleId, dduBeokId] : [scheduleId, dduBeokId, userId];

  const [result] = await pool.promise().query(sql, params);

  if (!result || result.affectedRows === 0) {
    throw new Error("NOT_FOUND_SCHEDULE");
  }

  return await getSchedulesByDduBeokId(dduBeokId, userId);
}

module.exports = {
  getSchedulesByDduBeokId,
  createScheduleAndReturnSchedules,
  deleteScheduleAndReturnSchedules,
};
