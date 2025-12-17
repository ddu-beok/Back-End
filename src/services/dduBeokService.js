const { pool } = require('../db.config');

const createDdubeok = async ({
    userId,
    title,
    location,
    password,
    startDate,
    endDate,
    latitude,
    longitude,
    imageUrl,
    }) => {
    const [result] = await pool.promise().query(
        `
        INSERT INTO ddu_beok
        (user_id, title, location, password, start_date, end_date, latitude, longitude, img)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
        userId,
        title,
        location,
        password,
        startDate,
        endDate,
        latitude,
        longitude,
        imageUrl,
        ]
    );

    return {
        id: result.insertId,
        userId,
        title,
        location,
        img: imageUrl,
    };
};

const likeDduBeok = async ({ dduBeokId }) => {
    const [result] = await pool.promise().query(
        `
        UPDATE ddu_beok
        SET is_favorite = 1
        WHERE id = ?
        `,
        [dduBeokId]
    );

    return {
        result
    };
}

module.exports = {
    createDdubeok,
    likeDduBeok
};