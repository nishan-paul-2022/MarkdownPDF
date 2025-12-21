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
    
    /* Page-specific margins: zero for first page (landing), standard for others */
    @page :first {
      margin: 0;
    }
    
    @page {
      margin: 15mm;
    }
    
    body { 
      font-family: 'Inter', sans-serif;
      padding: 0;
      margin: 0;
      color: #1a1a1a;
      background: white;
    }
    .report-container { padding: 0; }
    
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      break-after: avoid;
      break-after: avoid-page;
    }

    h1 {
      font-size: 28pt;
      color: #0369a1;
      margin-bottom: 1cm;
    }

    h2 { 
      font-size: 24pt; 
      color: #0369a1; 
      border-left: 10px solid #0ea5e9; 
      padding: 10px 0 10px 20px; 
      margin-top: 1cm; 
      margin-bottom: 0.8cm; 
      page-break-before: always; 
      background: #f8fafc;
      border-radius: 0 8px 8px 0;
      line-height: 1.3;
    }

    h3 { 
      font-size: 16pt; 
      color: #0369a1; 
      margin-top: 1cm; 
      margin-bottom: 0.5cm; 
      display: flex;
      align-items: center;
      line-height: 1.4;
    }
    
    h3::before {
      content: "";
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: #0ea5e9;
      border-radius: 50%;
      margin-right: 10px;
    }

    h4, h5, h6 {
      font-size: 13pt;
      color: #0f172a;
      margin-top: 0.8cm;
      margin-bottom: 0.4cm;
    }

    p { 
      text-align: justify; 
      -webkit-hyphens: auto;
      hyphens: auto;
      line-height: 1.6; 
      font-family: 'Lora', serif; 
      font-size: 11pt; 
      color: #334155;
      margin-bottom: 0.6cm;
      orphans: 3;
      widows: 3;
    }

    ul, ol {
      margin-bottom: 0.6cm;
      color: #334155;
      font-family: 'Lora', serif;
      font-size: 11pt;
      padding-left: 1.5cm;
      page-break-inside: auto;
    }
    
    li { 
      margin-bottom: 0.2cm; 
      line-height: 1.6;
      page-break-inside: avoid;
    }

    .page-break { page-break-before: always; }
    
    pre { 
      background: #0f172a; 
      color: #f8fafc; 
      padding: 15px; 
      border-radius: 8px; 
      font-size: 9pt; 
      white-space: pre-wrap; 
      margin: 0.8cm 0;
      border: 1px solid rgba(255,255,255,0.05);
      line-height: 1.45;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    code {
      font-family: 'Inter', monospace;
    }

    hr {
      display: none;
    }


    .mermaid-wrapper {
      margin: 0.5cm 0;
      padding: 0;
      display: flex;
      justify-content: center;
      width: 100%;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* Intermediate container from Mermaid */
    .mermaid {
      display: flex !important;
      justify-content: center !important;
      width: 100% !important;
    }
    
    /* Ensure only SVGs are visible and scaled */
    .mermaid svg {
       max-width: 100% !important;
       max-height: 11cm !important; /* More aggressive cap to travel with Headers */
       height: auto !important;
       width: auto !important;
       display: block;
       margin: 0 auto;
    }

    .diagram-container { margin: 0; text-align: center; width: 100%; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8cm 0;
      font-size: 10pt;
      page-break-inside: auto;
    }
    th {
      background: #f8fafc;
      color: #0369a1;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.05em;
      padding: 10px;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
      margin: 1cm auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .content-page { 
      padding: 0; 
      page-break-after: always;
      word-break: break-word;
    }

    .cover-page { 
      width: 100%;
      min-height: 100vh;
      background-image: url('data:image/png;base64,${bgBase64}');
      background-size: cover;
      background-position: center;
      color: white; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      text-align: center; 
      padding: 0; 
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
    }
    .logo-container {
      margin-top: 1cm;
      padding: 15px;
      display: flex;
      justify-content: center;
    }
    .logo {
      width: 120px;
      height: auto;
      margin: 0; /* Reset img margin */
    }
    .university { 
      font-size: 28px; 
      letter-spacing: 2px; 
      font-weight: 700; 
      margin-top: 10px;
      text-transform: uppercase;
    }
    .program {
      font-size: 16px;
      font-weight: 400;
      margin-top: 8px;
      opacity: 0.9;
    }
    .title-section {
      margin-top: 2cm;
      margin-bottom: 2cm;
      width: 100%;
    }
    .report-title {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 15px;
      padding: 0 20px;
      word-wrap: break-word;
    }
    .report-subtitle {
      font-size: 18px;
      font-weight: 600;
      opacity: 0.95;
      padding: 0 20px;
      word-wrap: break-word;
    }
    .course-info {
      margin-top: 1cm;
      font-size: 15px;
      width: 85%;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 10px;
      display: inline-block;
      word-wrap: break-word;
    }
    .student-details {
      margin-top: 1cm;
      width: 70%;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .details-row {
      display: flex; 
      margin-bottom: 8px;
      text-align: left;
      font-size: 14px;
    }
    .details-row:last-child { margin-bottom: 0; }
    .details-label {
      width: 42%;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      display: flex;
      justify-content: space-between;
      padding-right: 8px;
    }
    .details-value {
      width: 58%;
      font-weight: 500;
      padding-left: 8px;
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

        // Smart Caption/Content grouping for PDF
        window.addEventListener('DOMContentLoaded', () => {
          // Keep captions with their following block elements
          document.querySelectorAll('p').forEach(p => {
            const next = p.nextElementSibling;
            if (next) {
              const isShort = p.innerText.trim().length > 0 && p.innerText.trim().length < 120;
              const isBlock = /^(IMG|TABLE|PRE|DIV)$/.test(next.tagName) || 
                             next.querySelector('img, table, pre, .mermaid') ||
                             next.classList.contains('mermaid-wrapper');
              
              if (isShort && isBlock) {
                p.style.breakAfter = 'avoid';
                p.style.pageBreakAfter = 'avoid';
                // Also ensure the next element doesn't break inside if it's small-ish
                if (next.offsetHeight < 500) {
                  next.style.breakInside = 'avoid';
                  next.style.pageBreakInside = 'avoid';
                }
              }
            }
          });

          // Also ensure headings are always kept with next
          document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
             h.style.breakAfter = 'avoid';
             h.style.pageBreakAfter = 'avoid';
          });
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
          <div class="report-title">${metadata.title}</div>
          <div class="report-subtitle">${metadata.subtitle}</div>
        </div>
        
        <div class="course-info">
          ${metadata.course}
        </div>
        
        <div class="student-details">
          <div class="details-row">
            <div class="details-label"><span>Name</span><span>:</span></div>
            <div class="details-value">${metadata.name}</div>
          </div>
          <div class="details-row">
            <div class="details-label"><span>Roll No</span><span>:</span></div>
            <div class="details-value">${metadata.roll}</div>
          </div>
          <div class="details-row">
            <div class="details-label"><span>Reg. No</span><span>:</span></div>
            <div class="details-value">${metadata.reg}</div>
          </div>
          <div class="details-row">
            <div class="details-label"><span>Batch</span><span>:</span></div>
            <div class="details-value">${metadata.batch}</div>
          </div>
          <div class="details-row">
            <div class="details-label"><span>Submission Date</span><span>:</span></div>
            <div class="details-value">${metadata.date}</div>
          </div>
        </div>
      </div>
      ${markdownHtml.trim() ? `
      <div class="report-container">
        <div class="content-page">
          ${markdownHtml.replace(/<code class="language-mermaid">([\s\S]*?)<\/code>/g, '<div class="mermaid-wrapper"><div class="mermaid">$1</div></div>')}
        </div>
      </div>
      ` : ''}
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Robust wait for mermaid
  try {
    await page.waitForSelector('.mermaid svg, .mermaid[data-processed="true"]', { timeout: 5000 });
  } catch {
    console.log('Mermaid wait timeout, proceeding anyway...');
  }
  // Extra buffer
  await page.waitForTimeout(1000);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    // CSS @page rules handle per-page margins (0 for first page, 15mm for others)
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
