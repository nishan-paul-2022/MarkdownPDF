import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf-generator';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { auth } from "@/lib/auth";

// Helper to embed images as base64
async function processHtmlImages(html: string, basePath?: string): Promise<string> {
  // More generic regex to catch all images
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  const matches = [...html.matchAll(imgRegex)];
  let processedHtml = html;

  for (const match of matches) {
    const fullTag = match[0];
    const src = match[1];
    
    // Skip remote images and already embedded ones
    if (src.startsWith('http') || src.startsWith('data:')) continue;

    const filename = src.split('/').pop();
    if (!filename) continue;

    // Resolve path: if src is ./images/foo.png and basePath is /content-2
    // we want public/content-2/images/foo.png
    
    let relativePath = src;
    if (src.startsWith('./')) {
      relativePath = src.substring(2);
    } else if (src.startsWith('/')) {
      relativePath = src.substring(1);
    }

    const potentialPaths: string[] = [];
    if (basePath) {
      const cleanBasePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
      potentialPaths.push(path.join(process.cwd(), 'public', cleanBasePath, relativePath));
    }
    potentialPaths.push(path.join(process.cwd(), 'public', relativePath));

    for (const imgPath of potentialPaths) {
      if (fs.existsSync(imgPath)) {
        try {
          const buffer = fs.readFileSync(imgPath);
          const base64 = buffer.toString('base64');
          const ext = path.extname(filename).substring(1).toLowerCase();
          const mimeType = ext === 'svg' ? 'svg+xml' : (ext === 'jpg' ? 'jpeg' : ext);
          const newSrc = `data:image/${mimeType};base64,${base64}`;
          
          // Replace src in the tag
          processedHtml = processedHtml.replace(fullTag, fullTag.replace(src, newSrc));
          break; 
        } catch (e) {
          console.error(`Error reading image ${imgPath}:`, e);
        }
      }
    }
  }
  return processedHtml;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Auth Check
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { markdown, metadata, basePath } = await req.json();

    // Process markdown to HTML for PDF engine
    // We use marked here as it's simpler for plain HTML generation on server
    const processedMarkdown = markdown.replace(/\\pagebreak|<!-- pagebreak -->/g, '<div class="page-break-marker"></div>');
    let htmlContent = await marked.parse(processedMarkdown);
    
    // Process images to embed them
    htmlContent = await processHtmlImages(htmlContent, basePath);

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
