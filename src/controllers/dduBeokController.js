const uploadDduBeokImage = async (req, res) => {
    try {
        const ddu_beok = req.params.id;

        if (!req.file) {
            return res.status(400).json({
            isSuccess: false,
            message: "이미지 파일이 없습니다.",
            });
        }

        const imageUrl = req.file.location;

        // const sql = `
        //     UPDATE ddubeok
        //     SET img = ?
        //     WHERE id = ?
        // `;
        // await db.execute(sql, [imageUrl, ddubeokId]);

        return res.status(200).json({
            isSuccess: true,
            message: "이미지 업로드 성공",
            result: {
                img: imageUrl,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            isSuccess: false,
            message: "서버 오류",
        });
    }
};

module.exports = {
  uploadDduBeokImage,
};