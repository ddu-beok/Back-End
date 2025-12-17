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

const getDduBeok = async () => {
    const [rows] = await pool.promise().query(
        `
        SELECT *
        FROM ddu_beok
        ORDER BY created_at DESC
        LIMIT 16
        `
    );

    const result = [];

    for (const row of rows) {
        let participantArr = [];

        if (row.participant) {
        const participantIds = row.participant
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

        if (participantIds.length > 0) {
            const placeholders = participantIds.map(() => '?').join(',');

            const [userRows] = await pool.promise().query(
            `
            SELECT id AS user_id, profile_img
            FROM user
            WHERE id IN (${placeholders})
            `,
            participantIds
            );

            participantArr = userRows;
        }
        }

        result.push({
        id: row.id,
        title: row.title,
        location: row.location,
        img: row.img,
        isFavorite: row.is_favorite,
        participant: participantArr,
        });
    }

    return result;
}

module.exports = {
    createDdubeok,
    likeDduBeok,
    getDduBeok
};