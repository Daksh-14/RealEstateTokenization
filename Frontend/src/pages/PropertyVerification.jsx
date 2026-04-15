import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileText, CheckCircle, Upload } from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';

const PropertyVerification = () => {
  const user = useStore((state) => state.user);
  const [documents, setDocuments] = useState({
    title: false,
    inspection: false,
    appraisal: false,
    insurance: false
  });
  const [propertyStatus, setPropertyStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!user?.email) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/status', {
          params: { email: user.email }
        });
        setPropertyStatus(response.data.propertyStatus || 'pending');
        if (response.data.documents?.length) {
          const updatedDocs = response.data.documents.reduce((acc, doc) => {
            acc[doc.type] = doc.uploaded;
            return acc;
          }, { title: false, inspection: false, appraisal: false, insurance: false });
          setDocuments(updatedDocs);
        }
      } catch (error) {
        console.error('Fetch property status failed', error);
      }
    };

    fetchStatus();
  }, [user]);

  const handleUpload = (doc) => {
    setDocuments((prev) => ({ ...prev, [doc]: true }));
    setStatusMessage('Your document upload has been staged. Submit for review when ready.');
  };

  const handleSubmitVerification = async () => {
    if (!user?.email) {
      setStatusMessage('Please log in before submitting documents.');
      return;
    }

    setLoading(true);
    try {
      const formattedDocs = Object.entries(documents).map(([type, uploaded]) => ({
        type,
        uploaded,
        verified: uploaded
      }));

      const response = await axios.post('http://localhost:3000/api/user/property', {
        email: user.email,
        documents: formattedDocs
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
      title: 'Property Title',
      description: 'Upload clear copy of property title deed',
      icon: FileText,
      key: 'title'
    },
    {
      title: 'Property Inspection',
      description: 'Recent property inspection report',
      icon: Building2,
      key: 'inspection'
    },
    {
      title: 'Property Appraisal',
      description: 'Professional property valuation report',
      icon: FileText,
      key: 'appraisal'
    },
    {
      title: 'Insurance Documents',
      description: 'Valid property insurance documentation',
      icon: Building2,
      key: 'insurance'
    }
  ];

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
          {documentCards.map((doc) => (
            <motion.div
              key={doc.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-slate-800/50 rounded-xl p-6 border ${
                documents[doc.key]
                  ? 'border-green-500/50'
                  : 'border-slate-700/50'
              } backdrop-blur-sm transition-all duration-300`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${documents[doc.key] ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                  <doc.icon className={`h-6 w-6 ${documents[doc.key] ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{doc.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{doc.description}</p>
                  {documents[doc.key] ? (
                    <div className="flex items-center text-green-500">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Uploaded successfully</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpload(doc.key)}
                      className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload Document</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
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

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Document Upload Progress</span>
              <span>{Object.values(documents).filter(Boolean).length} / 4</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(Object.values(documents).filter(Boolean).length / 4) * 100}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PropertyVerification;
