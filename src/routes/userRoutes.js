const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/ddu-beok', userController.getUserDduBeok);

module.exports = router;