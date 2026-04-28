const express = require('express');
const multer = require('multer');
const {
  extractPropertyDoc,
  validatePropertyDoc,
  extractAndValidatePropertyDoc
} = require('../controllers/propertyDocs.controller.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.route('/extract').post(upload.single('document'), extractPropertyDoc);
router.route('/validate').post(validatePropertyDoc);
router.route('/extract-and-validate').post(upload.single('document'), extractAndValidatePropertyDoc);

module.exports = router;

