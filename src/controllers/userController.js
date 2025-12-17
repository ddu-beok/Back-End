const kakaoService = require("../services/kakaoService");
const userService = require('../services/userService');
const { getUserIdFromJWT } = require("../utils/jwtUtil");

const kakaoCallback = async (req, res) => {
    const { code } = req.query; // 프론트에서 받은 authorization_code
    console.log('req: ', req.query);

    if (!code) {
        return res.redirect("http://localhost:4000/login/fail");
    }

    try {
        // 백엔드에서 JWT만 발급
        const jwtToken = await kakaoService.generateJWTFromCode(code);

        // JWT만 프론트로 전달
        res.redirect(`http://localhost:4000/login/success?token=${jwtToken}`);
    } catch (err) {
        console.error(err);
        res.redirect("http://localhost:4000/login/fail");
    }
};

async function getUserDduBeok(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
    }

    const token = authHeader.split(" ")[1];
    const userId = getUserIdFromJWT(token);

    try {
        const results = await userService.getUserDduBeokById(userId);

        if (!results || results.length === 0) {
            return res.status(404).json({ message: '해당 유저 데이터가 없습니다.' });
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB 조회 중 오류 발생' });
    }
}

async function getMe(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
    }

    const token = authHeader.split(" ")[1];
    const userId = getUserIdFromJWT(token);

    try {
        const result = await userService.getMeById(userId);

        if (!result) {
            return res.status(404).json({ message: '유저 없음' });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB 조회 중 오류 발생' });
    }
}

async function getUserFootprints(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
    }

    const token = authHeader.split(" ")[1];
    const userId = getUserIdFromJWT(token);

    try {
        const results = await userService.getUserFootprintsById(userId);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB 조회 중 오류 발생' });
    }
}

module.exports = {
    kakaoCallback,
    getUserDduBeok,
    getMe,
    getUserFootprints,
};
