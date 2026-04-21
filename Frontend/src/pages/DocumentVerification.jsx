import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocumentVerification = () => {
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
            className="inline-block p-3 rounded-full bg-green-500/20 mb-4"
          >
            <FileText className="h-8 w-8 text-green-500" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Document Verification</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            This section will guide you through reviewing and approving the legal documents required for tokenization.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-10 border border-slate-700/50 backdrop-blur-sm text-center">
          <h2 className="text-2xl font-semibold mb-4">In progress</h2>
          <p className="text-gray-400 mb-6">
            Document verification is part of the onboarding flow and will be linked to both KYC and property verification.
          </p>
          <Link to="/verification" className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            Back to Verification Center
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentVerification;
