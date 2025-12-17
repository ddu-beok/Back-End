const dduBeokService = require("../services/dduBeokService");
const { getUserIdFromJWT } = require("../utils/jwtUtil");

const uploadDduBeokImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "이미지 파일이 없습니다." });
        }

        const imageUrl = req.file.location;

        res.json({ imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "이미지 업로드 실패" });
    }
};

const createDdubeok = async (req, res) => {
  try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
        }

        const token = authHeader.split(" ")[1];
        const userId = getUserIdFromJWT(token);

        const {
            title,
            location,
            password,
            startDate,
            endDate,
            latitude,
            longitude,
            imageUrl,
        } = req.body;

        const result = await dduBeokService.createDdubeok({
            userId,
            title,
            location,
            password,
            startDate,
            endDate,
            latitude,
            longitude,
            imageUrl,
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "뚜벅 생성 실패" });
    }
};

const likeDduBeok = async (req, res) => {
    try {
        const { dduBeokId } = req.params;

        const result = await dduBeokService.likeDduBeok({
            dduBeokId
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "뚜벅 즐겨찾기 실패" });
    }
};

module.exports = {
  uploadDduBeokImage,
  createDdubeok,
  likeDduBeok
};