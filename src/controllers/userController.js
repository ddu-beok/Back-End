const userService = require('../services/userService');

async function getUserDduBeok(req, res) {
    const userId = 1; //req.params.id;

    try {
        const results = await userService.getUserDduBeokById(userId);

        if (results.length === 0) {
        return res.status(404).json({ message: '해당 유저 데이터가 없습니다.' });
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB 조회 중 오류 발생' });
    }
}

module.exports = {
    getUserDduBeok
}