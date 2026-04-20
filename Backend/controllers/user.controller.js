const crypto = require('crypto');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const canvas = require('@napi-rs/canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const User = require('../models/User.js');

const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'canvas') return canvas;
  return originalLoad.call(this, request, parent, isMain);
};

global.Canvas = canvas.Canvas || canvas.createCanvas;
global.Image = canvas.Image;
global.ImageData = canvas.ImageData;
global.DOMMatrix = canvas.DOMMatrix;
global.DOMRect = canvas.DOMRect;
global.DOMPoint = canvas.DOMPoint;

pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

const hashValue = (value) => {
  return crypto.createHash('sha256').update(value || '').digest('hex');
};

let ocrWorkerPromise = null;

const getOcrWorker = async () => {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const workerInstance = await createWorker();
      if (typeof workerInstance.loadLanguage === 'function') {
        await workerInstance.loadLanguage('eng');
      }
      if (typeof workerInstance.initialize === 'function') {
        await workerInstance.initialize('eng');
      }
      if (typeof workerInstance.setParameters === 'function') {
        await workerInstance.setParameters({
          tessedit_pageseg_mode: '3',
          preserve_interword_spaces: '1',
          user_defined_dpi: '300'
        });
      }
      return workerInstance;
    })();
  }
  return ocrWorkerPromise;
};

const preprocessImageForOCR = async (buffer) => {
  const targetSize = 2800;
  const image = sharp(buffer).rotate().flatten({ background: '#ffffff' });
  const metadata = await image.metadata();
  const resizeOptions = {
    width: targetSize,
    height: targetSize,
    fit: 'inside',
    withoutEnlargement: false
  };

  const result = await image
    .resize(resizeOptions)
    .grayscale()
    .normalise()
    .gamma(1.1)
    .sharpen({ sigma: 1.2 })
    .median(1)
    .threshold(170)
    .png({ quality: 100 })
    .toBuffer();

  return result;
};

const fetchRemoteBuffer = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image/PDF: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') || ''
  };
};
const extractDirectPdfText = async (buffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const pages = Math.min(pdf.numPages, 10);

    let fullText = '';
    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const lines = {};

      textContent.items.forEach((item) => {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item.str);
      });

      const sortedLines = Object.keys(lines)
        .sort((a, b) => parseFloat(b) - parseFloat(a))
        .map((y) => lines[y].join(' '));

      fullText += sortedLines.join('\n') + '\n';
    }

    const trimmed = fullText.trim();
    if (trimmed.length < 50) {
      console.log('Direct PDF extraction returned too little text, assuming scanned PDF');
      return null;
    }

    return trimmed;
  } catch (error) {
    console.error('Direct PDF text extraction error:', error.message);
    return null;
  }
};

const extractPdfViaOcr = async (buffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const pages = Math.min(pdf.numPages, 10);

    const worker = await getOcrWorker();
    const pageTexts = [];
    let maxConfidence = null;

    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 2 });
      const minRenderWidth = 1200;
      const minRenderHeight = 1200;
      const renderScale = Math.max(
        4,
        Math.ceil(minRenderWidth / baseViewport.width),
        Math.ceil(minRenderHeight / baseViewport.height)
      );
      const viewport = page.getViewport({ scale: renderScale });
      console.log(`Rendering page ${pageNum} at scale ${renderScale}, size ${Math.round(viewport.width)}x${Math.round(viewport.height)}`);

      const pdfCanvas = canvas.createCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
      const context = pdfCanvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);

      await page.render({ canvasContext: context, viewport }).promise;

      const originalBuffer = pdfCanvas.toBuffer('image/png');
      const preprocessedBuffer = await preprocessImageForOCR(originalBuffer);

      console.log(`Starting OCR page ${pageNum} pass 1`);
      const pass1 = await worker.recognize(originalBuffer);
      console.log(`Completed OCR page ${pageNum} pass 1`);

      console.log(`Starting OCR page ${pageNum} pass 2`);
      const pass2 = await worker.recognize(preprocessedBuffer);
      console.log(`Completed OCR page ${pageNum} pass 2`);

      const text1 = pass1.data.text.trim();
      const conf1 = pass1.data.confidence ?? 0;
      const text2 = pass2.data.text.trim();
      const conf2 = pass2.data.confidence ?? 0;
      let bestText = text1;
      let bestConf = conf1;

      if (Math.abs(conf2 - conf1) > 2) {
        if (conf2 > conf1) {
          bestText = text2;
          bestConf = conf2;
        }
      } else if (text2.length > text1.length) {
        bestText = text2;
        bestConf = conf2;
      }

      pageTexts.push(bestText);
      maxConfidence = maxConfidence === null ? bestConf : Math.max(maxConfidence, bestConf);
      console.log(`Page ${pageNum} OCR completed, best confidence: ${bestConf}, text length: ${bestText.length}`);
    }

    return {
      text: pageTexts.join('\n\n').trim(),
      confidence: maxConfidence
    };
  } catch (error) {
    console.error('PDF OCR extraction error:', error.message);
    throw new Error('PDF OCR extraction failed: ' + error.message);
  }
};

const cleanOcrText = (text) => {
  if (!text) return '';

  let cleaned = text.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\u200B/g, '');
  cleaned = cleaned.replace(/[^\n -~]/g, ' ');
  cleaned = cleaned.replace(/\t+/g, ' ');
  cleaned = cleaned.replace(/\s*([,;:@|\/()\-])\s*/g, '$1 ');
  cleaned = cleaned.replace(/ {2,}/g, ' ');
  cleaned = cleaned.replace(/[ ]+-[ ]+/g, ' - ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  cleaned = cleaned
    .split('\n')
    .map((line) => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
      trimmed = trimmed.replace(/ {2,}/g, ' ');
      return trimmed;
    })
    .filter((line) => {
      if (!line) return false;
      const alphaNumericCount = (line.match(/[A-Za-z0-9]/g) || []).length;
      if (alphaNumericCount === 0) return false;
      if (line.length < 5 && alphaNumericCount / line.length < 0.5) return false;
      return true;
    })
    .join('\n');

  return cleaned.trim();
};

const extractByType = (docType, text) => {
  if (!text) return {};
  const find = (regex) => {
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  switch ((docType || '').toUpperCase()) {
    case 'FORM_16':
      return {
        grossSalary: find(/gross\s+salary[^\d]*(\d[\d,]+)/i),
        tdsDeducted: find(/total\s+tax\s+deducted[^\d]*(\d[\d,]+)/i),
        employerName: find(/name\s+of\s+employer[:\-]?\s*(.+)/i),
        employerPan: find(/(?:employer|deductor)\s+PAN[:\-\s]*([A-Z]{5}[0-9]{4}[A-Z])/i)
      };
    case 'AADHAAR':
    case 'UNKNOWN':
      return {
        rawText: text,
        aadhaarNumber: find(/(\d{4}[ \t]\d{4}[ \t]\d{4})/).replace(/\s+/g, ''),
        aadhaarName: find(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/),
        dob: (() => {
          const dobStr = find(/DOB[:\s]*(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{4})/i).replace(/\s+/g, '');
          if (dobStr) {
            const parts = dobStr.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              return `${year}-${month}-${day}`;
            }
          }
          return '';
        })(),
        gender: find(/(MALE|FEMALE)/i),
        mobile: find(/Mobile[ \t]+No\.?[ \t]*(\d{10})/i),
        vid: find(/VID[:\s]*([\d\s]{19})/i).replace(/\s+/g, ''),
        address: find(/Address\s*(.+?)(?:\n|$)/i) || find(/A-\s*(.+?)(?:\n|$)/i)
      };
    default:
      return { rawText: text };
  }
};

const extractTextFromPdf = async (buffer) => {
  const directPromise = extractDirectPdfText(buffer);
  const ocrPromise = extractPdfViaOcr(buffer);
  const [directText, ocrResult] = await Promise.all([directPromise, ocrPromise]);

  const finalText = directText || ocrResult.text;
  const confidence = directText ? null : ocrResult.confidence;

  return {
    directText,
    ocrText: ocrResult.text,
    finalText,
    confidence
  };
};

const getUserStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const primaryProperty = user.propertyVerification.length ? user.propertyVerification[0] : null;
    res.status(200).json({
      email: user.email,
      fullName: user.fullName,
      walletAddress: user.walletAddress,
      kycStatus: user.kyc.status,
      propertyStatus: primaryProperty?.status || 'pending',
      propertyVerification: user.propertyVerification,
      linkedWallets: user.linkedWallets
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user status' });
  }
};

const registerOrUpdateUser = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { email, fullName: fullName || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'User profile saved', user });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save user profile' });
  }
};

const runAadhaarOCR = async (req, res) => {
  try {
    let buffer;
    let contentType;
    let originalName = 'uploaded-file';

    if (req.file) {
      buffer = req.file.buffer;
      contentType = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body && req.body.data) {
      buffer = Buffer.from(req.body.data, 'base64');
      contentType = req.body.mimeType || 'application/pdf';
      originalName = req.body.fileName || 'base64-upload.pdf';
    } else {
      return res.status(400).json({ message: 'File or base64 PDF data is required' });
    }

    const docType = (req.body?.type || 'UNKNOWN').toUpperCase();

    console.log('OCR request received, file:', originalName, 'type:', contentType);

    let ocrText = '';
    let source = 'unknown';
    let ocrConfidence = null;
    let directText = null;
    let ocrPathResult = null;

    if (contentType.toLowerCase().includes('pdf')) {
      source = 'pdf';
      console.log('PDF detected, running dual extraction paths in parallel...');

      const [directTextResult, ocrResult] = await Promise.allSettled([
        extractDirectPdfText(buffer),
        extractPdfViaOcr(buffer)
      ]);

      directText = directTextResult.status === 'fulfilled' ? directTextResult.value : null;
      ocrPathResult = ocrResult.status === 'fulfilled' ? ocrResult.value : { text: '', confidence: null };

      console.log('Direct text length:', directText ? directText.length : 0);
      console.log('OCR text length:', ocrPathResult.text.length);

      ocrText = directText || ocrPathResult.text;
      ocrConfidence = directText ? null : ocrPathResult.confidence;

      if (!ocrText) {
        console.warn('OCR failed: no text extracted from the uploaded document');
        return res.status(422).json({
          message: 'OCR could not extract any readable text. Please try a higher-resolution scan or upload a clearer document.',
          ocrResult: {
            text: '',
            confidence: ocrPathResult.confidence,
            source,
            contentType,
            directText,
            ocrTextRaw: ocrPathResult?.text || '',
            fields: {}
          }
        });
      }
    } else {
      source = 'image';
      console.log('Image file detected, running Tesseract OCR...');
      const preprocessed = await preprocessImageForOCR(buffer);
      console.log('Image preprocessed, buffer size:', preprocessed.length);

      const worker = await getOcrWorker();
      console.log('Starting image OCR pass 1');
      const data1 = await worker.recognize(buffer);
      console.log('Completed image OCR pass 1');

      console.log('Starting image OCR pass 2');
      const data2 = await worker.recognize(preprocessed);
      console.log('Completed image OCR pass 2');

      const text1 = data1.data.text.trim();
      const conf1 = data1.data.confidence ?? 0;
      const text2 = data2.data.text.trim();
      const conf2 = data2.data.confidence ?? 0;

      if (Math.abs(conf2 - conf1) > 2) {
        if (conf2 > conf1) {
          ocrText = text2;
          ocrConfidence = conf2;
        } else {
          ocrText = text1;
          ocrConfidence = conf1;
        }
      } else {
        ocrText = text2.length > text1.length ? text2 : text1;
        ocrConfidence = Math.max(conf1, conf2);
      }

      console.log('Image OCR completed, text length:', ocrText.length, 'confidence:', ocrConfidence);
    }

    const directFields = extractByType(docType, directText || '');
    const rawText = cleanOcrText(ocrPathResult?.text || ocrText || directText || '');
    const ocrFields = extractByType(docType, rawText);
    const mergedFields = { ...ocrFields, ...directFields };

    console.log('Direct fields:', JSON.stringify(directFields, null, 2));
    console.log('OCR fields:', JSON.stringify(ocrFields, null, 2));
    console.log('Merged fields:', JSON.stringify(mergedFields, null, 2));

    res.status(200).json({
      ocrResult: {
        text: ocrText,
        rawText,
        confidence: ocrConfidence,
        source,
        contentType,
        directText,
        ocrTextRaw: ocrPathResult?.text || '',
        fields: mergedFields
      }
    });
  } catch (error) {
    console.error('OCR endpoint error:', error);
    res.status(500).json({ message: error.message || 'Failed to run OCR' });
  }
};

const submitKYC = async (req, res) => {
  try {
    const {
      email,
      fullName,
      aadhaarNumber,
      aadhaarName,
      dob,
      address,
      vcAadhaarNumber,
      vcHolderName,
      vcIssuer
    } = req.body;

    if (!email || !aadhaarNumber) {
      return res.status(400).json({ message: 'Email and Aadhaar number are required' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        email,
        fullName: fullName || '',
        'kyc.aadhaarNumberHash': hashValue(aadhaarNumber.trim()),
        'kyc.aadhaarName': aadhaarName || '',
        'kyc.dob': dob || '',
        'kyc.address': address || '',
        'kyc.vcAadhaarNumberHash': hashValue(vcAadhaarNumber?.trim() || aadhaarNumber.trim()),
        'kyc.vcHolderName': vcHolderName || aadhaarName || '',
        'kyc.vcIssuer': vcIssuer || 'Demo VC',
        'kyc.submittedAt': new Date(),
        'kyc.status': 'matched'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'KYC data saved with demo VC credential', kycStatus: 'matched', user });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit KYC' });
  }
};

const submitPropertyVerification = async (req, res) => {
  try {
    const { email, propertyId, title, contractId, documents } = req.body;
    if (!email || !propertyId || !Array.isArray(documents)) {
      return res.status(400).json({ message: 'Email, propertyId, and documents are required' });
    }

    const formattedDocs = documents.map((doc) => ({
      type: doc.type,
      uploaded: !!doc.uploaded,
      verified: !!doc.verified
    }));

    const allUploaded = formattedDocs.every((doc) => doc.uploaded);
    const status = allUploaded ? 'approved' : 'pending';

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingProperty = user.propertyVerification.find((prop) => prop.propertyId === propertyId);
    if (existingProperty) {
      existingProperty.title = title || existingProperty.title;
      existingProperty.contractId = contractId || existingProperty.contractId;
      existingProperty.documents = formattedDocs;
      existingProperty.status = status;
      existingProperty.submittedAt = new Date();
    } else {
      user.propertyVerification.push({
        propertyId,
        title: title || '',
        contractId: contractId || '',
        documents: formattedDocs,
        status,
        submittedAt: new Date()
      });
    }

    await user.save();

    const propertyRecord = user.propertyVerification.find((prop) => prop.propertyId === propertyId);
    res.status(200).json({
      message: 'Property verification updated',
      propertyStatus: propertyRecord.status,
      propertyVerification: user.propertyVerification
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit property documents' });
  }
};

const linkWallet = async (req, res) => {
  try {
    const { email, walletAddress } = req.body;
    if (!email || !walletAddress) {
      return res.status(400).json({ message: 'Email and wallet address are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.kyc.status !== 'matched') {
      return res.status(400).json({ message: 'KYC must be matched before linking a wallet' });
    }

    const lowerWallet = walletAddress.toLowerCase();
    const linkedWallets = user.linkedWallets.includes(lowerWallet)
      ? user.linkedWallets
      : [...user.linkedWallets, lowerWallet];

    user.walletAddress = lowerWallet;
    user.linkedWallets = linkedWallets;
    await user.save();

    res.status(200).json({ message: 'Wallet linked successfully', walletAddress: user.walletAddress });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to link wallet' });
  }
};

const recoverWallet = async (req, res) => {
  try {
    const { email, newWalletAddress } = req.body;
    if (!email || !newWalletAddress) {
      return res.status(400).json({ message: 'Email and new wallet address are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.kyc.status !== 'matched') {
      return res.status(400).json({ message: 'Recovery is allowed only after matched KYC' });
    }

    user.walletAddress = newWalletAddress.toLowerCase();
    user.linkedWallets = [...new Set([...(user.linkedWallets || []), newWalletAddress.toLowerCase()])];
    user.recovery.lastRequestAt = new Date();
    user.recovery.allowed = true;
    await user.save();

    res.status(200).json({ message: 'Wallet recovery record updated', walletAddress: user.walletAddress });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to recover wallet' });
  }
};

module.exports = {
  getUserStatus,
  registerOrUpdateUser,
  runAadhaarOCR,
  submitKYC,
  submitPropertyVerification,
  linkWallet,
  recoverWallet
};