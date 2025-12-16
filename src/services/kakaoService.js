const axios = require("axios");
const jwt = require("jsonwebtoken");
const { pool } = require("../db.config");

const generateJWTFromCode = async (authorizationCode) => {
    console.log("1️⃣ authorizationCode:", authorizationCode);

    // 1. 카카오 토큰 요청
    const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY, // 콘솔의 REST API 키
        redirect_uri: process.env.KAKAO_REDIRECT_URI, // 콘솔에 등록된 URI와 완전히 일치
        code: authorizationCode,
    });

    console.log("🔹 token 요청 params:", tokenParams.toString());

    let tokenRes;
    try {
        tokenRes = await axios.post(
            "https://kauth.kakao.com/oauth/token",
            tokenParams,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
    } catch (err) {
        console.error("🔥 token 요청 에러:", err.response?.data || err.message);
        throw err;
    }

    console.log("2️⃣ accessToken:", tokenRes.data.access_token);

    // 2. 사용자 정보 요청
    let userRes;
    try {
        userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
        });
    } catch (err) {
        console.error("🔥 user info 요청 에러:", err.response?.data || err.message);
        throw err;
    }

    const kakaoUser = userRes.data;
    console.log("3️⃣ kakaoUser:", kakaoUser);

    const kakaoId = kakaoUser.id;
    const nickname = kakaoUser.properties?.nickname ?? "카카오유저";
    const profileImg = kakaoUser.kakao_account?.profile?.profile_image_url ?? null;

    // 3. DB 조회 / 없으면 insert
    const [rows] = await pool.promise().query(
        "SELECT * FROM user WHERE kakao_id = ?",
        [kakaoId]
    );

    let user;
    if (rows.length === 0) {
        const [result] = await pool.promise().query(
            "INSERT INTO user (kakao_id, nickname, profile_img) VALUES (?, ?, ?)",
            [kakaoId, nickname, profileImg]
        );
        user = { id: result.insertId };
    } else {
        user = rows[0];
    }

    // 4. JWT 발급
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    console.log("4️⃣ jwtToken 생성 완료:", jwtToken);

    return jwtToken;
};

module.exports = {
    generateJWTFromCode,
};
