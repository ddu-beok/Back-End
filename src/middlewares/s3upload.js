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
  storage: multerS3({
    s3,
    bucket: "ddu-beok", // ddu-beok
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // 요청에서 directory 받기
      const directory = req.query.directory || "ddu-beok";

      const ext = path.extname(file.originalname);
      const uuid = crypto.randomUUID();

      cb(null, `${directory}/${uuid}${ext}`);
    },
  }),
});

module.exports = { imageUploader };
