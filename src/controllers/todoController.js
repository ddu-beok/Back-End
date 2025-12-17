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

const checkTodo = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
        }

        const token = authHeader.split(" ")[1];
        const userId = getUserIdFromJWT(token);

        const { todoId } = req.params;

        const result = await todoService.checkTodo({
            userId,
            todoId
        });

        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "todo 체크 실패" });
    }
};

const getTodo = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'Authorization 헤더가 없습니다.' });
        }

        const token = authHeader.split(" ")[1];
        const userId = getUserIdFromJWT(token);

        const { dduBeokId } = req.params;
        const { num } = req.query;

        const result = await todoService.getTodo({
            userId,
            dduBeokId,
            num
        });

        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "todo 조회 실패" });
    }
}

module.exports = {
    createTodo,
    checkTodo,
    getTodo
};
