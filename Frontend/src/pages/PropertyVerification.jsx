import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileText, CheckCircle, Upload } from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';

const PropertyVerification = () => {
  const user = useStore((state) => state.user);
  const [documents, setDocuments] = useState([
    { type: 'stamp_duty', file: null, uploaded: false },
    { type: 'sale_deed', file: null, uploaded: false }
  ]);
  const [propertyStatus, setPropertyStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState('sale_deed');
  const inputRef = useRef();

  useEffect(() => {
    if (!user?.email) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/status', {
          params: { email: user.email }
        });
        setPropertyStatus(response.data.propertyStatus || 'pending');
        if (response.data.documents?.length) {
          const updatedDocs = documents.map(doc => {
            const found = response.data.documents.find(d => d.type === doc.type);
            return found ? { ...doc, uploaded: found.uploaded } : doc;
          });
          setDocuments(updatedDocs);
        }
      } catch (error) {
        console.error('Fetch property status failed', error);
      }
    };

    fetchStatus();
  }, [user]);

  const handleFileChange = (index, file) => {
    if (file) {
      const newDocuments = [...documents];
      newDocuments[index].file = file;
      newDocuments[index].uploaded = true;
      setDocuments(newDocuments);
    }
  };

  const handleOwnershipChange = (newType) => {
    setSelectedOwnership(newType);
    setDocuments(prev => prev.map(doc => 
      doc.type === 'sale_deed' || doc.type === 'power_of_attorney' 
        ? { type: newType, file: null, uploaded: false } 
        : doc
    ));
  };

  const handleSubmitVerification = async () => {
    if (!user?.email) {
      setStatusMessage('Please log in before submitting documents.');
      return;
    }

    const stampDutyUploaded = documents.find(d => d.type === 'stamp_duty').uploaded;
    const ownershipUploaded = documents.find(d => d.type === selectedOwnership).uploaded;

    if (!stampDutyUploaded || !ownershipUploaded) {
      setStatusMessage('Please upload Stamp Duty Paid and the selected ownership document.');
      return;
    }

    setLoading(true);
    try {
      const propertyId = `prop_${Date.now()}`;
      const submissionDocs = [
        { type: 'stamp_duty', uploaded: true, verified: true },
        { type: selectedOwnership, uploaded: true, verified: true }
      ];

      const response = await axios.post('http://localhost:3000/api/user/property', {
        email: user.email,
        propertyId,
        documents: submissionDocs
      });

      setPropertyStatus(response.data.propertyStatus);
      setStatusMessage(response.data.message);
    } catch (error) {
      console.error('Submit property verification failed', error);
      setStatusMessage('Unable to submit property documents.');
    } finally {
      setLoading(false);
    }
  };

  const documentCards = [
    {
      title: 'Stamp Duty Paid',
      description: 'Affidavit confirming stamp duty payment',
      icon: Building2,
      type: 'stamp_duty'
    },
    {
      title: selectedOwnership === 'sale_deed' ? 'Sale Deed' : 'Power of Attorney',
      description: selectedOwnership === 'sale_deed' ? 'Property ownership document' : 'Legal authorization document',
      icon: FileText,
      type: selectedOwnership
    }
  ];

  const stampDutyUploaded = documents.find(d => d.type === 'stamp_duty').uploaded;
  const ownershipUploaded = documents.find(d => d.type === selectedOwnership).uploaded;
  const progress = (stampDutyUploaded + ownershipUploaded) / 2 * 100;

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
            className="inline-block p-3 rounded-full bg-purple-500/20 mb-4"
          >
            <Building2 className="h-8 w-8 text-purple-500" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Property Verification</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Submit required documentation to verify your property for tokenization.
            Our team will review and validate all submitted documents.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2 mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{stampDutyUploaded + ownershipUploaded} / 2</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          {documents.map((doc, index) => {
            const card = documentCards.find(c => c.type === doc.type);
            return (
              <motion.div
                key={doc.type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-slate-800/50 rounded-xl p-6 border ${
                  doc.uploaded
                    ? 'border-green-500/50'
                    : 'border-slate-700/50'
                } backdrop-blur-sm transition-all duration-300`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${doc.uploaded ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                    <card.icon className={`h-6 w-6 ${doc.uploaded ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                    {card.type === selectedOwnership && (
                      <select 
                        value={selectedOwnership} 
                        onChange={(e) => handleOwnershipChange(e.target.value)} 
                        className="mb-2 p-2 border rounded bg-slate-700 text-white"
                      >
                        <option value="sale_deed">Sale Deed</option>
                        <option value="power_of_attorney">Power of Attorney</option>
                      </select>
                    )}
                    <p className="text-gray-400 text-sm mb-4">{card.description}</p>
                    {doc.uploaded ? (
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Document Uploaded</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => document.getElementById(`file-${index}`).click()}
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Upload className="h-5 w-5" />
                          <span>Upload Document</span>
                        </button>
                        <input
                          type="file"
                          id={`file-${index}`}
                          onChange={(e) => handleFileChange(index, e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleSubmitVerification}
            disabled={loading || !(stampDutyUploaded && ownershipUploaded)}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Verification'}
          </button>
          {statusMessage && <p className="mt-4 text-gray-400">{statusMessage}</p>}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Verification Status</h3>
              <p className="text-gray-400 text-sm">
                {propertyStatus === 'approved'
                  ? 'Your property documentation is approved.'
                  : 'Upload your documents and submit them for review.'}
              </p>
            </div>
            <button
              onClick={handleSubmitVerification}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>

          {statusMessage && <div className="mt-4 text-sm text-gray-300">{statusMessage}</div>}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PropertyVerification;
