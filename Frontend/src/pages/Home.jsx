import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, Coins, LineChart, Shield, TrendingUp, Lock, Zap } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Coins className="h-8 w-8" />,
      title: 'Fractionalized Ownership',
      description: 'Own a piece of premium properties starting from $100. No large upfront capital required.',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: '24/7 Trading',
      description: 'Trade your property tokens anytime, anywhere. Instant liquidity through our decentralized marketplace.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Smart Contract Security',
      description: 'Fully audited contracts backed by top-tier security protocols and insurance coverage.',
      gradient: 'from-cyan-500 to-blue-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <div className="pt-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative overflow-hidden py-32"
      >
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Luxury apartment building"
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/50 to-slate-950"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-6 inline-block">
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 text-sm font-semibold">
                🚀 Next Generation Property Investment
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black mb-8 leading-tight bg-gradient-to-r from-amber-300 via-orange-300 to-red-300 bg-clip-text text-transparent"
            >
              Own Fractional
              <br />
              Properties Instantly
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Democratizing real estate ownership through blockchain. Buy fractional stakes in prime properties, trade 24/7, and build wealth with zero minimums and complete transparency.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
            >
              <Link
                to="/token-listing"
                className="group relative px-8 py-4 rounded-lg font-semibold text-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Start Investing <Zap className="h-5 w-5" />
                </span>
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-lg font-semibold text-lg text-amber-300 bg-slate-800/50 border-2 border-amber-500/50 hover:border-amber-500 hover:bg-slate-700/50 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  Connect Wallet <Lock className="h-5 w-5" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Why PropertyChain?
            </h2>
            <p className="text-xl text-slate-400">Democratizing wealth through real estate. Start investing with zero friction and maximum control.</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" style={{
                  backgroundImage: `linear-gradient(135deg, var(--color1), var(--color2))`,
                  '--color1': feature.gradient.split(' ')[1],
                  '--color2': feature.gradient.split(' ')[3],
                }}></div>

                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 group-hover:border-slate-600 p-8 rounded-2xl transition-all duration-500 h-full hover:transform hover:-translate-y-2">
                  <div className={`mb-6 inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.gradient} text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-orange-900/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-black mb-6 text-white">Ready to Build Your Real Estate Portfolio?</h3>
            <p className="text-xl text-slate-300 mb-10">
              Join millions investing in the future of property ownership. Start with as little as $100 today.
            </p>
            <Link
              to="/token-listing"
              className="inline-block px-10 py-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Browse Properties Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;