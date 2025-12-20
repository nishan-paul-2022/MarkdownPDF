'use client';

import Image from 'next/image';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, Maximize, ArrowLeftRight, ScrollText, Eye, FileDown, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';



interface MdPreviewProps {
  content: string;
  metadata?: {
    title: string;
    subtitle: string;
    course: string;
    name: string;
    roll: string;
    reg: string;
    batch: string;
    date: string;
  };
  className?: string;
  showToolbar?: boolean;
  onDownload?: () => void;
  isGenerating?: boolean;
}

type ZoomMode = 'fit-page' | 'fit-width' | 'custom';

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];
const A4_WIDTH_PX = 794; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI

const CoverPage = ({ metadata }: { metadata: MdPreviewProps['metadata'] }) => {
  if (!metadata) return null;

  return (
    <div className="pdf-page relative bg-white overflow-hidden flex flex-col items-center text-center p-[2cm] mx-auto shrink-0"
      style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, color: 'white', fontFamily: 'var(--font-inter), sans-serif' }}>
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/cover-bg.png')` }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center">
        <div className="mt-[2cm] p-4 flex justify-center">
          <Image src="/du-logo.png" alt="Logo" width={140} height={140} className="w-[140px] h-auto" />
        </div>

        <div className="text-[32px] font-bold tracking-[2px] mt-2 uppercase">UNIVERSITY OF DHAKA</div>
        <div className="text-[18px] font-normal mt-2 opacity-90">Professional Masters in Information and Cyber Security</div>

        <div className="mt-[2.5cm] mb-[2cm] w-full flex flex-col items-center">
          <div className="text-[38px] font-extrabold leading-[1.2] mb-5 w-full px-8 whitespace-nowrap overflow-hidden text-ellipsis">
            {metadata.title || 'Public Key Infrastructure (PKI)'}
          </div>
          <div className="text-[22px] font-semibold opacity-95 w-full px-8 whitespace-nowrap overflow-hidden text-ellipsis">
            {metadata.subtitle || 'Implementation & Web Application Integration'}
          </div>
        </div>

        <div className="mt-[1.5cm] text-[18px] w-full max-w-[90%] border-b border-white/20 pb-3 whitespace-nowrap overflow-hidden text-ellipsis">
          Course: {metadata.course}
        </div>

        <div className="mt-[1cm] w-[70%] p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
          <div className="space-y-3">
            {[
              { label: 'Name:', value: metadata.name },
              { label: 'Roll No:', value: metadata.roll },
              { label: 'Reg. No:', value: metadata.reg },
              { label: 'Batch:', value: metadata.batch },
              { label: 'Submission Date:', value: metadata.date },
            ].map((detail, idx) => (
              <div key={idx} className="flex text-left text-[18px]">
                <div className="w-[160px] font-semibold text-white/80">{detail.label}</div>
                <div className="flex-1 font-medium text-white">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PageWrapper = ({ children, pageNumber, totalPages }: { children: React.ReactNode, pageNumber: number, totalPages: number }) => {
  return (
    <div className="pdf-page relative bg-white p-[2cm] mx-auto flex flex-col shrink-0"
      style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, color: '#1a1a1a', fontFamily: 'var(--font-inter), sans-serif' }}>
      <div className="flex-grow">
        {children}
      </div>

      <div className="mt-auto pt-4 flex justify-end text-[8pt] text-slate-400 font-sans">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};

interface PageRendererProps {
  page: { type: 'cover' | 'content', content: string | null };
  index: number;
  totalPages: number;
  metadata?: MdPreviewProps['metadata'];
}

const PageRenderer = React.memo(({ page, index, totalPages, metadata }: PageRendererProps) => {
  if (page.type === 'cover') {
    return <CoverPage metadata={metadata} />;
  }

  return (
    <PageWrapper pageNumber={index + 1} totalPages={totalPages}>
      <div className="prose prose-slate max-w-none" style={{ fontFamily: 'var(--font-lora), serif' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match && match[1] === 'mermaid') {
                return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
              }
              return (
                <code
                  className={cn(
                    inline ? "bg-slate-100 text-[#0c4a6e] px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-slate-200" : "bg-transparent p-0 border-0 text-inherit",
                    className
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="my-8 relative bg-[#0f172a] text-[#f8fafc] p-6 rounded-lg overflow-x-auto text-[9.5pt] font-mono shadow-md border border-slate-800">
                {children}
              </pre>
            ),
            h2: ({ children, ...props }) => {
              const id = children?.toString().toLowerCase().replace(/\s+/g, '-');
              return (
                <h2 id={id} className="text-[26pt] font-extrabold mt-16 mb-8 border-l-[10px] border-[#0ea5e9] pl-6 py-3 text-[#0f172a] bg-slate-50 rounded-r-lg" {...props}>
                  {children}
                </h2>
              );
            },
            h3: ({ children }) => (
              <h3 className="text-[20pt] font-bold mt-10 mb-5 text-[#0369a1] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-8 leading-[1.8] text-[#334155] text-justify text-[11.5pt] font-normal">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-none mb-8 space-y-3 text-[#334155] text-[11.5pt]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-10 mb-8 space-y-3 text-[#334155] text-[11.5pt]">
                {children}
              </ol>
            ),
            li: ({ children, ...props }: any) => {
              if (props.ordered) {
                return (
                  <li className="pl-2 mb-1 leading-relaxed">
                    {children}
                  </li>
                );
              }
              return (
                <li className="flex gap-3 mb-1 leading-relaxed text-justify">
                  <span className="text-[#0ea5e9] font-bold mt-2 min-w-[10px] flex justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]"></span>
                  </span>
                  <span className="flex-1">{children}</span>
                </li>
              );
            },
            table: ({ children }) => (
              <div className="my-10 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full border-collapse text-[10.5pt]">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-slate-100 border-b border-slate-200 p-4 text-left font-bold text-[#0369a1] uppercase tracking-wider text-[9pt]">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-slate-50 p-4 text-slate-600">
                {children}
              </td>
            ),
          }}
        >
          {page.content || ''}
        </ReactMarkdown>
      </div>
    </PageWrapper>
  );
});

PageRenderer.displayName = 'PageRenderer';

export const MdPreview = ({ content, metadata, className, showToolbar = true, onDownload, isGenerating = false }: MdPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customZoom, setCustomZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState('100%');
  const [fitWidthScale, setFitWidthScale] = useState(0.75);
  const [fitPageScale, setFitPageScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const handleZoomChange = useCallback((delta: number) => {
    setZoomMode('custom');
    setCustomZoom(prev => {
      let currentBase = prev;
      if (zoomMode === 'fit-page') currentBase = fitPageScale * 100;
      else if (zoomMode === 'fit-width') currentBase = fitWidthScale * 100;

      // Round to nearest 5 to keep things clean
      const newZoom = Math.round((currentBase + delta) / 5) * 5;
      return Math.max(25, Math.min(400, newZoom));
    });
  }, [zoomMode, fitPageScale, fitWidthScale]);

  // Split content by page break marker --- and H2 headers
  const allPages = React.useMemo(() => {
    const rawContent = content || '';
    // First split by explicit page breaks
    const chunks = rawContent.split(/\n---\n/);

    const processedPages: { type: 'content' | 'cover', content: string | null }[] = [];

    if (metadata) {
      processedPages.push({ type: 'cover', content: null });
    }

    const tempChunks: string[] = [];
    chunks.forEach(chunk => {
      // Split by H2 at start of line
      const subChunks = chunk.split(/(?=^##\s)/m);
      subChunks.forEach(subChunk => {
        if (subChunk.trim()) {
          tempChunks.push(subChunk.trim());
        }
      });
    });

    // Handle orphaned headings (headings at the end of a chunk)
    const finalChunks: string[] = [];
    for (let i = 0; i < tempChunks.length; i++) {
      let current = tempChunks[i];

      // Check if current chunk ends with a heading
      const orphanHeadingMatch = current.match(/(\n|^)(#{1,6}\s+[^\n]+)$/);

      if (orphanHeadingMatch && i < tempChunks.length - 1) {
        const heading = orphanHeadingMatch[2];
        const headingStartIdx = current.lastIndexOf(heading);
        const newCurrent = current.substring(0, headingStartIdx).trim();

        // Only move if there's actually content before the heading
        if (newCurrent) {
          current = newCurrent;
          tempChunks[i + 1] = heading + "\n" + tempChunks[i + 1];
        }
      }

      if (current.trim()) {
        finalChunks.push(current.trim());
      }
    }

    finalChunks.forEach(c => {
      processedPages.push({ type: 'content' as const, content: c });
    });

    return processedPages;
  }, [content, metadata]);

  const totalPages = allPages.length;

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate dynamic scale for fit-width and fit-page
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // A4 page dimensions in pixels
      const pageWidth = A4_WIDTH_PX;
      const pageHeight = A4_HEIGHT_PX;

      // Fit width: use full width for a true edge-to-edge experience
      setFitWidthScale(containerWidth / pageWidth);

      // Fit page: use width/height minus padding for a comfortable margin
      const padding = 32; // 16px on each side
      const widthScaleWithPadding = (containerWidth - padding) / pageWidth;
      const heightScaleWithPadding = (containerHeight - padding) / pageHeight;
      setFitPageScale(Math.min(widthScaleWithPadding, heightScaleWithPadding));
    };

    calculateScale();

    // Recalculate on window resize
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sync zoom input with current scale
  useEffect(() => {
    let scale = 1;
    if (zoomMode === 'fit-page') scale = fitPageScale;
    else if (zoomMode === 'fit-width') scale = fitWidthScale;
    else scale = customZoom / 100;

    setZoomInput(`${Math.round(scale * 100)}%`);
  }, [zoomMode, customZoom, fitPageScale, fitWidthScale]);

  // Track visible page in continuous mode
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio
        let maxRatio = 0;
        let visiblePageIndex = currentPage - 1;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0');
            visiblePageIndex = pageIndex;
          }
        });

        if (maxRatio > 0.3) { // Only update if at least 30% of page is visible
          setCurrentPage(visiblePageIndex + 1);
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.3, 0.5, 0.7, 1.0],
      }
    );

    // Observe all page elements
    const pageElements = containerRef.current.querySelectorAll('[data-page-index]');
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [allPages]); // Stable dependency through useMemo

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle scrolling with arrow keys/page keys
      switch (e.key) {
        case 'ArrowUp':
          containerRef.current?.scrollBy({ top: -50, behavior: 'smooth' });
          break;
        case 'ArrowDown':
          containerRef.current?.scrollBy({ top: 50, behavior: 'smooth' });
          break;
        case 'PageUp':
          containerRef.current?.scrollBy({ top: -400, behavior: 'smooth' });
          break;
        case 'PageDown':
        case ' ':
          containerRef.current?.scrollBy({ top: 400, behavior: 'smooth' });
          break;
        case 'Home':
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'End':
          containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse wheel zoom (Ctrl + scroll)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        handleZoomChange(delta);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleZoomChange]);



  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const scrollToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages && containerRef.current) {
      const pageEl = containerRef.current.querySelector(`[data-page-index="${pageNum - 1}"]`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      scrollToPage(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = zoomInput.replace(/[^0-9]/g, '');
    const zoomVal = parseInt(cleanValue);

    if (!isNaN(zoomVal)) {
      // Clamp between 25 and 400
      const clamped = Math.max(25, Math.min(400, zoomVal));
      setZoomMode('custom');
      setCustomZoom(clamped);
      setZoomInput(`${clamped}%`);
    } else {
      // Reset to current
      let scale = 1;
      if (zoomMode === 'fit-page') scale = fitPageScale;
      else if (zoomMode === 'fit-width') scale = fitWidthScale;
      else scale = customZoom / 100;
      setZoomInput(`${Math.round(scale * 100)}%`);
    }
  };

  const getScale = () => {
    if (zoomMode === 'fit-page') return fitPageScale;
    if (zoomMode === 'fit-width') return fitWidthScale;
    return customZoom / 100;
  };

  // No-op for removed single page render
  const renderPage = (page: typeof allPages[0], index: number) => {
    return (
      <PageRenderer
        key={index}
        page={page}
        index={index}
        totalPages={totalPages}
        metadata={metadata}
      />
    );
  };

  return (
    <div className={cn("pdf-viewer flex flex-col h-full bg-slate-900/50", className)}>
      {/* Toolbar Content */}
      {/* Floating Toolbar Island */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 shrink-0 select-none backdrop-blur-sm">
          {/* Left: Label */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" /> PDF
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">

            {/* Page Nav */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Previous Page"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>

              <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1 px-1 min-w-[3.5rem] justify-center">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  className="h-4 w-6 text-center bg-transparent border-0 p-0 text-white text-xs font-medium focus-visible:ring-0 focus-visible:bg-white/5 rounded-sm tabular-nums"
                  title="Enter page number to jump"
                />
                <span className="text-[10px] text-slate-500 font-medium select-none">/ {totalPages}</span>
              </form>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Next Page"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>

            <div className="w-px h-4 bg-slate-800 mx-0.5" />

            {/* Zoom */}
            <div className="flex items-center gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleZoomChange(-10)}
                disabled={getScale() * 100 <= 25}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>

              <form onSubmit={handleZoomInputSubmit} className="min-w-[2.5rem] flex justify-center">
                <Input
                  type="text"
                  value={zoomInput}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputSubmit}
                  className="h-4 w-8 text-center bg-transparent border-0 p-0 text-white text-xs font-medium focus-visible:ring-0 focus-visible:bg-white/5 rounded-sm tabular-nums"
                />
              </form>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleZoomChange(10)}
                disabled={getScale() * 100 >= 400}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>

            {/* View Actions */}
            <div className="flex items-center gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomMode('fit-page')}
                className={cn(
                  "h-6 w-6 rounded-md transition-all active:scale-95",
                  zoomMode === 'fit-page'
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                title="Fit Page"
              >
                <Maximize className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomMode('fit-width')}
                className={cn(
                  "h-6 w-6 rounded-md transition-all active:scale-95",
                  zoomMode === 'fit-width'
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                title="Fit Width"
              >
                <ArrowLeftRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="w-px h-4 bg-slate-800 mx-0.5" />

            {/* Download Action */}
            <div className="flex items-center gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={onDownload}
                disabled={isGenerating}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-primary disabled:opacity-50 transition-all active:scale-95"
                title={isGenerating ? "Generating..." : "Download PDF"}
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                ) : (
                  <FileDown className="w-3 h-3" />
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* PDF Content */}
      <div
        ref={containerRef}
        className={cn(
          "flex-grow overflow-auto flex justify-center bg-slate-900/40 custom-scrollbar transition-all duration-200",
          zoomMode === 'fit-width' ? "p-0 overflow-x-hidden" : "p-4"
        )}
      >
        <div
          className="flex flex-col gap-8 origin-top"
          style={{
            transform: `scale(${getScale()}) translateZ(0)`,
            width: `${A4_WIDTH_PX}px`,
            height: 'fit-content',
            willChange: 'transform'
          }}
        >
          {allPages.map((page, index) => (
            <div
              key={index}
              ref={index === 0 ? pageRef : null}
              data-page-index={index}
              className="shadow-xl"
            >
              {renderPage(page, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
