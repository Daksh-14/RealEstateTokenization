const express = require('express');
const multer = require('multer');
const {
  getUserStatus,
  registerOrUpdateUser,
  runAadhaarOCR,
  submitKYC,
  submitPropertyVerification,
  linkWallet,
  recoverWallet
} = require('../controllers/user.controller.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.route('/status').get(getUserStatus);
router.route('/profile').post(registerOrUpdateUser);
router.route('/kyc').post(submitKYC);
router.route('/ocr').post(upload.single('document'), runAadhaarOCR);
router.route('/property').post(submitPropertyVerification);
router.route('/link-wallet').post(linkWallet);
router.route('/recover-wallet').post(recoverWallet);

module.exports = router;
