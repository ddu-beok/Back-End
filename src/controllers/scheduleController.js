// Back-End/src/controllers/scheduleController.js
/**
 * - multipart/form-data(payload + images) 지원
 * - S3 업로드된 파일 URL(req.files[].location)을 blocks.images에 주입
 * - ✅ payload 파싱(BOM/이중문자열/바깥따옴표 케이스) 강화
 * - ✅ schedule API는 Authorization: Bearer <JWT> 필수
 */
const scheduleService = require("../services/scheduleService");
const { getUserIdFromJWT } = require("../utils/jwtUtil");

function isValidYmd(dateStr) {
  return typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function isMultipart(req) {
  const ct = String(req.headers["content-type"] || "");
  return ct.includes("multipart/form-data");
}

/** ✅ Authorization: Bearer <token> 필수 */
function requireUserId(req, res) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Authorization 헤더(Bearer 토큰)가 필요합니다." });
    return null;
  }

  const userId = getUserIdFromJWT(token);
  if (!userId) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    return null;
  }

  return userId;
}

/** ✅ multipart payload 파서 (BOM / 이중문자열 / 바깥따옴표 케이스 방어) */
function parseMultipartPayload(req) {
  let payloadRaw = req.body?.payload;

  if (payloadRaw == null) {
    const e = new Error("MISSING_PAYLOAD");
    e.code = "MISSING_PAYLOAD";
    throw e;
  }

  if (Buffer.isBuffer(payloadRaw)) payloadRaw = payloadRaw.toString("utf8");
  if (typeof payloadRaw === "object") return payloadRaw;

  const s = String(payloadRaw).replace(/^\uFEFF/, "").trim();
  let parsed = safeJsonParse(s, null);

  if (typeof parsed === "string") {
    parsed = safeJsonParse(String(parsed).replace(/^\uFEFF/, "").trim(), null);
  }

  if (!parsed && s.startsWith('"') && s.endsWith('"')) {
    const unquoted = s.slice(1, -1);
    parsed = safeJsonParse(unquoted, null);
    if (typeof parsed === "string") parsed = safeJsonParse(parsed, null);
  }

  if (!parsed || typeof parsed !== "object") {
    const e = new Error("INVALID_PAYLOAD_JSON");
    e.code = "INVALID_PAYLOAD_JSON";
    e.preview = s.slice(0, 200);
    throw e;
  }

  return parsed;
}

/** ✅ 일정 전체 조회 */
async function getSchedules(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const dduBeokId = Number(req.params.dduBeokId);
  if (!dduBeokId || Number.isNaN(dduBeokId)) {
    return res.status(400).json({ message: "dduBeokId가 올바르지 않습니다." });
  }

  try {
    const result = await scheduleService.getSchedulesByDduBeokId(dduBeokId, userId);
    return res.json(result);
  } catch (err) {
    console.error(err);

    if (String(err.message).includes("FORBIDDEN_DDU_BEOK")) {
      return res.status(403).json({ message: "해당 ddu_beok에 접근 권한이 없습니다." });
    }
    if (String(err.message).includes("NOT_FOUND_DDU_BEOK")) {
      return res.status(404).json({ message: "해당 ddu_beok이 없습니다." });
    }

    return res.status(500).json({ error: "일정 조회 중 오류 발생" });
  }
}

/** ✅ 일정 생성 (S3 이미지 포함 지원) */
async function createSchedule(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const dduBeokId = Number(req.params.dduBeokId);
  if (!dduBeokId || Number.isNaN(dduBeokId)) {
    return res.status(400).json({ message: "dduBeokId가 올바르지 않습니다." });
  }

  let body = req.body || {};

  if (isMultipart(req)) {
    try {
      body = parseMultipartPayload(req);
    } catch (e) {
      if (e.code === "MISSING_PAYLOAD") {
        return res.status(400).json({
          message: "multipart/form-data 요청에서는 payload 필드(JSON 문자열)가 필요합니다.",
        });
      }
      if (e.code === "INVALID_PAYLOAD_JSON") {
        return res.status(400).json({
          message: "payload JSON 파싱 실패 (유효한 JSON 문자열인지 확인하세요).",
          payloadPreview: e.preview,
        });
      }
      console.error(e);
      return res.status(400).json({ message: "payload 처리 중 오류가 발생했습니다." });
    }
  }

  const date = String(body?.date ?? "").trim();
  const startTime = body?.startTime != null ? String(body.startTime).trim() : "";
  const endTime = body?.endTime != null ? String(body.endTime).trim() : "";
  const title = body?.title != null ? String(body.title).trim() : "";
  const address = body?.address != null ? String(body.address).trim() : "";
  const lat = body?.lat ?? null;
  const lng = body?.lng ?? null;

  let blocksRaw = body.blocks ?? body.contents ?? [];
  if (typeof blocksRaw === "string") blocksRaw = safeJsonParse(blocksRaw, null);
  if (blocksRaw && !Array.isArray(blocksRaw) && Array.isArray(blocksRaw.blocks)) {
    blocksRaw = blocksRaw.blocks;
  }
  const blocksArray = Array.isArray(blocksRaw) ? blocksRaw : [];

  const blocks = blocksArray.map((b) => ({
    id: String(b?.id ?? "").trim(),
    icon: b?.icon ?? "",
    content: String(b?.content ?? b?.text ?? "").trim(),
    images: Array.isArray(b?.images) ? b.images : [],
  }));

  if (!isValidYmd(date)) {
    return res.status(400).json({ message: "date 형식은 YYYY-MM-DD 이어야 합니다." });
  }
  if (!title) {
    return res.status(400).json({ message: "title은 필수입니다." });
  }
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ message: "blocks는 1개 이상 필요합니다." });
  }
  if (startTime && endTime && startTime >= endTime) {
    return res.status(400).json({ message: "startTime은 endTime보다 빨라야 합니다." });
  }

  const imageMap = {};
  const files = Array.isArray(req.files) ? req.files : [];

  for (const f of files) {
    const original = String(f.originalname || "");
    const idx = original.indexOf("__");
    if (idx <= 0) continue;

    const blockId = original.slice(0, idx).trim();
    if (!blockId) continue;

    const url = f.location;
    if (!imageMap[blockId]) imageMap[blockId] = [];
    imageMap[blockId].push(url);
  }

  const blocksWithUrls = blocks.map((b) => {
    const id = String(b?.id || "");
    const existing = Array.isArray(b?.images) ? b.images : [];
    const uploaded = Array.isArray(imageMap[id]) ? imageMap[id] : [];
    return { ...b, images: [...existing, ...uploaded].slice(0, 5) };
  });

  try {
    const result = await scheduleService.createScheduleAndReturnSchedules({
      dduBeokId,
      userId,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      title,
      address,
      lat: lat ?? null,
      lng: lng ?? null,
      blocks: blocksWithUrls,
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);

    if (String(err.message).includes("FORBIDDEN_DDU_BEOK")) {
      return res.status(403).json({ message: "해당 ddu_beok에 접근 권한이 없습니다." });
    }
    if (String(err.message).includes("NOT_FOUND_DDU_BEOK")) {
      return res.status(404).json({ message: "해당 ddu_beok이 없습니다." });
    }
    if (String(err.message).includes("DATE_OUT_OF_RANGE")) {
      return res
        .status(400)
        .json({ message: "date가 여행 기간(start~end) 범위를 벗어났습니다." });
    }

    return res.status(500).json({ error: "일정 등록 중 오류 발생" });
  }
}

/** ✅ 일정 삭제 */
async function deleteSchedule(req, res) {
  const userId = requireUserId(req, res);
  if (!userId) return;

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

    if (String(err.message).includes("FORBIDDEN_DDU_BEOK")) {
      return res.status(403).json({ message: "해당 ddu_beok에 접근 권한이 없습니다." });
    }
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
