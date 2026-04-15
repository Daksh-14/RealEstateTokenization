import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import LiquidityPool from './pages/LiquidityPool';
import TokenListing from './pages/TokenListing';
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import KYCVerification from './pages/KYCVerification';
import PropertyVerification from './pages/PropertyVerification';
import DocumentVerification from './pages/DocumentVerification';
import CreatePropertyToken from './pages/CreatePropertyToken';
import SellerListings from './pages/SellerListings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white bg-animate-gradient">
        <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-token" element={<CreatePropertyToken />} />
            <Route path="/liquidity-pool" element={<LiquidityPool />} />
            <Route path="/token-listing" element={<TokenListing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/kyc-verification" element={<KYCVerification />} />
            <Route path="/property-verification" element={<PropertyVerification />} />
            <Route path="/document-verification" element={<DocumentVerification />} />
            <Route path="/seller-listing/:id" element={<SellerListings/>} />
          </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;