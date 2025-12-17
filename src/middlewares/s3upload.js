/**
 * - multer-s3 기반 이미지 업로더 공용화
 * - 라우트별로 req.s3Directory를 설정하면 업로드 경로를 제어할 수 있게 함
 */
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const crypto = require("crypto");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const imageUploader = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error("ONLY_IMAGE_ALLOWED"), false);
    }
    cb(null, true);
  },
  storage: multerS3({
    s3,
    bucket: "ddu-beok",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // ✅ 라우트에서 req.s3Directory 주입 가능
      const directory = req.s3Directory || req.query.directory || "ddu-beok";

      const ext = path.extname(file.originalname);
      const uuid = crypto.randomUUID();
      cb(null, `${directory}/${uuid}${ext}`);
    },
  }),
});

module.exports = { imageUploader };
