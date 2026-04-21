import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import RealEstateTokenFactoryAbi from '../abi/RealEstateTokenFactory';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

const FACTORY_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const CreatePropertyToken = () => {
  const user = useStore((state) => state.user);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [propertyStatus, setPropertyStatus] = useState('pending');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!user?.email) {
      setStatusMessage('Please sign in to create a token.');
      return;
    }

    const loadStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/status', {
          params: { email: user.email }
        });
        setVerificationStatus(response.data.kycStatus || 'pending');
        setPropertyStatus(response.data.propertyStatus || 'pending');
      } catch (error) {
        console.error('Failed to load verification status', error);
      }
    };

    loadStatus();
  }, [user]);

  const createRealEstateToken = async () => {
    if (!user?.email) return alert('Sign in to continue.');
    if (verificationStatus !== 'matched') return alert('Complete Aadhaar/VC verification first.');
    if (propertyStatus !== 'approved') return alert('Complete property verification first.');
    if (!window.ethereum) return alert('MetaMask is not installed!');

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      await axios.post('http://localhost:3000/api/user/link-wallet', {
        email: user.email,
        walletAddress
      });

      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        RealEstateTokenFactoryAbi,
        signer
      );

      const tx = await factoryContract.createRealEstateToken(walletAddress, name, symbol);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => log.address === FACTORY_CONTRACT_ADDRESS);
      if (!event) throw new Error('Contract address not found in event logs!');

      const newContractAddress = event.args[0];
      await axios.post('http://localhost:3000/api/token/setlocation', {
        contractId: newContractAddress,
        location
      });

      setStatusMessage(`Real estate token "${name}" created successfully!`);
      setName('');
      setSymbol('');
      setLocation('');
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Transaction failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <motion.div
        className="bg-gray-800 text-white p-8 rounded-lg shadow-lg max-w-md w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">Create Real Estate Token</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Property Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="text-sm text-gray-400">
            Aadhaar/VC status: <span className="font-semibold text-white">{verificationStatus}</span>
            <br />
            Property verification: <span className="font-semibold text-white">{propertyStatus}</span>
          </div>

          {statusMessage && <div className="text-sm text-green-400">{statusMessage}</div>}

          <motion.button
            onClick={createRealEstateToken}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading || verificationStatus !== 'matched' || propertyStatus !== 'approved'}
          >
            {loading ? 'Creating...' : 'Create Token'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePropertyToken;
