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
async function getMe(req, res) {
  const userId = 1;
  try {
    const result = await userService.getMeById(userId);
    if (!result) return res.status(404).json({ message: '유저 없음' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB 조회 중 오류 발생' });
  }
}
async function getUserFootprints(req, res) {
  const userId = 1; // 임시 고정
  try {
    const results = await userService.getUserFootprintsById(userId);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB 조회 중 오류 발생' });
  }
}

module.exports = {
    getUserDduBeok,
    getMe,
    getUserFootprints,
}