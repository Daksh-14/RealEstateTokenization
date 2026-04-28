import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Building2, FileText, ArrowRight, CheckCircle } from 'lucide-react';

const Verification = () => {
  const verificationTypes = [
    {
      title: 'KYC Verification',
      description: 'Complete your identity verification to start investing in tokenized real estate.',
      icon: Shield,
      path: '/kyc-verification',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Property Verification',
      description: 'Submit and verify your property documents for tokenization.',
      icon: Building2,
      path: '/property-verification',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Document Verification',
      description: 'Get your legal and financial documents verified for compliance.',
      icon: FileText,
      path: '/document-verification',
      gradient: 'from-cyan-500 to-blue-600',
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Identity Verification',
      description: 'Complete KYC process with valid ID and proof of address',
    },
    {
      number: '2',
      title: 'Property Verification',
      description: 'Submit property documents and complete verification',
    },
    {
      number: '3',
      title: 'Document Review',
      description: 'Get your documents reviewed and approved',
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="pt-32 pb-016 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Header Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-20 pt-8"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white"
          >
            Verification <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-red-300 bg-clip-text text-transparent">Center</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            Complete necessary verifications to ensure security and compliance. Choose the verification process you need to get started with PropertyChain.
          </motion.p>
        </motion.div>

        {/* Verification Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          {verificationTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.title}
                variants={itemVariants}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl blur-xl -z-10`}></div>

                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 group-hover:border-slate-600 p-8 rounded-2xl transition-all duration-500 h-full hover:transform hover:-translate-y-2">
                  <div className={`mb-6 inline-flex p-3 rounded-lg bg-gradient-to-br ${type.gradient} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <h2 className="text-2xl font-bold mb-3 text-white">{type.title}</h2>
                  <p className="text-slate-400 mb-6 leading-relaxed">{type.description}</p>

                  <Link
                    to={type.path}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 hover:from-amber-500/40 hover:to-orange-500/40 hover:border-amber-400 transition-all duration-300 hover:gap-3"
                  >
                    <span>Start Verification</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Process Steps Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-orange-900/10 rounded-3xl blur-2xl"></div>

          <div className="relative bg-slate-800/40 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-12">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-black text-white mb-4">
                How It <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Works</span>
              </h3>
              <p className="text-slate-400 text-lg">A simple 3-step verification process to get you started</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[calc(200%-20px)] h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                  )}

                  <div className="flex flex-col items-center">
                    <div className="mb-6 relative z-10">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <span className="text-2xl font-black text-white">{step.number}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur opacity-50 -z-10 animate-pulse"></div>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-2 text-center">{step.title}</h4>
                    <p className="text-slate-400 text-center text-sm leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl p-12 border border-amber-500/10">
            <h3 className="text-3xl font-black text-white mb-4">
              Ready to Get <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Verified?</span>
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8 text-lg">
              Complete your verification today and unlock access to premium properties and investment opportunities on PropertyChain.
            </p>
            <Link
              to="/kyc-verification"
              className="inline-block px-10 py-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Begin Verification Now
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Verification;