const express = require('express');
const { imageUploader } = require("../middlewares/s3upload.js");
const dduBeokCotroller = require('../controllers/dduBeokController');

const router = express.Router();

router.post(
    '/image', 
    imageUploader.single("image"),
    dduBeokCotroller.uploadDduBeokImage
);

router.post(
    '',
    dduBeokCotroller.createDdubeok
)

module.exports = router;