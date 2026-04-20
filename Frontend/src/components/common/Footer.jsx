import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Twitter, Linkedin, Github, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-slate-900/50 to-slate-950 py-16 mt-24 border-t border-amber-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-slate-950 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <span className="text-lg font-black text-amber-300">PropertyChain</span>
            </Link>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Empowering individuals to build generational wealth through fractional real estate ownership. No gatekeepers. No minimums. Just pure blockchain-powered investing.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 rounded-lg bg-slate-800/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all duration-300">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all duration-300">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-6 text-white uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/token-listing" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Properties
                </Link>
              </li>
              <li>
                <Link to="/liquidity-pool" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Liquidity Pool
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Dashboard
                </Link>
              </li>
              <li>
                <Link to="/" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Create Token
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-6 text-white uppercase tracking-wider">Security</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/kyc-verification" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → KYC Verification
                </Link>
              </li>
              <li>
                <Link to="/property-verification" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Property Verification
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Fraud Prevention
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-amber-300 transition-colors duration-300 font-medium">
                  → Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-white uppercase tracking-wider">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-slate-400 hover:text-amber-300 transition-colors duration-300">
                <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <a href="mailto:hello@propertychain.io" className="font-medium">hello@propertychain.io</a>
              </li>
              <li className="flex items-center space-x-3 text-slate-400 hover:text-amber-300 transition-colors duration-300">
                <Phone className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="font-medium">1-888-PROP-CHAIN</span>
              </li>
              <li className="flex items-start space-x-3 text-slate-400">
                <MapPin className="h-4 w-4 text-amber-500 flex-shrink-0 mt-1" />
                <span className="font-medium">San Francisco, CA 94107</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700/50 pt-8">
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div>
              <p className="text-sm text-slate-400">
                Building the future of property ownership. ⛓️ Secure. 💎 Transparent. 📈 Profitable.
              </p>
            </div>
            <div className="flex gap-6 md:justify-end">
              <a href="#" className="text-xs text-slate-400 hover:text-amber-300 transition-colors">Privacy</a>
              <a href="#" className="text-xs text-slate-400 hover:text-amber-300 transition-colors">Terms</a>
              <a href="#" className="text-xs text-slate-400 hover:text-amber-300 transition-colors">Disclaimer</a>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500">
            <p>© 2024 PropertyChain. All rights reserved. | Democratizing Real Estate Ownership</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;