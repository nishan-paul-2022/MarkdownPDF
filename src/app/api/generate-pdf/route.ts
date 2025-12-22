import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf-generator';
import { marked } from 'marked';

export async function POST(req: NextRequest) {
  try {
    const { markdown, metadata } = await req.json();

    // Process markdown to HTML for PDF engine
    // We use marked here as it's simpler for plain HTML generation on server
    const processedMarkdown = markdown.replace(/\\pagebreak|<!-- pagebreak -->/g, '<div class="page-break-marker"></div>');
    const htmlContent = await marked.parse(processedMarkdown);

    // In a real app, you'd add the cover page and diagrams here
    const pdfBuffer = await generatePdf(htmlContent, metadata);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
