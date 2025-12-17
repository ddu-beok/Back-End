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

const enterDduBeok = async ({ userId, dduBeokId, password }) => {
    const [rows] = await pool.promise().query(
        `
        SELECT password
        FROM ddu_beok
        WHERE id = ?
        `,
        [dduBeokId]
    );

    const dduBeok = rows[0];

    // 비밀번호가 틀림
    if (dduBeok.password !== password) {
        throw new Error("INVALID_PASSWORD");
    }

    // 이미 참여 중
    if (dduBeok.participant && dduBeok.participant.split(",").includes(String(userId))) {
        throw new Error("ALREADY_PARTICIPATED");
    }

    const uid = Number(userId);
    
    await pool.promise().query(
        `
        UPDATE ddu_beok
        SET participant =
        CASE
            WHEN participant IS NULL
            THEN JSON_ARRAY(?)
            WHEN JSON_CONTAINS(participant, CAST(? AS JSON), '$') = 0
            THEN JSON_ARRAY_APPEND(participant, '$', ?)
            ELSE participant
        END
        WHERE id = ?
        `,
        [uid, uid, uid, dduBeokId]
    );

    return {
        success: true
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

        const participantIds = Array.isArray(row.participant)
            ? row.participant
            : row.participant
                ? JSON.parse(row.participant)
                : [];

        if (participantIds.length > 0) {
            const [userRows] = await pool.promise().query(
                `
                SELECT id AS user_id, profile_img
                FROM user
                WHERE id IN (?)
                `,
                [participantIds]
            );

            participantArr = userRows;
        }

        result.push({
            id: row.id,
            title: row.title,
            location: row.location,
            img: row.img,
            isFavorite: row.is_favorite,
            participant: participantArr
        });
    }

    return result;
};


module.exports = {
    createDdubeok,
    likeDduBeok,
    getDduBeok,
    enterDduBeok
};