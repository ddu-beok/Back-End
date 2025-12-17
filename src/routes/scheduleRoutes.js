// Back-End/src/routes/scheduleRoutes.js
/**
 * - POST /:dduBeokId/schedules 에서 multipart/form-data 허용
 * - images[]를 multer-s3로 S3 업로드한 뒤 controller에서 blocks에 URL 주입
 * - ✅ 업로드 에러(이미지 아님/용량 초과)를 JSON으로 반환
 */
const express = require("express");
const scheduleController = require("../controllers/scheduleController");
const { imageUploader } = require("../middlewares/s3upload");

const router = express.Router();

/** GET /api/ddu-beoks/:dduBeokId/schedules */
router.get("/:dduBeokId/schedules", scheduleController.getSchedules);

/** 업로드 미들웨어를 감싸서 multer 에러를 JSON으로 처리 */
function uploadScheduleImages(req, res, next) {
  req.s3Directory = `schedules/${req.params.dduBeokId}`;

  const mw = imageUploader.array("images", 50);
  mw(req, res, (err) => {
    if (!err) return next();

    // multer 에러 코드들
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "이미지 파일은 10MB 이하만 업로드할 수 있습니다." });
    }
    if (String(err.message).includes("ONLY_IMAGE_ALLOWED")) {
      return res.status(400).json({ message: "이미지 파일만 업로드할 수 있습니다." });
    }

    console.error("multer upload error:", err);
    return res.status(400).json({
      message: "이미지 업로드 중 오류가 발생했습니다.",
      error: String(err.message || err),
    });
  });
}

router.post("/:dduBeokId/schedules", uploadScheduleImages, scheduleController.createSchedule);

/** DELETE /api/ddu-beoks/:dduBeokId/schedules/:scheduleId */
router.delete("/:dduBeokId/schedules/:scheduleId", scheduleController.deleteSchedule);

module.exports = router;

