// const sharp = require('sharp');
// const { createWorker } = require('tesseract.js');
// const canvas = require('@napi-rs/canvas');
// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// const Module = require('module');
// const originalLoad = Module._load;
// Module._load = function (request, parent, isMain) {
//   if (request === 'canvas') return canvas;
//   return originalLoad.call(this, request, parent, isMain);
// };

// global.Canvas = canvas.Canvas || canvas.createCanvas;
// global.Image = canvas.Image;
// global.ImageData = canvas.ImageData;
// global.DOMMatrix = canvas.DOMMatrix;
// global.DOMRect = canvas.DOMRect;
// global.DOMPoint = canvas.DOMPoint;

// pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

// let ocrWorkerPromise = null;

// const getOcrWorker = async () => {
//   if (!ocrWorkerPromise) {
//     ocrWorkerPromise = (async () => {
//       const workerInstance = await createWorker();
//       if (typeof workerInstance.loadLanguage === 'function') {
//         await workerInstance.loadLanguage('eng');
//       }
//       if (typeof workerInstance.initialize === 'function') {
//         await workerInstance.initialize('eng');
//       }
//       if (typeof workerInstance.setParameters === 'function') {
//         await workerInstance.setParameters({
//           tessedit_pageseg_mode: '3',
//           preserve_interword_spaces: '1',
//           user_defined_dpi: '300'
//         });
//       }
//       return workerInstance;
//     })();
//   }
//   return ocrWorkerPromise;
// };

// const preprocessImageForOCR = async (buffer) => {
//   const targetSize = 2800;
//   const image = sharp(buffer).rotate().flatten({ background: '#ffffff' });
//   const resizeOptions = {
//     width: targetSize,
//     height: targetSize,
//     fit: 'inside',
//     withoutEnlargement: false
//   };

//   return await image
//     .resize(resizeOptions)
//     .grayscale()
//     .normalise()
//     .gamma(1.1)
//     .sharpen({ sigma: 1.2 })
//     .median(1)
//     .threshold(170)
//     .png({ quality: 100 })
//     .toBuffer();
// };

// const extractDirectPdfText = async (buffer) => {
//   try {
//     const loadingTask = pdfjsLib.getDocument({ data: buffer });
//     const pdf = await loadingTask.promise;
//     const pages = Math.min(pdf.numPages, 10);

//     let fullText = '';
//     for (let pageNum = 1; pageNum <= pages; pageNum++) {
//       const page = await pdf.getPage(pageNum);
//       const textContent = await page.getTextContent();
//       const lines = {};

//       textContent.items.forEach((item) => {
//         const y = Math.round(item.transform[5]);
//         if (!lines[y]) lines[y] = [];
//         lines[y].push(item.str);
//       });

//       const sortedLines = Object.keys(lines)
//         .sort((a, b) => parseFloat(b) - parseFloat(a))
//         .map((y) => lines[y].join(' '));

//       fullText += sortedLines.join('\n') + '\n';
//     }

//     const trimmed = fullText.trim();
//     if (trimmed.length < 50) return null;
//     return trimmed;
//   } catch {
//     return null;
//   }
// };

// const extractPdfViaOcr = async (buffer) => {
//   const loadingTask = pdfjsLib.getDocument({ data: buffer });
//   const pdf = await loadingTask.promise;
//   const pages = Math.min(pdf.numPages, 10);

//   const worker = await getOcrWorker();
//   const pageTexts = [];
//   let maxConfidence = null;

//   for (let pageNum = 1; pageNum <= pages; pageNum++) {
//     const page = await pdf.getPage(pageNum);
//     const baseViewport = page.getViewport({ scale: 2 });
//     const minRenderWidth = 1200;
//     const minRenderHeight = 1200;
//     const renderScale = Math.max(
//       4,
//       Math.ceil(minRenderWidth / baseViewport.width),
//       Math.ceil(minRenderHeight / baseViewport.height)
//     );
//     const viewport = page.getViewport({ scale: renderScale });

//     const pdfCanvas = canvas.createCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
//     const context = pdfCanvas.getContext('2d');
//     context.fillStyle = '#ffffff';
//     context.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);

//     await page.render({ canvasContext: context, viewport }).promise;

//     const originalBuffer = pdfCanvas.toBuffer('image/png');
//     const preprocessedBuffer = await preprocessImageForOCR(originalBuffer);

//     const pass1 = await worker.recognize(originalBuffer);
//     const pass2 = await worker.recognize(preprocessedBuffer);

//     const text1 = pass1.data.text.trim();
//     const conf1 = pass1.data.confidence ?? 0;
//     const text2 = pass2.data.text.trim();
//     const conf2 = pass2.data.confidence ?? 0;

//     let bestText = text1;
//     let bestConf = conf1;

//     if (Math.abs(conf2 - conf1) > 2) {
//       if (conf2 > conf1) {
//         bestText = text2;
//         bestConf = conf2;
//       }
//     } else if (text2.length > text1.length) {
//       bestText = text2;
//       bestConf = conf2;
//     }

//     pageTexts.push(bestText);
//     maxConfidence = maxConfidence === null ? bestConf : Math.max(maxConfidence, bestConf);
//   }

//   return { text: pageTexts.join('\n\n').trim(), confidence: maxConfidence };
// };

// const cleanOcrText = (text) => {
//   if (!text) return '';

//   let cleaned = text.replace(/\r\n/g, '\n');
//   cleaned = cleaned.replace(/\u200B/g, '');
//   cleaned = cleaned.replace(/[^\n -~]/g, ' ');
//   cleaned = cleaned.replace(/\t+/g, ' ');
//   cleaned = cleaned.replace(/\s*([,;:@|\/()\-])\s*/g, '$1 ');
//   cleaned = cleaned.replace(/ {2,}/g, ' ');
//   cleaned = cleaned.replace(/[ ]+-[ ]+/g, ' - ');
//   cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

//   cleaned = cleaned
//     .split('\n')
//     .map((line) => {
//       let trimmed = line.trim();
//       trimmed = trimmed.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
//       trimmed = trimmed.replace(/ {2,}/g, ' ');
//       return trimmed;
//     })
//     .filter((line) => {
//       if (!line) return false;
//       const alphaNumericCount = (line.match(/[A-Za-z0-9]/g) || []).length;
//       if (alphaNumericCount === 0) return false;
//       if (line.length < 5 && alphaNumericCount / line.length < 0.5) return false;
//       return true;
//     })
//     .join('\n');

//   return cleaned.trim();
// };

// const basicNormalizeText = (text) => {
//   if (!text) return '';
//   let cleaned = String(text).replace(/\r\n/g, '\n');
//   cleaned = cleaned.replace(/\u200B/g, '');
//   cleaned = cleaned.replace(/[^\n -~]/g, ' ');
//   cleaned = cleaned.replace(/\t+/g, ' ');
//   cleaned = cleaned.replace(/ {2,}/g, ' ');
//   cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
//   return cleaned.trim();
// };

// const normalizeDocType = (docType) => {
//   const t = String(docType || '').trim().toUpperCase();
//   if (['SALE_DEED', 'SALEDEED', 'DEED', 'SALE'].includes(t)) return 'SALE_DEED';
//   if (['POA', 'POWER_OF_ATTORNEY', 'POWEROFATTORNEY', 'ATTORNEY'].includes(t)) return 'POWER_OF_ATTORNEY';
//   if (['AFFIDAVIT', 'AFFIDAVT'].includes(t)) return 'AFFIDAVIT';
//   return 'UNKNOWN';
// };

// const normWhitespace = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// const parseMoneyINR = (raw) => {
//   const s = String(raw || '').replace(/\s+/g, '');
//   const m = s.match(/(\d[\d,]*)(\.\d+)?/);
//   if (!m) return null;
//   const num = Number((m[1] + (m[2] || '')).replace(/,/g, ''));
//   return Number.isFinite(num) ? num : null;
// };

// const parseDateToISO = (raw) => {
//   const s = String(raw || '').replace(/\s+/g, '').trim();
//   if (!s) return '';

//   // dd/mm/yyyy or dd-mm-yyyy
//   const dmy = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
//   if (dmy) {
//     const dd = dmy[1].padStart(2, '0');
//     const mm = dmy[2].padStart(2, '0');
//     const yyyy = dmy[3];
//     return `${yyyy}-${mm}-${dd}`;
//   }

//   // yyyy-mm-dd
//   const ymd = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
//   if (ymd) {
//     const yyyy = ymd[1];
//     const mm = ymd[2].padStart(2, '0');
//     const dd = ymd[3].padStart(2, '0');
//     return `${yyyy}-${mm}-${dd}`;
//   }

//   return '';
// };

// const firstMatch = (text, regex) => {
//   const m = String(text || '').match(regex);
//   return m ? normWhitespace(m[1]) : '';
// };

// const buildField = (value, confidence, method, rawMatches) => ({
//   value: value ?? '',
//   confidence: typeof confidence === 'number' ? confidence : null,
//   method: method || 'unknown',
//   rawMatches: rawMatches || []
// });

// const extractSaleDeedFields = (text) => {
//   const raw = String(text || '');

//   const seller = firstMatch(raw, /\b(?:SELLER|VENDOR|EXECUTANT)\b[\s:;\-]*([A-Z][A-Z .,'()\/-]{5,})/i);
//   const buyer = firstMatch(raw, /\b(?:BUYER|PURCHASER|VENDEE|CLAIMANT)\b[\s:;\-]*([A-Z][A-Z .,'()\/-]{5,})/i);

//   const regNoRaw =
//     firstMatch(raw, /\bREG(?:ISTRATION)?\s*(?:NO\.?|NUMBER)\b[\s:;\-]*([\s\S]{4,80}?)(?=\bREG(?:ISTRATION)?\s*DATE\b|\n|$)/i) ||
//     firstMatch(raw, /\bDOC(?:UMENT)?\s*NO\.?\b[\s:;\-]*([\s\S]{4,80}?)(?=\bREG(?:ISTRATION)?\s*DATE\b|\n|$)/i);
//   const regNo = regNoRaw ? regNoRaw.replace(/\s+/g, '').replace(/[^\w\/\-]/g, '') : '';

//   const regDateRaw =
//     firstMatch(raw, /\bREG(?:ISTRATION)?\s*DATE\b[\s:;\-]*(\d{1,2}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{4})/i) ||
//     firstMatch(raw, /\bDATED\b[\s:;\-]*(\d{1,2}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{4})/i) ||
//     firstMatch(raw, /\bDATE\b[\s:;\-]*(\d{1,2}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{4})/i);
//   const regDate = parseDateToISO(regDateRaw);

//   const considerationRaw =
//     firstMatch(raw, /\bTOTAL\s+CONSIDERATION\b[\s\S]{0,40}?(\d[\d,\s]{3,})(?=\(|\n|$)/i) ||
//     firstMatch(raw, /\b(?:CONSIDERATION|SALE\s+CONSIDERATION)\b[^\d]{0,60}(\d[\d,\s]{3,})(?=\(|\n|$)/i) ||
//     firstMatch(raw, /\bAMOUNT\b[^\d]{0,60}(\d[\d,\s]{3,})(?=\(|\n|$)/i);
//   const consideration = parseMoneyINR(considerationRaw);

//   const surveyNoRaw = firstMatch(raw, /\b(?:SURVEY\s*NO\.?|S\.?\s*NO\.?)\b[\s:;\-]*([A-Za-z0-9\/\-\s]+?)(?=\s|,|\.|\)|\n|$)/i);
//   const surveyNo = surveyNoRaw ? surveyNoRaw.replace(/\s+/g, '') : '';
//   const khataNoRaw = firstMatch(raw, /\b(?:KHATA\s*NO\.?|KHATA)\b[\s:;\-]*([A-Za-z0-9\/\-\s]+?)(?=\s|,|\.|\)|\n|$)/i);
//   const khataNo = khataNoRaw ? khataNoRaw.replace(/\s+/g, '') : '';
//   const siteNoRaw = firstMatch(raw, /\b(?:SITE\s*NO\.?|PLOT\s*NO\.?)\b[\s:;\-]*([A-Za-z0-9\/\-\s]+?)(?=\s|,|\.|\)|\n|$)/i);
//   const siteNo = siteNoRaw ? siteNoRaw.replace(/\s+/g, '') : '';
//   const sro = firstMatch(raw, /\b(?:SUB-?REGISTRAR(?:\s*OFFICE)?|SRO)\b[\s:;\-]*([\s\S]{5,80}?)(?=\bTOTAL\s+CONSIDERATION\b|\n|$)/i);

//   const propertyAddress =
//     firstMatch(raw, /\b(?:PROPERTY\s*ADDRESS|ADDRESS\s*OF\s*PROPERTY)\b[\s:;\-]*([^\n]{10,})/i) ||
//     firstMatch(raw, /\b(?:PROPERTY\s*DESCRIPTION)\b[\s:;\-]*([^\n]{10,})/i) ||
//     firstMatch(raw, /\b(?:SCHEDULE\s*[A-Z]?)\b[\s:;\-]*([^\n]{10,})/i);

//   return {
//     sellerName: buildField(seller, seller ? 0.72 : null, 'regex', seller ? [seller] : []),
//     buyerName: buildField(buyer, buyer ? 0.72 : null, 'regex', buyer ? [buyer] : []),
//     registrationNumber: buildField(regNo, regNo ? 0.78 : null, 'regex', regNoRaw ? [regNoRaw] : []),
//     registrationDate: buildField(regDate || regDateRaw, regDate || regDateRaw ? 0.7 : null, 'regex+normalize', regDateRaw ? [regDateRaw] : []),
//     considerationAmount: buildField(consideration ?? considerationRaw, considerationRaw ? 0.66 : null, 'regex+money-parse', considerationRaw ? [considerationRaw] : []),
//     surveyNo: buildField(surveyNo, surveyNo ? 0.68 : null, 'regex', surveyNo ? [surveyNo] : []),
//     khataNo: buildField(khataNo, khataNo ? 0.68 : null, 'regex', khataNo ? [khataNo] : []),
//     siteNo: buildField(siteNo, siteNo ? 0.68 : null, 'regex', siteNo ? [siteNo] : []),
//     subRegistrarOffice: buildField(sro, sro ? 0.6 : null, 'regex', sro ? [sro] : []),
//     propertyAddress: buildField(propertyAddress, propertyAddress ? 0.55 : null, 'regex', propertyAddress ? [propertyAddress] : [])
//   };
// };

// const extractPoaFields = (text) => {
//   const raw = String(text || '');

//   const principal =
//     firstMatch(raw, /\b(?:PRINCIPAL|EXECUTANT|DONOR)\b[\s:;\-]*([A-Z][A-Z .,'()\/-]{5,})/i) ||
//     firstMatch(raw, /\bI,\s*([A-Z][A-Z .,'()\/-]{5,})\b/i);
//   const agent =
//     firstMatch(raw, /\b(?:ATTORNEY\s*\/\s*AGENT|ATTORNEY|AGENT|DONEE)\b\s*[:\-]\s*([A-Z][A-Z .,'()\/-]{5,})/i) ||
//     firstMatch(raw, /\b(?:ATTORNEY\s*\/\s*AGENT|ATTORNEY|AGENT|DONEE)\b[\s:;\-]{1,6}([A-Z][A-Z .,'()\/-]{5,})/i);

//   const poaType =
//     firstMatch(raw, /\b(SPECIAL\s+POWER\s+OF\s+ATTORNEY|GENERAL\s+POWER\s+OF\s+ATTORNEY)\b/i) ||
//     firstMatch(raw, /\b(POWER\s+OF\s+ATTORNEY)\b/i);

//   const execDateRaw =
//     firstMatch(raw, /\b(?:DATED|DATE)\b[\s:;\-]*([0-9\/\-.]{8,})/i) ||
//     firstMatch(raw, /\bEXECUTED\s+ON\b[\s:;\-]*([0-9\/\-.]{8,})/i);
//   const execDate = parseDateToISO(execDateRaw);

//   const propertyRef =
//     firstMatch(raw, /\b(?:PROPERTY|SCHEDULE)\b[\s:;\-]*([^\n]{10,})/i) ||
//     firstMatch(raw, /\b(?:SURVEY\s*NO\.?|S\.?\s*NO\.?)\b[\s:;\-]*([A-Za-z0-9\/\-]+)\b/i);

//   return {
//     principalName: buildField(principal, principal ? 0.72 : null, 'regex', principal ? [principal] : []),
//     agentName: buildField(agent, agent ? 0.7 : null, 'regex', agent ? [agent] : []),
//     poaType: buildField(poaType, poaType ? 0.75 : null, 'regex', poaType ? [poaType] : []),
//     executionDate: buildField(execDate || execDateRaw, execDate || execDateRaw ? 0.66 : null, 'regex+normalize', execDateRaw ? [execDateRaw] : []),
//     propertyReference: buildField(propertyRef, propertyRef ? 0.55 : null, 'regex', propertyRef ? [propertyRef] : [])
//   };
// };

// const extractAffidavitFields = (text) => {
//   const raw = String(text || '');

//   const deponent =
//     firstMatch(raw, /\b(?:DEPONENT|DEPOSER)\b[\s:;\-]*([A-Z][A-Z .,'()\/-]{5,})/i) ||
//     firstMatch(raw, /\bI,\s*([A-Z][A-Z .,'()\/-]{5,})\b/i);
//   const parentSpouse = firstMatch(raw, /\b(?:S\/O|W\/O|D\/O)\b[\s:;\-]*([A-Z][A-Z .,'()\/-]{5,})/i);
//   const address = firstMatch(raw, /\b(?:R\/O|RESIDING\s+AT|ADDRESS)\b[\s:;\-]*([^\n]{10,})/i);

//   const place = firstMatch(raw, /\bPLACE\b[\s:;\-]*([A-Za-z .,'()\/-]{3,})/i);
//   const dateRaw = firstMatch(raw, /\bDATE\b[\s:;\-]*([0-9\/\-.]{8,})/i);
//   const dateIso = parseDateToISO(dateRaw);

//   const containsAffirmation = /solemnly\s+(affirm|declare)/i.test(raw) || /\bAFFIDAVIT\b/i.test(raw);

//   return {
//     deponentName: buildField(deponent, deponent ? 0.72 : null, 'regex', deponent ? [deponent] : []),
//     fatherOrSpouseName: buildField(parentSpouse, parentSpouse ? 0.6 : null, 'regex', parentSpouse ? [parentSpouse] : []),
//     address: buildField(address, address ? 0.55 : null, 'regex', address ? [address] : []),
//     place: buildField(place, place ? 0.55 : null, 'regex', place ? [place] : []),
//     date: buildField(dateIso || dateRaw, dateIso || dateRaw ? 0.66 : null, 'regex+normalize', dateRaw ? [dateRaw] : []),
//     hasAffirmationLanguage: buildField(containsAffirmation ? 'yes' : 'no', 0.8, 'keyword', [])
//   };
// };

// const extractFieldsByDocType = (docType, cleanText) => {
//   switch (normalizeDocType(docType)) {
//     case 'SALE_DEED':
//       return extractSaleDeedFields(cleanText);
//     case 'POWER_OF_ATTORNEY':
//       return extractPoaFields(cleanText);
//     case 'AFFIDAVIT':
//       return extractAffidavitFields(cleanText);
//     default:
//       return {};
//   }
// };

// const validateByDocType = (docType, fields, cleanText) => {
//   const t = normalizeDocType(docType);
//   const issues = [];

//   const requireField = (field, label) => {
//     const v = fields?.[field]?.value;
//     if (v === undefined || v === null || String(v).trim() === '') {
//       issues.push({ code: 'MISSING_FIELD', field, message: `${label} is required`, severity: 'error' });
//     }
//   };

//   const lowConfidence = (field, threshold) => {
//     const c = fields?.[field]?.confidence;
//     const v = fields?.[field]?.value;
//     if (v && typeof c === 'number' && c < threshold) {
//       issues.push({ code: 'LOW_CONFIDENCE', field, message: `${field} confidence is low`, severity: 'warn', confidence: c });
//     }
//   };

//   if (t === 'SALE_DEED') {
//     requireField('buyerName', 'Buyer name');
//     requireField('sellerName', 'Seller name');
//     requireField('registrationDate', 'Registration date');
//     requireField('registrationNumber', 'Registration number');
//     requireField('considerationAmount', 'Consideration amount');

//     const hasAnyPropertyId = !!(
//       String(fields?.surveyNo?.value || '').trim() ||
//       String(fields?.khataNo?.value || '').trim() ||
//       String(fields?.siteNo?.value || '').trim()
//     );
//     if (!hasAnyPropertyId) {
//       issues.push({
//         code: 'MISSING_FIELD_GROUP',
//         field: 'propertyIdentifiers',
//         message: 'At least one of surveyNo/khataNo/siteNo should be present',
//         severity: 'error'
//       });
//     }

//     lowConfidence('buyerName', 0.6);
//     lowConfidence('sellerName', 0.6);
//     lowConfidence('considerationAmount', 0.6);
//   } else if (t === 'POWER_OF_ATTORNEY') {
//     requireField('principalName', 'Principal name');
//     requireField('agentName', 'Agent name');
//     requireField('poaType', 'POA type');
//     requireField('executionDate', 'Execution date');

//     const isSpecial = /special/i.test(String(fields?.poaType?.value || ''));
//     if (isSpecial) requireField('propertyReference', 'Property reference');

//     lowConfidence('principalName', 0.6);
//     lowConfidence('agentName', 0.6);
//   } else if (t === 'AFFIDAVIT') {
//     requireField('deponentName', 'Deponent name');
//     requireField('address', 'Address');

//     if (!/solemnly\s+(affirm|declare)/i.test(cleanText || '')) {
//       issues.push({
//         code: 'MISSING_KEY_PHRASE',
//         field: 'hasAffirmationLanguage',
//         message: 'Expected affidavit language like “solemnly affirm/declare” not found',
//         severity: 'warn'
//       });
//     }

//     lowConfidence('deponentName', 0.6);
//   } else {
//     issues.push({
//       code: 'UNKNOWN_DOC_TYPE',
//       field: 'docType',
//       message: 'docType must be SALE_DEED, POWER_OF_ATTORNEY (POA), or AFFIDAVIT',
//       severity: 'error'
//     });
//   }

//   // simple scoring
//   const errorCount = issues.filter((i) => i.severity === 'error').length;
//   const warnCount = issues.filter((i) => i.severity === 'warn').length;
//   const score = Math.max(0, 100 - errorCount * 25 - warnCount * 8);

//   return { passed: errorCount === 0, score, issues };
// };

// const extractTextFromUploaded = async ({ buffer, contentType }) => {
//   const ct = String(contentType || '').toLowerCase();

//   if (ct.includes('pdf')) {
//     const [directText, ocrResult] = await Promise.all([
//       extractDirectPdfText(buffer),
//       extractPdfViaOcr(buffer)
//     ]);

//     const finalText = directText || ocrResult.text;
//     const confidence = directText ? null : ocrResult.confidence;
//     return {
//       source: 'pdf',
//       directPdfText: directText,
//       ocrText: ocrResult.text,
//       finalText,
//       ocrConfidence: confidence
//     };
//   }

//   const worker = await getOcrWorker();
//   const preprocessed = await preprocessImageForOCR(buffer);
//   const pass1 = await worker.recognize(buffer);
//   const pass2 = await worker.recognize(preprocessed);

//   const text1 = pass1.data.text.trim();
//   const conf1 = pass1.data.confidence ?? 0;
//   const text2 = pass2.data.text.trim();
//   const conf2 = pass2.data.confidence ?? 0;

//   let bestText = text1;
//   let bestConf = conf1;
//   if (Math.abs(conf2 - conf1) > 2) {
//     if (conf2 > conf1) {
//       bestText = text2;
//       bestConf = conf2;
//     }
//   } else if (text2.length > text1.length) {
//     bestText = text2;
//     bestConf = conf2;
//   } else {
//     bestConf = Math.max(conf1, conf2);
//   }

//   return {
//     source: 'image',
//     directPdfText: null,
//     ocrText: bestText,
//     finalText: bestText,
//     ocrConfidence: bestConf
//   };
// };

// const getBufferFromRequest = (req) => {
//   if (req.file?.buffer) {
//     return {
//       buffer: req.file.buffer,
//       contentType: req.file.mimetype,
//       originalName: req.file.originalname || 'uploaded-file'
//     };
//   }

//   if (req.body?.data) {
//     return {
//       buffer: Buffer.from(req.body.data, 'base64'),
//       contentType: req.body.mimeType || 'application/pdf',
//       originalName: req.body.fileName || 'base64-upload'
//     };
//   }

//   return null;
// };

// const extractPropertyDoc = async (req, res) => {
//   try {
//     const payload = getBufferFromRequest(req);
//     if (!payload) {
//       return res.status(400).json({ message: 'File (multipart field "document") or base64 (body.data) is required' });
//     }

//     const docType = normalizeDocType(req.body?.docType || req.body?.type || 'UNKNOWN');
//     const textResult = await extractTextFromUploaded(payload);
//     const bestText = textResult.directPdfText || textResult.finalText || '';
//     const cleanText = cleanOcrText(bestText);
//     const parseText = basicNormalizeText(bestText);

//     const fields = extractFieldsByDocType(docType, parseText);

//     return res.status(200).json({
//       docType,
//       source: textResult.source,
//       fileName: payload.originalName,
//       contentType: payload.contentType,
//       text: {
//         final: cleanText,
//         directPdfText: textResult.directPdfText,
//         ocrText: textResult.ocrText,
//         confidence: textResult.ocrConfidence
//       },
//       fields
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message || 'Failed to extract property document' });
//   }
// };

// const validatePropertyDoc = async (req, res) => {
//   try {
//     const docType = normalizeDocType(req.body?.docType || req.body?.type || 'UNKNOWN');
//     const cleanText = String(req.body?.text || req.body?.cleanText || '');
//     const fields = req.body?.fields || {};

//     const result = validateByDocType(docType, fields, cleanText);
//     return res.status(200).json({ docType, ...result });
//   } catch (error) {
//     return res.status(500).json({ message: error.message || 'Failed to validate property document' });
//   }
// };

// const extractAndValidatePropertyDoc = async (req, res) => {
//   try {
//     const payload = getBufferFromRequest(req);
//     if (!payload) {
//       return res.status(400).json({ message: 'File (multipart field "document") or base64 (body.data) is required' });
//     }

//     const docType = normalizeDocType(req.body?.docType || req.body?.type || 'UNKNOWN');
//     const textResult = await extractTextFromUploaded(payload);
//     const bestText = textResult.directPdfText || textResult.finalText || '';
//     const cleanText = cleanOcrText(bestText);
//     const parseText = basicNormalizeText(bestText);
//     const fields = extractFieldsByDocType(docType, parseText);
//     const validation = validateByDocType(docType, fields, parseText);

//     return res.status(200).json({
//       docType,
//       source: textResult.source,
//       fileName: payload.originalName,
//       contentType: payload.contentType,
//       text: {
//         final: cleanText,
//         directPdfText: textResult.directPdfText,
//         ocrText: textResult.ocrText,
//         confidence: textResult.ocrConfidence
//       },
//       fields,
//       validation
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message || 'Failed to extract+validate property document' });
//   }
// };

// module.exports = {
//   extractPropertyDoc,
//   validatePropertyDoc,
//   extractAndValidatePropertyDoc
// };

const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const canvas = require('@napi-rs/canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

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
  const resizeOptions = {
    width: targetSize,
    height: targetSize,
    fit: 'inside',
    withoutEnlargement: false
  };

  return await image
    .resize(resizeOptions)
    .grayscale()
    .normalise()
    .gamma(1.1)
    .sharpen({ sigma: 1.2 })
    .median(1)
    .threshold(170)
    .png({ quality: 100 })
    .toBuffer();
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
    if (trimmed.length < 50) return null;
    return trimmed;
  } catch {
    return null;
  }
};

const extractPdfViaOcr = async (buffer) => {
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

    const pdfCanvas = canvas.createCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
    const context = pdfCanvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);

    await page.render({ canvasContext: context, viewport }).promise;

    const originalBuffer = pdfCanvas.toBuffer('image/png');
    const preprocessedBuffer = await preprocessImageForOCR(originalBuffer);

    const pass1 = await worker.recognize(originalBuffer);
    const pass2 = await worker.recognize(preprocessedBuffer);

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
  }

  return { text: pageTexts.join('\n\n').trim(), confidence: maxConfidence };
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

const basicNormalizeText = (text) => {
  if (!text) return '';
  let cleaned = String(text).replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\u200B/g, '');
  cleaned = cleaned.replace(/[^\n -~]/g, ' ');
  cleaned = cleaned.replace(/\t+/g, ' ');
  cleaned = cleaned.replace(/ {2,}/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
};

const normalizeDocType = (docType) => {
  const t = String(docType || '').trim().toUpperCase();
  if (['SALE_DEED', 'SALEDEED', 'DEED', 'SALE'].includes(t)) return 'SALE_DEED';
  if (['POA', 'POWER_OF_ATTORNEY', 'POWEROFATTORNEY', 'ATTORNEY'].includes(t)) return 'POWER_OF_ATTORNEY';
  if (['AFFIDAVIT', 'AFFIDAVT'].includes(t)) return 'AFFIDAVIT';
  return 'UNKNOWN';
};

const normWhitespace = (s) => String(s || '').replace(/\s+/g, ' ').trim();

const parseMoneyINR = (raw) => {
  const s = String(raw || '').replace(/\s+/g, '');
  const m = s.match(/(\d[\d,]*)(\.\d+)?/);
  if (!m) return null;
  const num = Number((m[1] + (m[2] || '')).replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
};

const parseDateToISO = (raw) => {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';

  // Clean ordinal suffixes
  const cleanedStr = s.replace(/(\d+)(st|nd|rd|th)/ig, '$1').replace(/,/g, '');

  // Text month parsing (e.g. 28 Apr 2026)
  if (/[a-zA-Z]/.test(cleanedStr)) {
    const d = new Date(cleanedStr);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const dmy = cleanedStr.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // yyyy-mm-dd
  const ymd = cleanedStr.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = ymd[2].padStart(2, '0');
    const dd = ymd[3].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
};

const firstMatch = (text, regex) => {
  const m = String(text || '').match(regex);
  return m ? normWhitespace(m[1]) : '';
};

const buildField = (value, confidence, method, rawMatches) => ({
  value: value ?? '',
  confidence: typeof confidence === 'number' ? confidence : null,
  method: method || 'unknown',
  rawMatches: rawMatches || []
});

const extractSaleDeedFields = (text) => {
  const raw = String(text || '');

  const seller =
    firstMatch(raw, /\b(?:BETWEEN)\b\s*(?:MR\.|MRS\.|MS\.|M\/S\.?)?\s*([A-Z][A-Za-z\s.]{3,40})(?:,|\s+S\/O|\s+W\/O|\s+D\/O|\s+AGED)/i) ||
    firstMatch(raw, /\b(?:SELLER|VENDOR|EXECUTANT)\b[\s:;\-]*([A-Z][A-Za-z\s.]{3,40})(?:,|\n|$)/i);

  const buyer =
    firstMatch(raw, /\b(?:AND)\b\s*(?:MR\.|MRS\.|MS\.|M\/S\.?)?\s*([A-Z][A-Za-z\s.]{3,40})(?:,|\s+S\/O|\s+W\/O|\s+D\/O|\s+AGED)/i) ||
    firstMatch(raw, /\b(?:BUYER|PURCHASER|VENDEE|CLAIMANT)\b[\s:;\-]*([A-Z][A-Za-z\s.]{3,40})(?:,|\n|$)/i);

  const regNoRaw =
    firstMatch(raw, /\bCertificate\s+No\.?[\s:~]*([A-Z0-9\-]{8,})/i) ||
    firstMatch(raw, /\bREG(?:ISTRATION)?\s*(?:NO\.?|NUMBER)\b[\s:;\-]*([A-Z0-9\/\-]{4,})/i) ||
    firstMatch(raw, /\bDOC(?:UMENT)?\s*NO\.?\b[\s:;\-]*([A-Z0-9\/\-]{4,})/i);
  const regNo = regNoRaw ? regNoRaw.replace(/\s+/g, '') : '';

  const regDateRaw =
    firstMatch(raw, /\bCertificate\s+Date\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i) ||
    firstMatch(raw, /\b(?:REGISTRATION\s*DATE|DATED?)\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i) ||
    firstMatch(raw, /(?:executed\s+at[^\n]+?on\s+this|on\s+this)\b\s+([0-9]{1,2}(?:th|st|nd|rd)?\s+day\s+of\s+[A-Za-z]+,?\s+[0-9]{4})/i) ||
    firstMatch(raw, /\bDATE\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i);
  const regDate = parseDateToISO(regDateRaw);

  const considerationRaw =
    firstMatch(raw, /(?:sum\s+of\s+Rs\.?|Rupees|INR)\s*([\d,\s]+)(?:\/|\s|Lakhs?|-|only|\()/i) ||
    firstMatch(raw, /\bTOTAL\s+CONSIDERATION\b[\s\S]{0,40}?(\d[\d,\s]{3,})/i) ||
    firstMatch(raw, /\b(?:CONSIDERATION|AMOUNT)\b[^\d]{0,60}?(\d[\d,\s]{3,})/i);
  const consideration = parseMoneyINR(considerationRaw);

  const surveyNoRaw = firstMatch(raw, /\b(?:SURVEY\s*NO\.?|S\.?\s*NO\.?)\b[\s:;\-]*([A-Za-z0-9\/\-]+)/i);
  const khataNoRaw = firstMatch(raw, /\b(?:KHATA\s*NO\.?|KHATA)\b[\s:;\-]*([A-Za-z0-9\/\-]+)/i);
  const siteNoRaw = firstMatch(raw, /\b(?:SITE\s*NO\.?|PLOT\s*NO\.?|FLAT\s*NO\.?)\b[\s:;\-]*([A-Za-z0-9\/\-]+)/i);

  let sro = firstMatch(raw, /(?:SUB-?REGISTRAR(?:\s*OFFICE)?|SRO)[\s:;\-]*([A-Za-z\s]{3,30})(?=\bTOTAL|\n|,|$)/i);
  if (!sro) sro = firstMatch(raw, /(?:mh-pune|mh-[a-z]+)\/\s*([A-Za-z\s]+)(?=\n|$)/i); // Fallback for eStamp routing codes

  const propertyAddress =
    firstMatch(raw, /(?:SCHEDULE\s*OF\s*PROPERTY|SCHEDULE\s*PROPERTY|PROPERTY\s*DESCRIPTION)[\s:]*\n?([^\n]{10,})/i) ||
    firstMatch(raw, /\b(?:PROPERTY\s*ADDRESS|ADDRESS\s*OF\s*PROPERTY)\b[\s:;\-]*([^\n]{10,})/i);

  return {
    sellerName: buildField(seller, seller ? 0.8 : null, 'regex', seller ? [seller] : []),
    buyerName: buildField(buyer, buyer ? 0.8 : null, 'regex', buyer ? [buyer] : []),
    registrationNumber: buildField(regNo, regNo ? 0.85 : null, 'regex', regNoRaw ? [regNoRaw] : []),
    registrationDate: buildField(regDate || regDateRaw, regDate || regDateRaw ? 0.8 : null, 'regex+normalize', regDateRaw ? [regDateRaw] : []),
    considerationAmount: buildField(consideration ?? considerationRaw, considerationRaw ? 0.8 : null, 'regex+money-parse', considerationRaw ? [considerationRaw] : []),
    surveyNo: buildField(surveyNoRaw, surveyNoRaw ? 0.75 : null, 'regex', surveyNoRaw ? [surveyNoRaw] : []),
    khataNo: buildField(khataNoRaw, khataNoRaw ? 0.75 : null, 'regex', khataNoRaw ? [khataNoRaw] : []),
    siteNo: buildField(siteNoRaw, siteNoRaw ? 0.75 : null, 'regex', siteNoRaw ? [siteNoRaw] : []),
    subRegistrarOffice: buildField(sro, sro ? 0.7 : null, 'regex', sro ? [sro] : []),
    propertyAddress: buildField(propertyAddress, propertyAddress ? 0.65 : null, 'regex', propertyAddress ? [propertyAddress] : [])
  };
};

const extractPoaFields = (text) => {
  const raw = String(text || '');

  const principal =
    firstMatch(raw, /\b(?:I,|By)\s+(?:MR\.|MRS\.|MS\.|M\/S\.?)?\s*([A-Z][A-Za-z\s.]{3,40})(?:,|\s+S\/O|\s+W\/O|\s+D\/O|\s+AGED)/i) ||
    firstMatch(raw, /\b(?:PRINCIPAL|EXECUTANT|DONOR)\b[\s:;\-]*([A-Z][A-Za-z\s.]{3,40})(?:,|\n|$)/i);

  const agent =
    firstMatch(raw, /\b(?:appoint)\b\s+(?:MR\.|MRS\.|MS\.|M\/S\.?)?\s*([A-Z][A-Za-z\s.]{3,40})(?:,|\s+S\/O|\s+W\/O|\s+D\/O|\s+AGED)/i) ||
    firstMatch(raw, /\b(?:ATTORNEY\s*\/\s*AGENT|ATTORNEY|AGENT|DONEE)\b[\s:;\-]{1,6}([A-Z][A-Za-z\s.]{3,40})(?:,|\n|$)/i);

  const poaType =
    firstMatch(raw, /\b(SPECIAL\s+POWER\s+OF\s+ATTORNEY|GENERAL\s+POWER\s+OF\s+ATTORNEY|POWER\s+OF\s+ATTORNEY)\b/i);

  const execDateRaw =
    firstMatch(raw, /\bCertificate\s+Date\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i) ||
    firstMatch(raw, /(?:executed\s+at[^\n]+?on\s+this|on\s+this)\b\s+([0-9]{1,2}(?:th|st|nd|rd)?\s+day\s+of\s+[A-Za-z]+,?\s+[0-9]{4})/i) ||
    firstMatch(raw, /\b(?:DATED|DATE)\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i) ||
    firstMatch(raw, /\bEXECUTED\s+ON\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i);
  const execDate = parseDateToISO(execDateRaw);

  const propertyRef =
    firstMatch(raw, /(?:SCHEDULE\s*OF\s*PROPERTY|SCHEDULE\s*PROPERTY|PROPERTY\s*DESCRIPTION)[\s:]*\n?([^\n]{10,})/i) ||
    firstMatch(raw, /\b(?:PROPERTY|SCHEDULE)\b[\s:;\-]*([^\n]{10,})/i) ||
    firstMatch(raw, /\b(?:SURVEY\s*NO\.?|S\.?\s*NO\.?)\b[\s:;\-]*([A-Za-z0-9\/\-]+)/i);

  return {
    principalName: buildField(principal, principal ? 0.8 : null, 'regex', principal ? [principal] : []),
    agentName: buildField(agent, agent ? 0.8 : null, 'regex', agent ? [agent] : []),
    poaType: buildField(poaType, poaType ? 0.85 : null, 'regex', poaType ? [poaType] : []),
    executionDate: buildField(execDate || execDateRaw, execDate || execDateRaw ? 0.8 : null, 'regex+normalize', execDateRaw ? [execDateRaw] : []),
    propertyReference: buildField(propertyRef, propertyRef ? 0.65 : null, 'regex', propertyRef ? [propertyRef] : [])
  };
};

const extractAffidavitFields = (text) => {
  const raw = String(text || '');

  const deponent =
    firstMatch(raw, /\b(?:I,|DEPONENT|DEPOSER)\b[\s:;\-]*([A-Z][A-Za-z\s.]{3,40})(?:,|\s+S\/O|\s+W\/O|\s+D\/O|\s+AGED)/i);
  
  const parentSpouse = 
    firstMatch(raw, /\b(?:S\/O|W\/O|D\/O)\b[\s:;\-]*([A-Z][A-Za-z\s.]{3,40})(?:,|\s+aged|\n)/i);
  
  const address = 
    firstMatch(raw, /\b(?:R\/O|RESIDING\s+AT|ADDRESS)\b[\s:;\-]*([^\n]{10,})/i);

  const place = 
    firstMatch(raw, /\bPLACE\b[\s:;\-]*([A-Za-z\s.]{3,})/i);
  
  const dateRaw =
    firstMatch(raw, /\bDATE\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i) ||
    firstMatch(raw, /\bCertificate\s+Date\b[\s:;\-]*([0-9]{1,2}[\s\/\-A-Za-z]+[0-9]{4})/i);
  const dateIso = parseDateToISO(dateRaw);

  const containsAffirmation = /solemnly\s+(affirm|declare)/i.test(raw) || /\bAFFIDAVIT\b/i.test(raw);

  return {
    deponentName: buildField(deponent, deponent ? 0.8 : null, 'regex', deponent ? [deponent] : []),
    fatherOrSpouseName: buildField(parentSpouse, parentSpouse ? 0.7 : null, 'regex', parentSpouse ? [parentSpouse] : []),
    address: buildField(address, address ? 0.65 : null, 'regex', address ? [address] : []),
    place: buildField(place, place ? 0.65 : null, 'regex', place ? [place] : []),
    date: buildField(dateIso || dateRaw, dateIso || dateRaw ? 0.8 : null, 'regex+normalize', dateRaw ? [dateRaw] : []),
    hasAffirmationLanguage: buildField(containsAffirmation ? 'yes' : 'no', 0.9, 'keyword', [])
  };
};

const extractFieldsByDocType = (docType, cleanText) => {
  switch (normalizeDocType(docType)) {
    case 'SALE_DEED':
      return extractSaleDeedFields(cleanText);
    case 'POWER_OF_ATTORNEY':
      return extractPoaFields(cleanText);
    case 'AFFIDAVIT':
      return extractAffidavitFields(cleanText);
    default:
      return {};
  }
};

const validateByDocType = (docType, fields, cleanText) => {
  const t = normalizeDocType(docType);
  const issues = [];

  const requireField = (field, label) => {
    const v = fields?.[field]?.value;
    if (v === undefined || v === null || String(v).trim() === '') {
      issues.push({ code: 'MISSING_FIELD', field, message: `${label} is required`, severity: 'error' });
    }
  };

  const lowConfidence = (field, threshold) => {
    const c = fields?.[field]?.confidence;
    const v = fields?.[field]?.value;
    if (v && typeof c === 'number' && c < threshold) {
      issues.push({ code: 'LOW_CONFIDENCE', field, message: `${field} confidence is low`, severity: 'warn', confidence: c });
    }
  };

  if (t === 'SALE_DEED') {
    requireField('buyerName', 'Buyer name');
    requireField('sellerName', 'Seller name');
    requireField('registrationDate', 'Registration date');
    requireField('registrationNumber', 'Registration number');
    requireField('considerationAmount', 'Consideration amount');

    const hasAnyPropertyId = !!(
      String(fields?.surveyNo?.value || '').trim() ||
      String(fields?.khataNo?.value || '').trim() ||
      String(fields?.siteNo?.value || '').trim()
    );
    if (!hasAnyPropertyId) {
      issues.push({
        code: 'MISSING_FIELD_GROUP',
        field: 'propertyIdentifiers',
        message: 'At least one of surveyNo/khataNo/siteNo should be present',
        severity: 'error'
      });
    }

    lowConfidence('buyerName', 0.6);
    lowConfidence('sellerName', 0.6);
    lowConfidence('considerationAmount', 0.6);
  } else if (t === 'POWER_OF_ATTORNEY') {
    requireField('principalName', 'Principal name');
    requireField('agentName', 'Agent name');
    requireField('poaType', 'POA type');
    requireField('executionDate', 'Execution date');

    const isSpecial = /special/i.test(String(fields?.poaType?.value || ''));
    if (isSpecial) requireField('propertyReference', 'Property reference');

    lowConfidence('principalName', 0.6);
    lowConfidence('agentName', 0.6);
  } else if (t === 'AFFIDAVIT') {
    requireField('deponentName', 'Deponent name');
    requireField('address', 'Address');

    if (!/solemnly\s+(affirm|declare)/i.test(cleanText || '')) {
      issues.push({
        code: 'MISSING_KEY_PHRASE',
        field: 'hasAffirmationLanguage',
        message: 'Expected affidavit language like “solemnly affirm/declare” not found',
        severity: 'warn'
      });
    }

    lowConfidence('deponentName', 0.6);
  } else {
    issues.push({
      code: 'UNKNOWN_DOC_TYPE',
      field: 'docType',
      message: 'docType must be SALE_DEED, POWER_OF_ATTORNEY (POA), or AFFIDAVIT',
      severity: 'error'
    });
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warn').length;
  const score = Math.max(0, 100 - errorCount * 25 - warnCount * 8);

  return { passed: errorCount === 0, score, issues };
};

const extractTextFromUploaded = async ({ buffer, contentType }) => {
  const ct = String(contentType || '').toLowerCase();

  if (ct.includes('pdf')) {
    const [directText, ocrResult] = await Promise.all([
      extractDirectPdfText(buffer),
      extractPdfViaOcr(buffer)
    ]);

    const finalText = directText || ocrResult.text;
    const confidence = directText ? null : ocrResult.confidence;
    return {
      source: 'pdf',
      directPdfText: directText,
      ocrText: ocrResult.text,
      finalText,
      ocrConfidence: confidence
    };
  }

  const worker = await getOcrWorker();
  const preprocessed = await preprocessImageForOCR(buffer);
  const pass1 = await worker.recognize(buffer);
  const pass2 = await worker.recognize(preprocessed);

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
  } else {
    bestConf = Math.max(conf1, conf2);
  }

  return {
    source: 'image',
    directPdfText: null,
    ocrText: bestText,
    finalText: bestText,
    ocrConfidence: bestConf
  };
};

const getBufferFromRequest = (req) => {
  if (req.file?.buffer) {
    return {
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname || 'uploaded-file'
    };
  }

  if (req.body?.data) {
    return {
      buffer: Buffer.from(req.body.data, 'base64'),
      contentType: req.body.mimeType || 'application/pdf',
      originalName: req.body.fileName || 'base64-upload'
    };
  }

  return null;
};

const extractPropertyDoc = async (req, res) => {
  try {
    const payload = getBufferFromRequest(req);
    if (!payload) {
      return res.status(400).json({ message: 'File (multipart field "document") or base64 (body.data) is required' });
    }

    const docType = normalizeDocType(req.body?.docType || req.body?.type || 'UNKNOWN');
    const textResult = await extractTextFromUploaded(payload);
    const bestText = textResult.directPdfText || textResult.finalText || '';
    const cleanText = cleanOcrText(bestText);
    const parseText = basicNormalizeText(bestText);

    const fields = extractFieldsByDocType(docType, parseText);

    return res.status(200).json({
      docType,
      source: textResult.source,
      fileName: payload.originalName,
      contentType: payload.contentType,
      text: {
        final: cleanText,
        directPdfText: textResult.directPdfText,
        ocrText: textResult.ocrText,
        confidence: textResult.ocrConfidence
      },
      fields
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to extract property document' });
  }
};

const validatePropertyDoc = async (req, res) => {
  try {
    const docType = normalizeDocType(req.body?.docType || req.body?.type || 'UNKNOWN');
    const cleanText = String(req.body?.text || req.body?.cleanText || '');
    const fields = req.body?.fields || {};

    const result = validateByDocType(docType, fields, cleanText);
    return res.status(200).json({ docType, ...result });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to validate property document' });
  }
};

const extractAndValidatePropertyDoc = async (req, res) => {
  try {
    const payload = getBufferFromRequest(req);
    if (!payload) {
      return res.status(400).json({ message: 'File (multipart field "document") or base64 (body.data) is required' });
    }

    const docType = normalizeDocType(req.body?.docType || req.body?.type || 'UNKNOWN');
    const textResult = await extractTextFromUploaded(payload);
    const bestText = textResult.directPdfText || textResult.finalText || '';
    const cleanText = cleanOcrText(bestText);
    const parseText = basicNormalizeText(bestText);
    const fields = extractFieldsByDocType(docType, parseText);
    const validation = validateByDocType(docType, fields, parseText);

    return res.status(200).json({
      docType,
      source: textResult.source,
      fileName: payload.originalName,
      contentType: payload.contentType,
      text: {
        final: cleanText,
        directPdfText: textResult.directPdfText,
        ocrText: textResult.ocrText,
        confidence: textResult.ocrConfidence
      },
      fields,
      validation
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to extract+validate property document' });
  }
};

module.exports = {
  extractPropertyDoc,
  validatePropertyDoc,
  extractAndValidatePropertyDoc
};