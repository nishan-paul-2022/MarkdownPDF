'use client';

import Image from 'next/image';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, Maximize, ArrowLeftRight, ScrollText, Play, FileDown, Loader2 } from 'lucide-react';
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

const CoverPage = ({ metadata }: { metadata: MdPreviewProps['metadata'] }) => {
  if (!metadata) return null;

  return (
    <div className="pdf-page relative bg-white overflow-hidden flex flex-col items-center text-center p-[2cm] mx-auto shrink-0"
      style={{ width: '210mm', height: '297mm', color: 'white', fontFamily: 'var(--font-inter), sans-serif' }}>
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

        <div className="mt-[2.5cm] mb-[2cm] w-full">
          <div className="text-[44px] font-extrabold leading-[1.2] mb-5 w-full break-words">
            {metadata.title || 'Public Key Infrastructure (PKI)'}
          </div>
          <div className="text-[26px] font-semibold opacity-95 w-full">
            {metadata.subtitle || 'Implementation & Web Application Integration'}
          </div>
        </div>

        <div className="mt-[1.5cm] text-[19px] w-[80%] border-b border-white/20 pb-3">
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
      style={{ width: '210mm', height: '297mm', color: '#1a1a1a', fontFamily: 'var(--font-inter), sans-serif' }}>
      <div className="flex-grow">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 flex justify-end text-[8pt] text-slate-400 font-sans">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};

export const MdPreview = ({ content, metadata, className, showToolbar = true, onDownload, isGenerating = false }: MdPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customZoom, setCustomZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState('100%');
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
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

  // Split content by page break marker ---
  const pages = content.split(/\n---\n/).map(p => p.trim()).filter(p => p.length > 0);
  const totalPages = pages.length + (metadata ? 1 : 0);

  const allPages = [
    ...(metadata ? [{ type: 'cover' as const, content: null }] : []),
    ...pages.map(p => ({ type: 'content' as const, content: p }))
  ];

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate dynamic scale for fit-width and fit-page
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // Get container dimensions (minimal padding for better fit)
      const containerWidth = container.clientWidth - 32; // 16px padding on each side
      const containerHeight = container.clientHeight - 32;

      // A4 page dimensions in pixels (210mm x 297mm at 96 DPI)
      const pageWidth = 794; // 210mm
      const pageHeight = 1123; // 297mm

      // Calculate scales
      const widthScale = containerWidth / pageWidth;
      const heightScale = containerHeight / pageHeight;

      // Fit width: use width as constraint
      setFitWidthScale(widthScale);

      // Fit page: use the smaller of width or height to ensure entire page is visible
      setFitPageScale(Math.min(widthScale, heightScale));
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
    if (viewMode !== 'continuous' || !containerRef.current) return;

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
  }, [viewMode, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Disable page navigation in continuous mode
      if (viewMode === 'continuous') {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          setCurrentPage(prev => Math.max(1, prev - 1));
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          setCurrentPage(prev => Math.min(totalPages, prev + 1));
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, viewMode]);

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

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
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

  const renderPage = (page: typeof allPages[0], index: number) => {
    if (page.type === 'cover') {
      return <CoverPage key="cover" metadata={metadata} />;
    }

    return (
      <PageWrapper key={index} pageNumber={index + 1} totalPages={totalPages}>
        <div className="prose prose-slate max-w-none" style={{ fontFamily: 'var(--font-lora), serif' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
                const match = /language-mermaid/.exec(className || '');
                if (!inline && match) {
                  return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                }
                return (
                  <code className={cn("bg-slate-100 text-slate-900 px-1 py-0.5 rounded text-[10pt] font-mono", className)} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="relative bg-[#1e1e1e] text-[#e0e0e0] p-4 rounded overflow-x-auto text-[9.5pt] my-6 font-mono">
                  {children}
                </pre>
              ),
              h2: ({ children, ...props }) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-');
                return (
                  <h2 id={id} className="text-[24pt] font-bold mt-12 mb-6 border-l-[8px] border-[#234258] pl-4 py-2 text-[#234258]" {...props}>
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => (
                <h3 className="text-[18pt] font-semibold mt-8 mb-4 text-[#415A77]">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-6 leading-relaxed text-[#1a1a1a] text-justify text-[11pt]">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-[#1a1a1a] text-[11pt]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-[#1a1a1a] text-[11pt]">
                  {children}
                </ol>
              ),
              table: ({ children }) => (
                <div className="my-6 overflow-hidden rounded border border-slate-200">
                  <table className="w-full border-collapse text-[10pt]">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-slate-50 border-b border-slate-200 p-2 text-left font-bold text-[#234258]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-slate-100 p-2 text-slate-700">
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
  };

  return (
    <div className={cn("pdf-viewer flex flex-col h-full bg-slate-900/50", className)}>
      {/* Toolbar Content */}
      {/* Floating Toolbar Island */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 shrink-0 select-none backdrop-blur-sm">
          {/* Left: Label */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="p-1 rounded-sm bg-slate-800/50">
              <Play className="w-3 h-3 fill-current" />
            </div>
            Live Preview
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">

            {/* Page Nav */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={viewMode === 'continuous' || currentPage === 1}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Previous Page"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>

              <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1 px-1 min-w-[3rem] justify-center">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  disabled={viewMode === 'continuous'}
                  className="h-4 w-6 text-center bg-transparent border-0 p-0 text-white text-xs font-medium focus-visible:ring-0 focus-visible:bg-white/5 rounded-sm tabular-nums"
                />
                <span className="text-[10px] text-slate-500 font-medium select-none">/ {totalPages}</span>
              </form>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={viewMode === 'continuous' || currentPage === totalPages}
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

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === 'single' ? 'continuous' : 'single')}
                className={cn(
                  "h-6 w-6 rounded-md transition-all active:scale-95 ml-0.5",
                  viewMode === 'continuous'
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                title={viewMode === 'single' ? "Enable Scroll" : "Single Page"}
              >
                <ScrollText className="w-3 h-3" />
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
        className="flex-grow overflow-auto p-4 flex justify-center bg-slate-900/40"
      >
        {viewMode === 'single' ? (
          <div
            className="transition-transform duration-200 origin-top"
            style={{ transform: `scale(${getScale()})` }}
          >
            <div ref={pageRef} className="shadow-2xl">
              {renderPage(allPages[currentPage - 1], currentPage - 1)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {allPages.map((page, index) => (
              <div
                key={index}
                ref={index === 0 ? pageRef : null}
                data-page-index={index}
                className="shadow-2xl"
              >
                {renderPage(page, index)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
