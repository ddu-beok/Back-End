const todoService = require("../services/todoService");
const { getUserIdFromJWT } = require("../utils/jwtUtil");

const createTodo = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
        }

        const token = authHeader.split(" ")[1];
        const userId = getUserIdFromJWT(token);

        const { dduBeokId } = req.params;
        const { num, category } = req.query;

        const content = req.body;

        const result = await todoService.createTodo({
            userId,
            dduBeokId,
            category,
            content,
            num
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "투두 생성 실패" });
    }
};

// const getTodo

module.exports = {
    createTodo
};
