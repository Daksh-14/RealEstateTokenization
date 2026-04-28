// const fs = require('fs');
// const path = require('path');
// const { PDFDocument, StandardFonts } = require('pdf-lib');
// const sharp = require('sharp');
// const canvas = require('@napi-rs/canvas');

// const outDir = path.join(__dirname, '..', 'test-docs');

// const ensureDir = (p) => {
//   if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
// };

// const pickWritablePath = (dir, desiredFileName) => {
//   const ext = path.extname(desiredFileName);
//   const base = path.basename(desiredFileName, ext);
//   let candidate = path.join(dir, desiredFileName);
//   if (!fs.existsSync(candidate)) return candidate;

//   for (let i = 2; i < 50; i++) {
//     candidate = path.join(dir, `${base}-v${i}${ext}`);
//     if (!fs.existsSync(candidate)) return candidate;
//   }

//   const ts = new Date().toISOString().replace(/[:.]/g, '-');
//   return path.join(dir, `${base}-${ts}${ext}`);
// };

// const writeFileSafely = (dir, desiredFileName, bytes) => {
//   const outPath = pickWritablePath(dir, desiredFileName);
//   fs.writeFileSync(outPath, bytes);
//   return outPath;
// };

// const wrapText = (text, maxChars) => {
//   const words = String(text).split(/\s+/g);
//   const lines = [];
//   let line = '';
//   for (const w of words) {
//     if (!line) {
//       line = w;
//       continue;
//     }
//     if ((line + ' ' + w).length > maxChars) {
//       lines.push(line);
//       line = w;
//     } else {
//       line += ' ' + w;
//     }
//   }
//   if (line) lines.push(line);
//   return lines;
// };

// async function makePdf(fileName, title, bodyText) {
//   const pdfDoc = await PDFDocument.create();
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const page = pdfDoc.addPage([595.28, 841.89]); // A4

//   const margin = 48;
//   const fontSizeTitle = 14;
//   const fontSizeBody = 10.5;
//   let y = page.getHeight() - margin;

//   page.drawText(title, { x: margin, y, size: fontSizeTitle, font });
//   y -= 22;

//   const lines = wrapText(bodyText, 95);
//   for (const line of lines) {
//     if (y < margin + 20) {
//       y = page.getHeight() - margin;
//       pdfDoc.addPage([595.28, 841.89]);
//     }
//     page.drawText(line, { x: margin, y, size: fontSizeBody, font });
//     y -= 14;
//   }

//   const bytes = await pdfDoc.save();
//   return writeFileSafely(outDir, fileName, bytes);
// }

// const drawTextPageToPng = ({ title, bodyText, seed = 1 }) => {
//   // A4-ish at 200 DPI: 1654 x 2339
//   const width = 1654;
//   const height = 2339;
//   const margin = 120;

//   const cnv = canvas.createCanvas(width, height);
//   const ctx = cnv.getContext('2d');

//   // paper background
//   ctx.fillStyle = '#f8f5ef';
//   ctx.fillRect(0, 0, width, height);

//   // faint paper texture lines
//   ctx.globalAlpha = 0.06;
//   ctx.strokeStyle = '#b8b2a8';
//   for (let y = 0; y < height; y += 18) {
//     ctx.beginPath();
//     ctx.moveTo(0, y + ((seed * 7) % 4));
//     ctx.lineTo(width, y + ((seed * 7) % 4));
//     ctx.stroke();
//   }
//   ctx.globalAlpha = 1;

//   // title
//   ctx.fillStyle = '#1a1a1a';
//   ctx.font = 'bold 38px Arial';
//   ctx.fillText(title, margin, margin);

//   // body text
//   const bodyLines = wrapText(bodyText.replace(/\n+/g, ' ').trim(), 95);
//   ctx.font = '28px Arial';
//   const lineHeight = 42;
//   let y = margin + 70;

//   for (const line of bodyLines) {
//     if (y > height - margin) break;
//     ctx.fillText(line, margin, y);
//     y += lineHeight;
//   }

//   // a simple "stamp" block
//   ctx.save();
//   ctx.globalAlpha = 0.18;
//   ctx.strokeStyle = '#0b5aa7';
//   ctx.lineWidth = 6;
//   const stampX = width - margin - 420;
//   const stampY = height - margin - 260;
//   ctx.strokeRect(stampX, stampY, 420, 220);
//   ctx.font = 'bold 30px Arial';
//   ctx.fillStyle = '#0b5aa7';
//   ctx.fillText('RECEIVED', stampX + 120, stampY + 80);
//   ctx.font = '24px Arial';
//   ctx.fillText('SUB-REGISTRAR', stampX + 70, stampY + 130);
//   ctx.restore();

//   return cnv.toBuffer('image/png');
// };

// const makeScannedPdf = async (fileName, title, bodyText) => {
//   const png = drawTextPageToPng({ title, bodyText, seed: Math.floor(Math.random() * 10000) });

//   // Add scan/phone-like artifacts: slight rotate + noise + blur + jpeg artifacts + re-expand to png
//   const degraded = await sharp(png)
//     .rotate((Math.random() * 1.6 - 0.8), { background: { r: 248, g: 245, b: 239, alpha: 1 } })
//     .modulate({
//       brightness: 1 + (Math.random() * 0.06 - 0.03),
//       saturation: 1 - Math.random() * 0.1
//     })
//     .linear(1.02, -2)
//     .blur(0.35 + Math.random() * 0.25)
//     .jpeg({ quality: 55 + Math.floor(Math.random() * 15), chromaSubsampling: '4:2:0' })
//     .png()
//     .toBuffer();

//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([595.28, 841.89]); // A4 points
//   const img = await pdfDoc.embedPng(degraded);

//   // Fit image to page with small margin
//   const pageW = page.getWidth();
//   const pageH = page.getHeight();
//   const margin = 18;
//   const targetW = pageW - margin * 2;
//   const targetH = pageH - margin * 2;

//   const imgW = img.width;
//   const imgH = img.height;
//   const scale = Math.min(targetW / imgW, targetH / imgH);

//   const drawW = imgW * scale;
//   const drawH = imgH * scale;
//   const x = (pageW - drawW) / 2;
//   const y = (pageH - drawH) / 2;

//   page.drawImage(img, { x, y, width: drawW, height: drawH });

//   const bytes = await pdfDoc.save();
//   return writeFileSafely(outDir, fileName, bytes);
// };

// async function main() {
//   ensureDir(outDir);

//   const saleDeedText = `
// SALE DEED
// SELLER: SITA DEVI W/O RAMESH DEVI, Age 49 years, R/O 12, Lake View Road, Indiranagar, Bengaluru - 560038.
// BUYER: RAHUL KUMAR S/O ANIL KUMAR, Age 32 years, R/O 44, 3rd Cross, HSR Layout, Bengaluru - 560102.
// REGISTRATION NO: BNG/2024/11/SD/009812
// REGISTRATION DATE: 02/11/2024
// SUB-REGISTRAR OFFICE: SUB-REGISTRAR OFFICE, SHIVAJINAGAR
// TOTAL CONSIDERATION: INR 75,00,000 (Rupees Seventy Five Lakhs Only).

// PROPERTY DESCRIPTION (SCHEDULE A):
// All that piece and parcel of immovable property bearing SITE NO: 18, KHATA NO: 44/18,
// SURVEY NO: 92/3, situated at HSR Layout, Bengaluru, Karnataka.
// PROPERTY ADDRESS: Site No.18, HSR Layout, Bengaluru - 560102.
//   `.trim();

//   const poaText = `
// SPECIAL POWER OF ATTORNEY
// I, PRINCIPAL: MEERA SHARMA D/O VIJAY SHARMA, Age 41 years, R/O 21, Green Park, Pune - 411001,
// do hereby appoint ATTORNEY / AGENT: ARJUN SHARMA S/O RAJESH SHARMA, Age 35 years, R/O 7, MG Road, Pune - 411001,
// to act on my behalf in respect of the property described below.

// DATED: 15-08-2023

// PROPERTY / SCHEDULE:
// SURVEY NO: 120/2, PLOT NO: 7, situated at Baner, Pune, Maharashtra.
//   `.trim();

//   const affidavitText = `
// AFFIDAVIT
// I, DEPONENT: MOHAN DAS S/O RAGHAV DAS, Age 28 years,
// R/O 9, Sector 21, Chandigarh - 160022, do hereby solemnly affirm and declare as under:
// 1. That the statements made herein are true to the best of my knowledge and belief.
// 2. That this affidavit is executed for submission to the concerned authority for property verification purpose.

// PLACE: Chandigarh
// DATE: 10/01/2025
//   `.trim();

//   // Digital-text PDFs (fast parsing path)
//   const saleDigital = await makePdf('sale-deed-synthetic.pdf', 'Synthetic Sale Deed (Test)', saleDeedText);
//   const poaDigital = await makePdf('poa-synthetic.pdf', 'Synthetic Power of Attorney (Test)', poaText);
//   const affidavitDigital = await makePdf('affidavit-synthetic.pdf', 'Synthetic Affidavit (Test)', affidavitText);

//   // Scanned-style PDFs (forces OCR path)
//   const saleScanned = await makeScannedPdf('sale-deed-synthetic-scanned.pdf', 'Synthetic Sale Deed (Scanned Test)', saleDeedText);
//   const poaScanned = await makeScannedPdf('poa-synthetic-scanned.pdf', 'Synthetic Power of Attorney (Scanned Test)', poaText);
//   const affidavitScanned = await makeScannedPdf('affidavit-synthetic-scanned.pdf', 'Synthetic Affidavit (Scanned Test)', affidavitText);

//   const readme = `
// Synthetic PDFs generated (latest run):
// - ${path.basename(saleDigital)} (docType: SALE_DEED)
// - ${path.basename(saleScanned)} (docType: SALE_DEED, OCR)
// - ${path.basename(poaDigital)} (docType: POWER_OF_ATTORNEY or POA)
// - ${path.basename(poaScanned)} (docType: POWER_OF_ATTORNEY or POA, OCR)
// - ${path.basename(affidavitDigital)} (docType: AFFIDAVIT)
// - ${path.basename(affidavitScanned)} (docType: AFFIDAVIT, OCR)
//   `.trim() + '\n';

//   fs.writeFileSync(path.join(outDir, 'README.txt'), readme);
//   console.log('Generated synthetic PDFs in:', outDir);
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const canvas = require('@napi-rs/canvas');

const outDir = path.join(__dirname, '..', 'test-docs');

const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

const pickWritablePath = (dir, desiredFileName) => {
  const ext = path.extname(desiredFileName);
  const base = path.basename(desiredFileName, ext);
  let candidate = path.join(dir, desiredFileName);
  if (!fs.existsSync(candidate)) return candidate;

  for (let i = 2; i < 50; i++) {
    candidate = path.join(dir, `${base}-v${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(dir, `${base}-${ts}${ext}`);
};

const writeFileSafely = (dir, desiredFileName, bytes) => {
  const outPath = pickWritablePath(dir, desiredFileName);
  fs.writeFileSync(outPath, bytes);
  return outPath;
};

const wrapText = (text, maxChars) => {
  const words = String(text).split(/\s+/g);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (!line) {
      line = w;
      continue;
    }
    if ((line + ' ' + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line) lines.push(line);
  return lines;
};

async function makePdf(fileName, title, bodyText) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage([595.28, 841.89]); // A4

  const margin = 48;
  const fontSizeTitle = 14;
  const fontSizeBody = 10.5;
  let y = page.getHeight() - margin;

  page.drawText(title, { x: margin, y, size: fontSizeTitle, font });
  y -= 22;

  // Paragraph-aware text wrapping
  const lines = [];
  const paragraphs = bodyText.split('\n');
  for (const p of paragraphs) {
    if (!p.trim()) {
      lines.push(''); // Keep empty lines for spacing
      continue;
    }
    lines.push(...wrapText(p.trim(), 95));
  }

  for (const line of lines) {
    if (y < margin + 20) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = page.getHeight() - margin;
    }
    if (line !== '') {
      page.drawText(line, { x: margin, y, size: fontSizeBody, font });
    }
    y -= 14;
  }

  const bytes = await pdfDoc.save();
  return writeFileSafely(outDir, fileName, bytes);
}

const drawTextPageToPng = ({ title, bodyText, docType, seed = 1 }) => {
  // A4-ish at 200 DPI: 1654 x 2339
  const width = 1654;
  const height = 2339;
  const margin = 120;

  const cnv = canvas.createCanvas(width, height);
  const ctx = cnv.getContext('2d');

  // Paper background
  ctx.fillStyle = '#f8f5ef';
  ctx.fillRect(0, 0, width, height);

  // Faint paper texture lines
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#b8b2a8';
  for (let y = 0; y < height; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y + ((seed * 7) % 4));
    ctx.lineTo(width, y + ((seed * 7) % 4));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  let currentY = margin + 70;

  // Draw e-Stamp Paper Header for Legal Documents
  const isStampPaper = ['SALE_DEED', 'POA', 'AFFIDAVIT'].includes(docType);
  if (isStampPaper) {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    const stampH = 340;
    ctx.strokeRect(margin, margin, width - margin * 2, stampH);
    
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px serif';
    ctx.fillText('INDIA NON JUDICIAL', width / 2, margin + 45);
    ctx.font = 'bold 28px serif';
    ctx.fillText('Government of Maharashtra', width / 2, margin + 85);
    ctx.font = 'bold 32px serif';
    ctx.fillText('e-Stamp', width / 2, margin + 130);
    
    // QR Code visual placeholder
    ctx.fillStyle = '#111';
    ctx.fillRect(margin + 40, margin + 40, 110, 110);
    
    ctx.textAlign = 'left';
    ctx.font = '22px monospace';
    const dutyAmount = docType === 'AFFIDAVIT' ? '100 (One Hundred only)' : '500 (Five Hundred only)';
    const stampDetails = [
      'Certificate No.      : IN-MH9876543210ABC',
      'Certificate Date     : 28-Apr-2026 10:15 AM',
      'Account Reference    : NONACC (FI)/ mh-pune/ TALEGAON DABHADE',
      'Purchased by         : DEPONENT / EXECUTANT',
      `Description of Doc   : Article ${docType === 'AFFIDAVIT' ? '4 Affidavit' : 'General Document'}`,
      `Stamp Duty Paid (Rs) : ${dutyAmount}`
    ];
    
    let detailY = margin + 180;
    for(const d of stampDetails) {
      ctx.fillText(d, margin + 40, detailY);
      detailY += 28;
    }
    
    currentY = margin + stampH + 70;
  }

  // Draw Title
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px Arial';
  ctx.fillText(title, width / 2, currentY);
  currentY += 60;

  // Draw Body Text with paragraph support
  ctx.textAlign = 'left';
  ctx.font = '28px Arial';
  const lineHeight = 42;

  const paragraphs = bodyText.split('\n');
  for (const p of paragraphs) {
    if (!p.trim()) {
      currentY += lineHeight; 
      continue;
    }
    const bodyLines = wrapText(p.trim(), 90);
    for (const line of bodyLines) {
      if (currentY > height - margin) break;
      ctx.fillText(line, margin, currentY);
      currentY += lineHeight;
    }
  }

  // Draw Seals / Stamps based on document type
  if (docType === 'AFFIDAVIT') {
    // Red Notary Seal
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#c41e3a'; 
    ctx.lineWidth = 5;
    const nx = margin + 150;
    const ny = height - margin - 180;
    
    ctx.beginPath();
    ctx.arc(nx, ny, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(nx, ny, 85, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#c41e3a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('NOTARY', nx, ny - 10);
    ctx.fillText('PUBLIC', nx, ny + 20);
    ctx.font = '18px Arial';
    ctx.fillText('GOVT. OF INDIA', nx, ny + 55);
    ctx.restore();
  }

  if (['SALE_DEED', 'POA'].includes(docType)) {
    // Blue Sub-Registrar Block
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#0b5aa7';
    ctx.lineWidth = 6;
    const stampX = width - margin - 420;
    const stampY = height - margin - 260;
    
    ctx.strokeRect(stampX, stampY, 420, 220);
    ctx.fillStyle = '#0b5aa7';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('REGISTERED', stampX + 210, stampY + 70);
    ctx.font = '24px Arial';
    ctx.fillText('SUB-REGISTRAR OFFICE', stampX + 210, stampY + 130);
    ctx.fillText('TALEGAON DABHADE', stampX + 210, stampY + 170);
    ctx.restore();
  }

  return cnv.toBuffer('image/png');
};

const makeScannedPdf = async (fileName, title, bodyText, docType) => {
  const png = drawTextPageToPng({ 
    title, 
    bodyText, 
    docType, 
    seed: Math.floor(Math.random() * 10000) 
  });

  // Add scan/phone-like artifacts
  const degraded = await sharp(png)
    .rotate((Math.random() * 1.6 - 0.8), { background: { r: 248, g: 245, b: 239, alpha: 1 } })
    .modulate({
      brightness: 1 + (Math.random() * 0.06 - 0.03),
      saturation: 1 - Math.random() * 0.1
    })
    .linear(1.02, -2)
    .blur(0.35 + Math.random() * 0.25)
    .jpeg({ quality: 55 + Math.floor(Math.random() * 15), chromaSubsampling: '4:2:0' })
    .png()
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 points
  const img = await pdfDoc.embedPng(degraded);

  const pageW = page.getWidth();
  const pageH = page.getHeight();
  const margin = 18;
  const targetW = pageW - margin * 2;
  const targetH = pageH - margin * 2;

  const imgW = img.width;
  const imgH = img.height;
  const scale = Math.min(targetW / imgW, targetH / imgH);

  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;

  page.drawImage(img, { x, y, width: drawW, height: drawH });

  const bytes = await pdfDoc.save();
  return writeFileSafely(outDir, fileName, bytes);
};

async function main() {
  ensureDir(outDir);

  const saleDeedText = `
DEED OF ABSOLUTE SALE

This DEED OF ABSOLUTE SALE is made and executed at Talegaon Dabhade, Maharashtra on this 28th day of April, 2026.

BETWEEN
Mr. Rajesh Kumar, S/O Suresh Kumar, aged 45 years, residing at 401, Vasant Vihar, Talegaon Dabhade, Pune, Maharashtra - 410507, holding PAN ABCDE1234F, hereinafter referred to as the "VENDOR" (which expression shall mean and include his legal heirs, successors, and assigns) of the ONE PART.

AND
Mr. Amit Sharma, S/O Dinesh Sharma, aged 38 years, residing at 202, Green Park, Baner, Pune, Maharashtra - 411045, holding PAN FGHIJ5678K, hereinafter referred to as the "PURCHASER" (which expression shall mean and include his legal heirs, successors, and assigns) of the OTHER PART.

WHEREAS the VENDOR is the absolute owner and in lawful possession of the property bearing Flat No. 105, 1st Floor, Building A, "Sunshine Residency", situated at Talegaon Dabhade, Pune, measuring 850 Sq. Ft. (hereinafter referred to as the "SCHEDULE PROPERTY").

NOW THIS DEED WITNESSETH AS FOLLOWS:

1. That in consideration of the sum of Rs. 45,00,000/- (Rupees Forty-Five Lakhs Only) paid by the PURCHASER to the VENDOR via RTGS/NEFT Transaction No. UTR987654321 on 25/04/2026, the VENDOR hereby absolutely sells, conveys, and transfers the SCHEDULE PROPERTY to the PURCHASER.

2. The VENDOR confirms that the property is free from all encumbrances, charges, and legal disputes.

3. The VENDOR has handed over the vacant physical possession of the SCHEDULE PROPERTY along with all original title deeds to the PURCHASER.

SCHEDULE OF PROPERTY
All that piece and parcel of Flat No. 105, 1st Floor, Building A, "Sunshine Residency", situated at Survey No. 45/2, Talegaon Dabhade, Pune - 410507.

IN WITNESS WHEREOF the VENDOR and the PURCHASER have signed this Sale Deed on the day, month, and year first above written.
  `.trim();

  const poaText = `
SPECIAL POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS THAT I, Mrs. Sunita Deshmukh, W/O Ramesh Deshmukh, aged 52 years, residing at 12, Shivaji Nagar, Pune, Maharashtra - 411005, do hereby nominate, constitute, and appoint Mr. Vikram Deshmukh, S/O Ramesh Deshmukh, aged 29 years, residing at 12, Shivaji Nagar, Pune, Maharashtra - 411005, to be my true and lawful SPECIAL ATTORNEY to do the following acts, deeds, and things in my name and on my behalf:

WHEREAS I am the absolute owner of the immovable property bearing Plot No. 42, Survey No. 18, situated at Wakad, Pune, Maharashtra.

AND WHEREAS I am unable to personally manage the said property or attend the Sub-Registrar's office due to my ongoing medical treatment.

NOW THEREFORE, I authorize my said Attorney:
1. To represent me before the Sub-Registrar of Assurances, Pune, or any other competent authority for the registration of documents.
2. To negotiate, finalize, and execute the Sale Deed or any other agreement in respect of the aforementioned property.
3. To present the Sale Deed for registration, admit execution thereof, and sign all necessary registers and forms.

I hereby agree to ratify and confirm all acts, deeds, and things lawfully done by my said Attorney by virtue of this Special Power of Attorney.

IN WITNESS WHEREOF, I have executed this Special Power of Attorney at Pune on this 15th day of February, 2026.
  `.trim();

  const affidavitText = `
AFFIDAVIT

I, Mohan Das, S/O Raghav Das, aged 28 years, residing at 9, Sector 21, Chandigarh - 160022, presently residing at Talegaon Dabhade, Maharashtra, do hereby solemnly affirm and declare as under:

1. That I am the absolute owner of the property bearing Khata No. 14, Survey No. 56, situated at Talegaon Dabhade, Maharashtra.

2. That the aforementioned property is free from all encumbrances, mortgages, charges, liens, or legal disputes of any kind.

3. That no civil or criminal proceedings are pending against me regarding the title or possession of the said property in any court of law.

4. That this affidavit is executed for submission to the Sub-Registrar Office, Talegaon Dabhade, for property verification and registration purposes.

PLACE: Talegaon Dabhade
DATE: 28/04/2026

VERIFICATION
I, the above-named deponent, do hereby verify that the contents of paragraphs 1 to 4 of this Affidavit are true and correct to the best of my knowledge and belief. No part of it is false and nothing material has been concealed therein.
  `.trim();

  // Digital-text PDFs
  const saleDigital = await makePdf('sale-deed-synthetic.pdf', 'Synthetic Sale Deed', saleDeedText);
  const poaDigital = await makePdf('poa-synthetic.pdf', 'Synthetic Power of Attorney', poaText);
  const affidavitDigital = await makePdf('affidavit-synthetic.pdf', 'Synthetic Affidavit', affidavitText);

  // Scanned-style PDFs with Canvas visual enhancements
  const saleScanned = await makeScannedPdf('sale-deed-synthetic-scanned.pdf', 'Synthetic Sale Deed', saleDeedText, 'SALE_DEED');
  const poaScanned = await makeScannedPdf('poa-synthetic-scanned.pdf', 'Synthetic Power of Attorney', poaText, 'POA');
  const affidavitScanned = await makeScannedPdf('affidavit-synthetic-scanned.pdf', 'Synthetic Affidavit', affidavitText, 'AFFIDAVIT');

  const readme = `
Synthetic PDFs generated:
- ${path.basename(saleDigital)} (docType: SALE_DEED)
- ${path.basename(saleScanned)} (docType: SALE_DEED, OCR)
- ${path.basename(poaDigital)} (docType: POWER_OF_ATTORNEY)
- ${path.basename(poaScanned)} (docType: POWER_OF_ATTORNEY, OCR)
- ${path.basename(affidavitDigital)} (docType: AFFIDAVIT)
- ${path.basename(affidavitScanned)} (docType: AFFIDAVIT, OCR)
  `.trim() + '\n';

  fs.writeFileSync(path.join(outDir, 'README.txt'), readme);
  console.log('Generated realistic synthetic PDFs in:', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});