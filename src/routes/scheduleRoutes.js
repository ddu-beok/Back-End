// src/routes/scheduleRoutes.js
// ✅ 일정(Schedule) 조회/생성/삭제 라우팅
const express = require("express");
const scheduleController = require("../controllers/scheduleController");

const router = express.Router();

/** ✅ GET /api/ddu-beoks/:dduBeokId/schedules */
router.get("/:dduBeokId/schedules", scheduleController.getSchedules);

/** ✅ POST /api/ddu-beoks/:dduBeokId/schedules */
router.post("/:dduBeokId/schedules", scheduleController.createSchedule);

/** ✅ DELETE /api/ddu-beoks/:dduBeokId/schedules/:scheduleId */
router.delete("/:dduBeokId/schedules/:scheduleId", scheduleController.deleteSchedule);

module.exports = router;
