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
      background: white;
    }
    .report-container { padding: 0; }
    
    h2 { 
      font-size: 24pt; 
      color: #0369a1; 
      border-left: 10px solid #0ea5e9; 
      padding: 15px 0 15px 25px; 
      margin-top: 0; 
      margin-bottom: 1cm; 
      page-break-before: always; 
      page-break-after: avoid;
      background: #f8fafc;
      border-radius: 0 8px 8px 0;
    }
    
    /* First h2 on the first page doesn't need a page break if it's the very first thing */
    /* But actually, for reports, it's safer to just always break before h2 */

    h3 { 
      font-size: 18pt; 
      color: #0369a1; 
      margin-top: 1.2cm; 
      margin-bottom: 0.6cm; 
      page-break-after: avoid; 
      display: flex;
      align-items: center;
    }
    
    h3::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #0ea5e9;
      border-radius: 50%;
      margin-right: 12px;
    }

    p { 
      text-align: justify; 
      line-height: 1.8; 
      font-family: 'Lora', serif; 
      font-size: 11.5pt; 
      color: #334155;
      margin-bottom: 0.8cm;
    }

    ul, ol {
      margin-bottom: 0.8cm;
      color: #334155;
      font-family: 'Lora', serif;
      font-size: 11.5pt;
    }
    
    li { margin-bottom: 0.3cm; line-height: 1.6; }

    .page-break { page-break-before: always; }
    
    pre { 
      background: #0f172a; 
      color: #f8fafc; 
      padding: 20px; 
      border-radius: 12px; 
      font-size: 10pt; 
      white-space: pre-wrap; 
      margin: 1cm 0;
      border: 1px solid rgba(255,255,255,0.05);
      line-height: 1.5;
    }
    
    code {
      font-family: 'Inter', monospace;
    }

    .mermaid-wrapper {
      margin: 1cm 0;
      padding: 0;
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .diagram-container { margin: 0; text-align: center; width: 100%; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1cm 0;
      font-size: 10.5pt;
      page-break-inside: auto;
    }
    th {
      background: #f8fafc;
      color: #0369a1;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9pt;
      letter-spacing: 0.05em;
      padding: 12px;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    
    .content-page { 
      padding: 2cm; 
      page-break-after: always;
      word-break: break-word;
    }

    
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
      font-size: 34px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 20px;
      width: 100%;
      padding: 0 40px;
      box-sizing: border-box;
      /* Removed truncation for readability */
      word-wrap: break-word;
    }
    .report-subtitle {
      font-size: 20px;
      font-weight: 600;
      opacity: 0.95;
      width: 100%;
      padding: 0 40px;
      box-sizing: border-box;
      /* Removed truncation */
      word-wrap: break-word;
    }
    .course-info {
      margin-top: 1.5cm;
      font-size: 16px;
      width: 90%;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 12px;
      text-align: center;
      box-sizing: border-box;
      word-wrap: break-word;
    }
    .content-page { 
      /* Padding handled by PDF margins now */
      padding: 0; 
      page-break-after: always;
      word-break: break-word;
    }

    
    .cover-page { 
      min-height: 90vh; /* Relaxed height */
      width: 100%;
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
    /* ... other styles ... */
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${style}</style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <script>
        mermaid.initialize({ 
          startOnLoad: true, 
          theme: 'base',
          themeVariables: {
            primaryColor: '#e0f2fe',
            primaryTextColor: '#0369a1',
            primaryBorderColor: '#0ea5e9',
            lineColor: '#0ea5e9',
            secondaryColor: '#f0f9ff',
            tertiaryColor: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            mainBkg: '#ffffff',
            nodeBorder: '#cbd5e1',
            clusterBkg: '#f1f5f9',
            titleColor: '#0f172a',
            edgeLabelBackground: '#ffffff',
          }
        });
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
        <div class="content-page">
          ${markdownHtml.replace(/<code class="language-mermaid">([\s\S]*?)<\/code>/g, '<div class="mermaid-wrapper"><div class="mermaid">$1</div></div>')}
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Robust wait for mermaid
  try {
    await page.waitForSelector('.mermaid svg, .mermaid[data-processed="true"]', { timeout: 5000 });
  } catch (e) {
    console.log('Mermaid wait timeout, proceeding anyway...');
  }
  // Extra buffer
  await page.waitForTimeout(1000);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    // Standard Margins for A4 Report
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 9px; width: 100%; display: flex; justify-content: flex-end; padding-right: 15mm; color: #64748b;">
        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>`
  });

  await browser.close();
  return pdf;
}
