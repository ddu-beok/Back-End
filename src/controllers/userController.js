/**
 * - kakaoCallback: 카카오 콜백(code) -> JWT 발급 -> 프론트 성공/실패 페이지로 redirect
 * - getUserDduBeok: Authorization: Bearer <token> 에서 userId 추출 후 조회
 */
const kakaoService = require("../services/kakaoService");
const userService = require("../services/userService");
const { getUserIdFromJWT } = require("../utils/jwtUtil");

// ✅ 요청대로 .env FRONTEND_ORIGIN 제거하고 하드코딩
const FRONTEND_ORIGIN = "http://localhost:3000";

const kakaoCallback = async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error("Kakao OAuth error:", error, error_description);
    return res.redirect(`${FRONTEND_ORIGIN}/login/fail`);
  }

  // code 없이 직접 접근하면 실패로
  if (!code) {
    return res.redirect(`${FRONTEND_ORIGIN}/login/fail`);
  }

  try {
    const jwtToken = await kakaoService.generateJWTFromCode(code);

    // ✅ 토큰은 URL에 들어가므로 인코딩
    return res.redirect(
      `${FRONTEND_ORIGIN}/login/success?token=${encodeURIComponent(jwtToken)}`
    );
  } catch (err) {
    console.error("kakaoCallback error:", err.response?.data || err.message || err);
    return res.redirect(`${FRONTEND_ORIGIN}/login/fail`);
  }
};

async function getUserDduBeok(req, res) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Authorization 헤더(Bearer 토큰)가 필요합니다.",
    });
  }

  const userId = getUserIdFromJWT(token);
  if (!userId) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }

  try {
    const results = await userService.getUserDduBeokById(userId);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "해당 유저 데이터가 없습니다." });
    }

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB 조회 중 오류 발생" });
  }
}

module.exports = {
  kakaoCallback,
  getUserDduBeok,
};
