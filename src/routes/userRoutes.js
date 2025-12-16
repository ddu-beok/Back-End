const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// 카카오 로그인 
router.get('/login/kakao', userController.kakaoCallback);

// 사용자 뚜벅 조회 
router.get('/ddu-beok', userController.getUserDduBeok);

module.exports = router;