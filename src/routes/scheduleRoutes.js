// Back-End/src/routes/scheduleRoutes.js
/**
 * - POST /:dduBeokId/schedules 에서 multipart/form-data 허용
 * - images[]를 multer-s3로 S3 업로드한 뒤 controller에서 blocks에 URL 주입
 * - ✅ JWT 필수는 controller에서 처리 (미들웨어 파일 새로 안 만듦)
 */
const express = require("express");
const scheduleController = require("../controllers/scheduleController");
const { imageUploader } = require("../middlewares/s3upload");

const router = express.Router();

/** GET /api/ddu-beoks/:dduBeokId/schedules */
router.get("/:dduBeokId/schedules", scheduleController.getSchedules);

router.post(
  "/:dduBeokId/schedules",
  (req, _res, next) => {
    req.s3Directory = `schedules/${req.params.dduBeokId}`;
    next();
  },
  imageUploader.array("images", 50),
  scheduleController.createSchedule
);

/** DELETE /api/ddu-beoks/:dduBeokId/schedules/:scheduleId */
router.delete("/:dduBeokId/schedules/:scheduleId", scheduleController.deleteSchedule);

module.exports = router;
