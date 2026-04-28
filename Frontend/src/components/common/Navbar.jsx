import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Wallet, Menu, X, Sparkles } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Liquidity Pool', path: '/liquidity-pool' },
    { name: 'Token Listing', path: '/token-listing' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Verification', path: '/verification' },
  ];

  return (
    <nav className="fixed w-full bg-gradient-to-b from-slate-950/95 to-slate-900/80 backdrop-blur-xl z-50 border-b border-amber-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-slate-950 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-300">PropertyChain</span>
              <div className="text-xs text-amber-400/70 font-semibold tracking-widest">BLOCKCHAIN REAL ESTATE</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="px-4 py-2 text-slate-300 hover:text-amber-300 transition-all duration-300 font-medium text-sm uppercase tracking-wide relative group"
              >
                {item.name}
                <span className="absolute 0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Desktop Connect Wallet */}
            <Link
              to="/login"
              className="hidden md:flex items-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 uppercase text-sm tracking-wide"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-amber-400 hover:text-amber-300 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-amber-500/10"
        >
          <div className="px-4 pt-4 pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="block px-4 py-3 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all duration-300 font-medium uppercase text-sm tracking-wide"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/login"
              className="block px-4 py-3 text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg font-bold text-center uppercase text-sm tracking-wide transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Connect Wallet
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;