import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

interface Metadata {
  title?: string;
  subtitle?: string;
  course?: string;
  name?: string;
  roll?: string;
  reg?: string;
  batch?: string;
  date?: string;
}

export async function generatePdf(markdownHtml: string, metadata: Metadata) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load images as base64
  const logoPath = path.join(process.cwd(), 'public', 'du-logo.png');
  const bgPath = path.join(process.cwd(), 'public', 'cover-bg.png');

  let logoBase64 = '';
  let bgBase64 = '';

  try {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
    bgBase64 = fs.readFileSync(bgPath).toString('base64');
  } catch (err) {
    console.error('Error reading images:', err);
  }

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora&display=swap');
    
    body { 
      font-family: 'Inter', sans-serif;
      padding: 0;
      margin: 0;
      color: #1a1a1a;
    }
    .report-container { padding: 2cm; }
    h2 { font-size: 24pt; color: #234258; border-left: 8px solid #234258; padding-left: 15px; margin-top: 1.5cm; margin-bottom: 0.5cm; page-break-after: avoid; }
    h3 { font-size: 18pt; color: #415A77; margin-top: 1cm; page-break-after: avoid; }
    p { text-align: justify; line-height: 1.6; font-family: 'Lora', serif; font-size: 11pt; }
    .page-break { page-break-before: always; }
    pre { background: #1e1e1e; color: #e0e0e0; padding: 12px; border-radius: 4px; font-size: 9.5pt; white-space: pre-wrap; }
    .diagram-container { margin: 20px 0; text-align: center; }
    
    .cover-page { 
      height: 297mm; 
      width: 210mm;
      background-image: url('data:image/png;base64,${bgBase64}');
      background-size: cover;
      background-position: center;
      color: white; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      text-align: center; 
      padding: 2cm; 
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
    }
    .logo-container {
      margin-top: 2cm;
      padding: 15px;
      display: flex;
      justify-content: center;
    }
    .logo {
      width: 140px;
      height: auto;
    }
    .university { 
      font-size: 32px; 
      letter-spacing: 2px; 
      font-weight: 700; 
      margin-top: 10px;
      text-transform: uppercase;
    }
    .program {
      font-size: 18px;
      font-weight: 400;
      margin-top: 8px;
      opacity: 0.9;
    }
    .title-section {
      margin-top: 2.5cm;
      margin-bottom: 2cm;
    }
    .report-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 20px;
      width: 100%;
      padding: 0 40px;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .report-subtitle {
      font-size: 22px;
      font-weight: 600;
      opacity: 0.95;
      width: 100%;
      padding: 0 40px;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .course-info {
      margin-top: 1.5cm;
      font-size: 18px;
      width: 90%;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 12px;
      text-align: center;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .student-details {
      margin-top: 1cm;
      width: 70%;
      padding: 30px;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(4px);
    }
    .details-row {
      display: flex;
      font-size: 18px;
      margin-bottom: 12px;
      text-align: left;
      width: 100%;
    }
    .details-label {
      width: 160px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
    }
    .details-value {
      flex: 1;
      font-weight: 500;
      color: #ffffff;
    }
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${style}</style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <script>
        mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
      </script>
    </head>
    <body>
      <div class="cover-page">
        <div class="logo-container">
          <img src="data:image/png;base64,${logoBase64}" class="logo" />
        </div>
        
        <div class="university">UNIVERSITY OF DHAKA</div>
        <div class="program">Professional Masters in Information and Cyber Security</div>
        
        <div class="title-section">
          <div class="report-title">${metadata.title || 'Public Key Infrastructure (PKI)'}</div>
          <div class="report-subtitle">${metadata.subtitle || 'Implementation & Web Application Integration'}</div>
        </div>
        
        <div class="course-info">
          Course: ${metadata.course || 'CSE 802 - Information Security and Cryptography'}
        </div>
        
        <div class="student-details">
          <div class="details-row">
            <div class="details-label">Name:</div>
            <div class="details-value">${metadata.name || 'Nishan Paul'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Roll No:</div>
            <div class="details-value">${metadata.roll || 'JN-50028'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Reg. No:</div>
            <div class="details-value">${metadata.reg || 'H-55'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Batch:</div>
            <div class="details-value">${metadata.batch || '05'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Submission Date:</div>
            <div class="details-value">${metadata.date || 'December 18, 2025'}</div>
          </div>
        </div>
      </div>
      <div class="report-container">
        ${markdownHtml.replace(/<code class="language-mermaid">([\s\S]*?)<\/code>/g, '<div class="mermaid">$1</div>')}
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for mermaid to finish rendering
  await page.waitForTimeout(2000);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-family: Arial; font-size: 8px; width: 100%; display: flex; justify-content: flex-end; padding: 5px 20px;">
        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>`
  });

  await browser.close();
  return pdf;
}
