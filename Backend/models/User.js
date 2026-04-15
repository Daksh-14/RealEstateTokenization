const mongoose = require('mongoose');

const VerificationDocumentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  uploaded: { type: Boolean, default: false },
  verified: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, default: '' },
  walletAddress: { type: String, default: '' },
  kyc: {
    aadhaarNumberHash: { type: String, default: '' },
    aadhaarName: { type: String, default: '' },
    dob: { type: String, default: '' },
    address: { type: String, default: '' },
    vcAadhaarNumberHash: { type: String, default: '' },
    vcHolderName: { type: String, default: '' },
    vcIssuer: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'matched', 'rejected'],
      default: 'pending'
    },
    submittedAt: { type: Date }
  },
  propertyVerification: {
    type: [
      new mongoose.Schema({
        propertyId: { type: String, required: true },
        title: { type: String, default: '' },
        contractId: { type: String, default: '' },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        documents: {
          type: [VerificationDocumentSchema],
          default: []
        },
        submittedAt: { type: Date }
      }, { _id: false })
    ],
    default: []
  },
  linkedWallets: { type: [String], default: [] },
  recovery: {
    lastRequestAt: { type: Date },
    allowed: { type: Boolean, default: false }
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
