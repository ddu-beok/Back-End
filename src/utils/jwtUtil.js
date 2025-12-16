const jwt = require("jsonwebtoken");

const verifyJWT = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.error("JWT 검증 실패:", err);
        return null;
    }
};

// JWT 검증 및 userId 추출
const getUserIdFromJWT = (token) => {
    const decoded = verifyJWT(token);
    return decoded ? decoded.userId : null;
};

module.exports = {
    verifyJWT,
    getUserIdFromJWT,
};
