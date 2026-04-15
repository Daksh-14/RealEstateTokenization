const crypto = require('crypto');
const User = require('../models/User.js');

const hashValue = (value) => {
  return crypto.createHash('sha256').update(value || '').digest('hex');
};

const getUserStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const primaryProperty = user.propertyVerification.length ? user.propertyVerification[0] : null;
    res.status(200).json({
      email: user.email,
      fullName: user.fullName,
      walletAddress: user.walletAddress,
      kycStatus: user.kyc.status,
      propertyStatus: primaryProperty?.status || 'pending',
      propertyVerification: user.propertyVerification,
      linkedWallets: user.linkedWallets
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user status' });
  }
};

const registerOrUpdateUser = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { email, fullName: fullName || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'User profile saved', user });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save user profile' });
  }
};

const submitKYC = async (req, res) => {
  try {
    const {
      email,
      fullName,
      aadhaarNumber,
      aadhaarName,
      dob,
      address,
      vcAadhaarNumber,
      vcHolderName,
      vcIssuer
    } = req.body;

    if (!email || !aadhaarNumber || !vcAadhaarNumber) {
      return res.status(400).json({ message: 'Email, Aadhaar and VC Aadhaar are required' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        email,
        fullName: fullName || '',
        'kyc.aadhaarNumberHash': hashValue(aadhaarNumber.trim()),
        'kyc.aadhaarName': aadhaarName || '',
        'kyc.dob': dob || '',
        'kyc.address': address || '',
        'kyc.vcAadhaarNumberHash': hashValue(vcAadhaarNumber.trim()),
        'kyc.vcHolderName': vcHolderName || '',
        'kyc.vcIssuer': vcIssuer || '',
        'kyc.submittedAt': new Date(),
        'kyc.status': aadhaarNumber.trim() === vcAadhaarNumber.trim() ? 'matched' : 'rejected'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const message = user.kyc.status === 'matched'
      ? 'KYC data matched and saved'
      : 'KYC data saved, but Aadhaar and VC Aadhaar values do not match';

    res.status(200).json({ message, kycStatus: user.kyc.status, user });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit KYC' });
  }
};

const submitPropertyVerification = async (req, res) => {
  try {
    const { email, propertyId, title, contractId, documents } = req.body;
    if (!email || !propertyId || !Array.isArray(documents)) {
      return res.status(400).json({ message: 'Email, propertyId, and documents are required' });
    }

    const formattedDocs = documents.map((doc) => ({
      type: doc.type,
      uploaded: !!doc.uploaded,
      verified: !!doc.verified
    }));

    const allUploaded = formattedDocs.every((doc) => doc.uploaded);
    const status = allUploaded ? 'approved' : 'pending';

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingProperty = user.propertyVerification.find((prop) => prop.propertyId === propertyId);
    if (existingProperty) {
      existingProperty.title = title || existingProperty.title;
      existingProperty.contractId = contractId || existingProperty.contractId;
      existingProperty.documents = formattedDocs;
      existingProperty.status = status;
      existingProperty.submittedAt = new Date();
    } else {
      user.propertyVerification.push({
        propertyId,
        title: title || '',
        contractId: contractId || '',
        documents: formattedDocs,
        status,
        submittedAt: new Date()
      });
    }

    await user.save();

    const propertyRecord = user.propertyVerification.find((prop) => prop.propertyId === propertyId);
    res.status(200).json({
      message: 'Property verification updated',
      propertyStatus: propertyRecord.status,
      propertyVerification: user.propertyVerification
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit property documents' });
  }
};

const linkWallet = async (req, res) => {
  try {
    const { email, walletAddress } = req.body;
    if (!email || !walletAddress) {
      return res.status(400).json({ message: 'Email and wallet address are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.kyc.status !== 'matched') {
      return res.status(400).json({ message: 'KYC must be matched before linking a wallet' });
    }

    const lowerWallet = walletAddress.toLowerCase();
    const linkedWallets = user.linkedWallets.includes(lowerWallet)
      ? user.linkedWallets
      : [...user.linkedWallets, lowerWallet];

    user.walletAddress = lowerWallet;
    user.linkedWallets = linkedWallets;
    await user.save();

    res.status(200).json({ message: 'Wallet linked successfully', walletAddress: user.walletAddress });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to link wallet' });
  }
};

const recoverWallet = async (req, res) => {
  try {
    const { email, newWalletAddress } = req.body;
    if (!email || !newWalletAddress) {
      return res.status(400).json({ message: 'Email and new wallet address are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.kyc.status !== 'matched') {
      return res.status(400).json({ message: 'Recovery is allowed only after matched KYC' });
    }

    user.walletAddress = newWalletAddress.toLowerCase();
    user.linkedWallets = [...new Set([...(user.linkedWallets || []), newWalletAddress.toLowerCase()])];
    user.recovery.lastRequestAt = new Date();
    user.recovery.allowed = true;
    await user.save();

    res.status(200).json({ message: 'Wallet recovery record updated', walletAddress: user.walletAddress });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to recover wallet' });
  }
};

module.exports = {
  getUserStatus,
  registerOrUpdateUser,
  submitKYC,
  submitPropertyVerification,
  linkWallet,
  recoverWallet
};
