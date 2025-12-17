const express = require('express');
const { imageUploader } = require("../middlewares/s3upload.js");
const { uploadDduBeokImage } = require('../controllers/dduBeokController.js');

const router = express.Router();

router.post(
    '/:id/image', 
    imageUploader.single("image"),
    uploadDduBeokImage
);

module.exports = router;