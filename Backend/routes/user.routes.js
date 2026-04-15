const express = require('express');
const {
  getUserStatus,
  registerOrUpdateUser,
  submitKYC,
  submitPropertyVerification,
  linkWallet,
  recoverWallet
} = require('../controllers/user.controller.js');

const router = express.Router();

router.route('/status').get(getUserStatus);
router.route('/profile').post(registerOrUpdateUser);
router.route('/kyc').post(submitKYC);
router.route('/property').post(submitPropertyVerification);
router.route('/link-wallet').post(linkWallet);
router.route('/recover-wallet').post(recoverWallet);

module.exports = router;
