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

const checkTodo = async ({ userId, todoId }) => {
    const [result] = await pool.promise().query(
        `
        UPDATE todo
        SET is_checked = 1
        WHERE id = ? AND user_id = ?
        `,
        [todoId, userId]
    );

    if (result.affectedRows === 0) {
        throw new Error("해당 todo가 없거나 권한이 없습니다.");
    }

    return {
        todoId,
        isChecked: 1
    };
};

module.exports = {
  createTodo,
  checkTodo
};
