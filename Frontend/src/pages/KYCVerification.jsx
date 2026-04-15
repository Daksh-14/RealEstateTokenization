import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';

const KYCVerification = () => {
  const user = useStore((state) => state.user);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [kycStatus, setKycStatus] = useState('pending');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarName, setAadhaarName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [vcAadhaarNumber, setVcAadhaarNumber] = useState('');
  const [vcHolderName, setVcHolderName] = useState('');
  const [vcIssuer, setVcIssuer] = useState('Digilocker');

  useEffect(() => {
    if (!user?.email) return;

    const loadStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/status', {
          params: { email: user.email }
        });

        setKycStatus(response.data.kycStatus || 'pending');
        setStatusMessage(`Current KYC status: ${response.data.kycStatus || 'pending'}`);
      } catch (error) {
        console.error('Fetch KYC status error', error);
      }
    };

    loadStatus();
  }, [user]);

  const handleSubmitKYC = async () => {
    if (!user?.email) {
      setStatusMessage('Please log in to submit KYC.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/user/kyc', {
        email: user.email,
        fullName: user.fullName || aadhaarName,
        aadhaarNumber,
        aadhaarName,
        dob,
        address,
        vcAadhaarNumber,
        vcHolderName,
        vcIssuer
      });

      setKycStatus(response.data.kycStatus);
      setStatusMessage(response.data.message);
      setStep(3);
    } catch (error) {
      console.error('KYC submit failed', error);
      setStatusMessage('Unable to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.email) {
    return (
      <div className="pt-20 pb-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/50 rounded-xl p-10 border border-slate-700/50 backdrop-blur-sm text-center">
          <h1 className="text-3xl font-bold mb-4">KYC Verification</h1>
          <p className="text-gray-400 mb-6">Sign in to start your Aadhaar and Digilocker VC verification.</p>
          <a href="/login" className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block p-3 rounded-full bg-blue-500/20 mb-4"
          >
            <Shield className="h-8 w-8 text-blue-500" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">KYC Verification</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Submit your Aadhaar and Digilocker VC details to link your identity with your account.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-8 backdrop-blur-sm border border-slate-700/50">
          <div className="flex justify-between items-center mb-8">
            {[1, 2, 3].map((number) => (
              <div key={number} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step > number ? 'bg-green-500' : step === number ? 'bg-blue-500' : 'bg-slate-700'
                  } transition-colors duration-300`}
                >
                  {step > number ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white">{number}</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {number === 1 ? 'Aadhaar Details' : number === 2 ? 'VC Verification' : 'Confirmation'}
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Aadhaar Number</label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="Enter Aadhaar number"
                    className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name on Aadhaar</label>
                  <input
                    type="text"
                    value={aadhaarName}
                    onChange={(e) => setAadhaarName(e.target.value)}
                    placeholder="Name from Aadhaar"
                    className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address from Aadhaar"
                    className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Aadhaar OCR is a placeholder here; integrate your external OCR API later to populate these fields automatically.
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">VC Aadhaar Number</label>
                  <input
                    type="text"
                    value={vcAadhaarNumber}
                    onChange={(e) => setVcAadhaarNumber(e.target.value)}
                    placeholder="Aadhaar number from VC"
                    className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Holder Name</label>
                  <input
                    type="text"
                    value={vcHolderName}
                    onChange={(e) => setVcHolderName(e.target.value)}
                    placeholder="Name from VC"
                    className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">VC Issuer</label>
                <input
                  type="text"
                  value={vcIssuer}
                  onChange={(e) => setVcIssuer(e.target.value)}
                  placeholder="Digilocker or issuer name"
                  className="w-full bg-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-400">
                Paste the verified VC Aadhaar details from Digilocker QR extraction.
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
              {kycStatus === 'matched' ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">KYC Matched</h2>
                  <p className="text-gray-400 mb-6">Your Aadhaar and VC details are linked successfully.</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Review Needed</h2>
                  <p className="text-gray-400 mb-6">The Aadhaar and VC data did not match perfectly. Please check your input.</p>
                </>
              )}
              <p className="text-sm text-gray-400">{statusMessage}</p>
            </motion.div>
          )}

          <div className="mt-8 flex flex-col gap-3 items-end">
            {statusMessage && <div className="text-sm text-gray-300">{statusMessage}</div>}
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 2) {
                      handleSubmitKYC();
                    } else {
                      setStep(step + 1);
                    }
                  }}
                  disabled={loading}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>{step === 2 ? 'Verify KYC' : 'Continue'}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCVerification;
