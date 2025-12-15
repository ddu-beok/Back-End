// src/controllers/scheduleController.js
// ✅ Controller는 검증/에러처리/응답만 담당하고, DB 작업은 Service로 위임합니다.
const scheduleService = require("../services/scheduleService");

function isValidYmd(dateStr) {
  return typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/** ✅ 일정 전체 조회 */
async function getSchedules(req, res) {
  const dduBeokId = Number(req.params.dduBeokId);

  if (!dduBeokId || Number.isNaN(dduBeokId)) {
    return res.status(400).json({ message: "dduBeokId가 올바르지 않습니다." });
  }

  try {
    const result = await scheduleService.getSchedulesByDduBeokId(dduBeokId);
    return res.json(result);
  } catch (err) {
    console.error(err);

    if (String(err.message).includes("NOT_FOUND_DDU_BEOK")) {
      return res.status(404).json({ message: "해당 ddu_beok이 없습니다." });
    }

    return res.status(500).json({ error: "일정 조회 중 오류 발생" });
  }
}

/** ✅ 일정 생성 */
async function createSchedule(req, res) {
  const userId = 1; // TODO: 인증 붙이면 req.user.id로 교체
  const dduBeokId = Number(req.params.dduBeokId);

  if (!dduBeokId || Number.isNaN(dduBeokId)) {
    return res.status(400).json({ message: "dduBeokId가 올바르지 않습니다." });
  }

  const { date, startTime, endTime, title, address, lat, lng, blocks } = req.body;

  // ✅ 필수 검증
  if (!isValidYmd(date)) {
    return res.status(400).json({ message: "date 형식은 YYYY-MM-DD 이어야 합니다." });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "title은 필수입니다." });
  }
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ message: "blocks는 1개 이상 필요합니다." });
  }

  // ✅ 시간 검증(선택)
  if (startTime && endTime && String(startTime) >= String(endTime)) {
    return res.status(400).json({ message: "startTime은 endTime보다 빨라야 합니다." });
  }

  // ✅ 블록당 이미지 제한(최대 5장)
  for (const b of blocks) {
    if (Array.isArray(b.images) && b.images.length > 5) {
      return res.status(400).json({ message: "블록당 이미지는 최대 5장입니다." });
    }
  }

  try {
    const result = await scheduleService.createScheduleAndReturnSchedules({
      dduBeokId,
      userId,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      title,
      address: address || "",
      lat: lat ?? null,
      lng: lng ?? null,
      blocks,
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);

    if (String(err.message).includes("NOT_FOUND_DDU_BEOK")) {
      return res.status(404).json({ message: "해당 ddu_beok이 없습니다." });
    }
    if (String(err.message).includes("DATE_OUT_OF_RANGE")) {
      return res.status(400).json({ message: "date가 여행 기간(start~end) 범위를 벗어났습니다." });
    }

    return res.status(500).json({ error: "일정 등록 중 오류 발생" });
  }
}

/** ✅ 일정 삭제 (수정 기능 없이 삭제만) */
async function deleteSchedule(req, res) {
  const userId = 1; // TODO: 인증 붙이면 req.user.id로 교체
  const dduBeokId = Number(req.params.dduBeokId);
  const scheduleId = Number(req.params.scheduleId);

  if (!dduBeokId || Number.isNaN(dduBeokId)) {
    return res.status(400).json({ message: "dduBeokId가 올바르지 않습니다." });
  }
  if (!scheduleId || Number.isNaN(scheduleId)) {
    return res.status(400).json({ message: "scheduleId가 올바르지 않습니다." });
  }

  try {
    const result = await scheduleService.deleteScheduleAndReturnSchedules({
      dduBeokId,
      scheduleId,
      userId,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);

    if (String(err.message).includes("NOT_FOUND_DDU_BEOK")) {
      return res.status(404).json({ message: "해당 ddu_beok이 없습니다." });
    }
    if (String(err.message).includes("NOT_FOUND_SCHEDULE")) {
      return res.status(404).json({ message: "삭제할 일정(schedule)이 없습니다." });
    }

    return res.status(500).json({ error: "일정 삭제 중 오류 발생" });
  }
}

module.exports = { getSchedules, createSchedule, deleteSchedule };
