import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
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
  const [documentFile, setDocumentFile] = useState(null);
  const [rawOCR, setRawOCR] = useState(null);
  const [vcAadhaarNumber, setVcAadhaarNumber] = useState('');
  const [vcHolderName, setVcHolderName] = useState('');
  const [vcIssuer, setVcIssuer] = useState('Demo VC');
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
        vcAadhaarNumber: vcAadhaarNumber || aadhaarNumber,
        vcHolderName: vcHolderName || aadhaarName,
        vcIssuer
      });

      setKycStatus(response.data.kycStatus);
      setStatusMessage(response.data.message);
      setStep(2);
    } catch (error) {
      console.error('KYC submit failed', error);
      setStatusMessage('Unable to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractAadhaar = async () => {
    if (!documentFile) {
      setStatusMessage('Aadhaar document is required to run OCR.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', documentFile);

      const response = await axios.post('http://localhost:3000/api/user/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const ocrData = response.data.ocrResult;
      setRawOCR(ocrData);
      
      // Auto-populate fields from OCR
      if (ocrData.fields) {
        setAadhaarNumber(ocrData.fields.aadhaarNumber || '');
        setAadhaarName(ocrData.fields.aadhaarName || '');
        setDob(ocrData.fields.dob || '');
        setAddress(ocrData.fields.address || '');
        
        // Auto-generate demo VC from Aadhaar data
        setVcAadhaarNumber(ocrData.fields.aadhaarNumber || '');
        setVcHolderName(ocrData.fields.aadhaarName || '');
        setVcIssuer('Demo VC');
      }

      setStatusMessage('OCR completed. Review and confirm extracted values below.');
    } catch (error) {
      console.error('OCR extraction failed', error);
      setStatusMessage('OCR extraction failed. Please upload a valid Aadhaar document.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.email) {
    return (
      <div className="pt-20 pb-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/50 rounded-xl p-10 border border-slate-700/50 backdrop-blur-sm text-center">
          <h1 className="text-3xl font-bold mb-4">KYC Verification</h1>
          <p className="text-gray-400 mb-6">Sign in to start your Aadhaar verification.</p>
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
          <h1 className="text-4xl font-bold mb-4">Aadhaar Verification</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Upload your Aadhaar document, extract details via OCR, and verify your identity.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-8 backdrop-blur-sm border border-slate-700/50">
          <div className="flex justify-center items-center gap-12 mb-8">
            {[1, 2].map((number) => (
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
                  {number === 1 ? 'Upload & Extract' : 'Confirmation'}
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Upload Aadhaar Document (Image or PDF)</label>
                <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setDocumentFile(e.target.files[0]);
                        setStatusMessage(`File selected: ${e.target.files[0].name}`);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium">
                    {documentFile ? documentFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">PNG, JPG, or PDF (Max 50MB)</p>
                </div>
              </div>

              <button
                onClick={handleExtractAadhaar}
                disabled={loading || !documentFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg transition-colors disabled:opacity-75 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Extracting...' : 'Extract Details from Document'}
              </button>

              {rawOCR && (
                <div className="space-y-6 pt-6 border-t border-slate-700">
                  <p className="text-sm text-gray-400">OCR extracted the following details. Edit as needed:</p>

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

                  <div className="bg-slate-900 rounded-xl p-4 text-xs text-gray-300 overflow-auto max-h-40">
                    <div className="font-semibold text-white mb-2">Raw OCR Text</div>
                    <pre className="whitespace-pre-wrap break-words">{rawOCR.text}</pre>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-400">
                {loading ? 'Processing document...' : statusMessage || 'Upload an Aadhaar image (JPG, PNG) or PDF to extract details automatically.'}
              </div>
            </motion.div>
          )}


          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
              {kycStatus === 'matched' ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">KYC Verified</h2>
                  <p className="text-gray-400 mb-6">Your Aadhaar details and demo VC have been verified and saved successfully.</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                  <p className="text-gray-400 mb-6">There was an issue verifying your credentials. Please try again.</p>
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
              {step === 1 && rawOCR && (
                <button
                  onClick={handleSubmitKYC}
                  disabled={loading || !aadhaarNumber}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Submit KYC</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCVerification;
