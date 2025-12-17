const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/ddu-beok', userController.getUserDduBeok);

router.get('/me', userController.getMe);

router.get('/footprints', userController.getUserFootprints);

module.exports = router;