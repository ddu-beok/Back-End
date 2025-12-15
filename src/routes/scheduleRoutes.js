// src/routes/scheduleRoutes.js
// ✅ Trip 조회/일정 생성/삭제 라우팅을 한 곳에서 관리합니다.
const express = require("express");
const scheduleController = require("../controllers/scheduleController");

const router = express.Router();

/** GET /api/ddu-beoks/:dduBeokId/trip */
router.get("/:dduBeokId/trip", scheduleController.getTrip);

/** POST /api/ddu-beoks/:dduBeokId/schedules */
router.post("/:dduBeokId/schedules", scheduleController.createSchedule);

/** ✅ DELETE /api/ddu-beoks/:dduBeokId/schedules/:scheduleId */
router.delete("/:dduBeokId/schedules/:scheduleId", scheduleController.deleteSchedule);

module.exports = router;
