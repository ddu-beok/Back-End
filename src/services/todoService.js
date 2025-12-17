const { pool } = require("../db.config");

const createTodo = async ({
  userId,
  dduBeokId,
  category,
  content,
  num,
}) => {
  const [result] = await pool.promise().query(
    `
    INSERT INTO todo
    (ddu_beok_id, user_id, category, content, day_num)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      dduBeokId,
      userId,
      category,
      content,
      num,
    ]
  );

  return {
    id: result.insertId,
  };
};

module.exports = {
  createTodo,
};
