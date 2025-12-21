'use client';

import Image from 'next/image';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Maximize, ArrowLeftRight, ScrollText, Eye, DownloadCloud, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
  loading: () => <div className="h-[800px] w-[600px] animate-pulse bg-slate-800/20 rounded-lg" />,
});

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
  onGeneratePdf?: () => Promise<Blob>;
  isGenerating?: boolean;
  isMetadataValid?: boolean;
}


type ViewMode = 'live' | 'preview';

type ZoomMode = 'fit-page' | 'fit-width' | 'custom';

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];
const A4_WIDTH_PX = 794; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI

const CoverPage = ({ metadata }: { metadata: MdPreviewProps['metadata'] }) => {
  if (!metadata) return null;

  return (
    <div className="pdf-page relative bg-white overflow-hidden flex flex-col items-center text-center p-0 mx-auto shrink-0"
      style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, color: 'white', fontFamily: 'var(--font-inter), sans-serif' }}>
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/cover-bg.png')` }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center">
        <div className="mt-[2cm] p-4 flex justify-center">
          <Image src="/du-logo.png" alt="Logo" width={120} height={120} className="w-[120px] h-auto" />
        </div>

        <div className="text-[28px] font-bold tracking-[2px] mt-[10px] uppercase">UNIVERSITY OF DHAKA</div>
        <div className="text-[16px] font-normal mt-[8px] opacity-90">Professional Masters in Information and Cyber Security</div>

        <div className="mt-[2cm] mb-[2cm] w-full flex flex-col items-center">
          <div className="text-[32px] font-extrabold leading-[1.2] mb-[15px] w-full px-8 whitespace-nowrap overflow-hidden text-ellipsis">
            {metadata.title}
          </div>
          <div className="text-[18px] font-semibold opacity-95 w-full px-8 whitespace-nowrap overflow-hidden text-ellipsis">
            {metadata.subtitle}
          </div>
        </div>

        <div className="mt-[1cm] text-[15px] w-[85%] border-b border-white/20 pb-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
          {metadata.course}
        </div>

        <div className="mt-[1cm] w-[70%] p-[20px] bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm">
          <div className="space-y-[8px]">
            {[
              { label: 'Name', value: metadata.name },
              { label: 'Roll No', value: metadata.roll },
              { label: 'Reg. No', value: metadata.reg },
              { label: 'Batch', value: metadata.batch },
              { label: 'Submission Date', value: metadata.date },
            ].map((detail, idx) => (
              <div key={idx} className="flex text-left text-[14px]">
                <div className="w-[42%] font-semibold text-white/90 flex justify-between">
                  {detail.label}
                  <span className="mr-2">:</span>
                </div>
                <div className="w-[58%] font-medium text-white pl-2">{detail.value}</div>
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
    <div className="pdf-page relative bg-white mx-auto flex flex-col shrink-0 shadow-sm"
      style={{
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        height: 'fit-content',
        color: '#111827',
        fontFamily: 'var(--font-inter), sans-serif',
        padding: '15mm',
        // Visual guide for physical page breaks (A4 height)
        backgroundImage: `linear-gradient(to bottom, transparent calc(100% - 1px), #cbd5e1 calc(100% - 1px))`,
        backgroundSize: `100% ${A4_HEIGHT_PX}px`,
        backgroundRepeat: 'repeat-y'
      }}>



      <div className="flex-grow">
        {children}
      </div>

      <div className="mt-auto pt-4 flex justify-end text-[8pt] text-slate-400 font-sans">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};

export const MdPreview = ({ content, metadata, className, showToolbar = true, onDownload, onGeneratePdf, isGenerating = false, isMetadataValid = true }: MdPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customZoom, setCustomZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState('100%');
  const [fitWidthScale, setFitWidthScale] = useState(0.75);
  const [fitPageScale, setFitPageScale] = useState(0.5);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [paginatedPages, setPaginatedPages] = useState<string[]>([]);
  const [renderKey, setRenderKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const stagingRef = useRef<HTMLDivElement>(null);

  // Memoized components for ReactMarkdown to use in Staging Area
  const markdownComponents = React.useMemo(() => ({
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
    pre: ({ children }: any) => (
      <pre className="my-[0.8cm] relative bg-[#0f172a] text-[#f8fafc] p-[15px] rounded-lg overflow-x-auto text-[9pt] font-mono shadow-sm border border-white/5 leading-[1.45]">
        {children}
      </pre>
    ),
    h2: ({ children, ...props }: any) => {
      const id = children?.toString().toLowerCase().replace(/\s+/g, '-');
      return (
        <h2 id={id} className="text-[24pt] text-[#0369a1] font-sans font-bold mt-0 mb-[0.8cm] border-l-[10px] border-[#0ea5e9] pl-[20px] py-[10px] bg-[#f8fafc] rounded-r-lg leading-[1.3]" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children }: any) => (
      <h3 className="text-[16pt] text-[#0369a1] font-sans font-bold mt-[1cm] mb-[0.5cm] flex items-center leading-[1.4]">
        <span className="w-[6px] h-[6px] bg-[#0ea5e9] rounded-full mr-[10px] inline-block shrink-0"></span>
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="mb-[0.6cm] leading-[1.6] text-[#334155] text-justify text-[11pt] font-normal font-serif">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc mb-[0.6cm] pl-[1.5cm] text-[#334155] text-[11pt] font-serif leading-[1.6]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal mb-[0.6cm] pl-[1.5cm] text-[#334155] text-[11pt] font-serif leading-[1.6]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="mb-[0.2cm] pl-2">
        {children}
      </li>
    ),
    table: ({ children }: any) => (
      <div className="my-[0.8cm] w-full">
        <table className="w-full border-collapse text-[10pt] font-sans">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="bg-[#f8fafc] text-[#0369a1] font-bold uppercase tracking-[0.05em] text-[8.5pt] p-[10px] border-b-2 border-[#e2e8f0] text-left">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="p-[10px] border-b border-[#f1f5f9] color-[#475569]">
        {children}
      </td>
    ),
    img: ({ src, alt }: any) => (
      <img src={src} alt={alt} className="max-w-full h-auto rounded-lg mx-auto my-[1cm] block" />
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
        {children}
      </blockquote>
    ),
  }), []);

  const handlePdfLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  useEffect(() => {
    if (viewMode === 'preview' && onGeneratePdf && !pdfBlobUrl) {
      setIsPdfLoading(true);
      onGeneratePdf()
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        })
        .catch(err => console.error(err))
        .finally(() => setIsPdfLoading(false));
    }
  }, [viewMode, onGeneratePdf, pdfBlobUrl]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Debounced PDF regeneration: only reset PDF blob after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPdfBlobUrl(null);
    }, 1500); // Wait 1.5 seconds after last change before invalidating PDF

    return () => clearTimeout(timer);
  }, [content, metadata]);

  // Auto-switch to LIVE view if metadata becomes invalid while in PRINT view
  useEffect(() => {
    if (viewMode === 'preview' && !isMetadataValid) {
      setViewMode('live');
    }
  }, [isMetadataValid, viewMode]);

  // Reset to page 1 when switching view modes and reset numPages when leaving preview
  useEffect(() => {
    setCurrentPage(1);
    if (viewMode === 'live') {
      setNumPages(0);
    }
    // Increment render key to force re-observation
    setRenderKey(prev => prev + 1);
  }, [viewMode]);

  // Client-side Pagination Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!stagingRef.current) return;

      const MAX_HEIGHT = 1009; // 1123 - 114

      const pages: string[] = [];
      let currentPageBucket: string[] = [];
      let currentHeight = 0;

      const children = Array.from(stagingRef.current.children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;

        if (child.tagName === 'HR' || child.classList.contains('page-break')) {
          if (currentPageBucket.length > 0) {
            pages.push(currentPageBucket.join(''));
            currentPageBucket = [];
            currentHeight = 0;
          }
          continue;
        }

        const style = window.getComputedStyle(child);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const elementHeight = child.offsetHeight + marginTop + marginBottom;

        if (currentHeight + elementHeight > MAX_HEIGHT) {
          if (currentPageBucket.length > 0) {
            pages.push(currentPageBucket.join(''));
            currentPageBucket = [];
            currentHeight = 0;
          }

          currentPageBucket.push(child.outerHTML);
          currentHeight = elementHeight;
        } else {
          currentPageBucket.push(child.outerHTML);
          currentHeight += elementHeight;
        }
      }

      if (currentPageBucket.length > 0) {
        pages.push(currentPageBucket.join(''));
      }

      setPaginatedPages(pages);

    }, 500);

    return () => clearTimeout(timer);
  }, [content, metadata]);

  const totalPages = viewMode === 'preview' 
    ? numPages 
    : (metadata 
        ? (content.trim() ? paginatedPages.length + 1 : 1) 
        : Math.max(1, paginatedPages.length));

  const handleZoomChange = useCallback((delta: number) => {
    setZoomMode('custom');
    setCustomZoom(prev => {
      let currentBase = prev;
      if (zoomMode === 'fit-page') currentBase = fitPageScale * 100;
      else if (zoomMode === 'fit-width') currentBase = fitWidthScale * 100;
      const newZoom = Math.round((currentBase + delta) / 5) * 5;
      return Math.max(25, Math.min(400, newZoom));
    });
  }, [zoomMode, fitPageScale, fitWidthScale]);

  // Handle Input Changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate Scale for fit modes
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const pageWidth = A4_WIDTH_PX;
      const pageHeight = A4_HEIGHT_PX;

      setFitWidthScale(containerWidth / pageWidth);

      const padding = 32;
      const widthScaleWithPadding = (containerWidth - padding) / pageWidth;
      const heightScaleWithPadding = (containerHeight - padding) / pageHeight;
      setFitPageScale(Math.min(widthScaleWithPadding, heightScaleWithPadding));
    };

    calculateScale();
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Sync Zoom Input
  useEffect(() => {
    let scale = 1;
    if (zoomMode === 'fit-page') scale = fitPageScale;
    else if (zoomMode === 'fit-width') scale = fitWidthScale;
    else scale = customZoom / 100;
    setZoomInput(`${Math.round(scale * 100)}%`);
  }, [zoomMode, customZoom, fitPageScale, fitWidthScale]);

  // Intersection Observer for Current Page
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let visiblePageIndex = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            visiblePageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0');
          }
        });
        if (maxRatio > 0.3) {
          setCurrentPage(visiblePageIndex + 1);
        }
      },
      { root: containerRef.current, threshold: [0, 0.3, 0.5, 0.7, 1.0] }
    );
    
    // Small delay to ensure DOM is ready, especially after mode switch
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;
      const pageElements = containerRef.current.querySelectorAll('[data-page-index]');
      pageElements.forEach((el) => observer.observe(el));
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [paginatedPages, metadata, viewMode, numPages, pdfBlobUrl, renderKey]); // Re-observe when pages change, PDF loads, or mode switches

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

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = zoomInput.replace(/[^0-9]/g, '');
    const zoomVal = parseInt(cleanValue);
    if (!isNaN(zoomVal)) {
      const clamped = Math.max(25, Math.min(400, zoomVal));
      setZoomMode('custom');
      setCustomZoom(clamped);
      setZoomInput(`${clamped}%`);
    } else {
      setZoomInput(`${Math.round(getScale() * 100)}%`);
    }
  };

  const getScale = () => {
    if (zoomMode === 'fit-page') return fitPageScale;
    if (zoomMode === 'fit-width') return fitWidthScale;
    return customZoom / 100;
  };

  return (
    <div className={cn("pdf-viewer flex flex-col h-full bg-slate-900/50", className)}>
      {/* Hidden Staging Area */}
      <div
        className="fixed top-0 left-0 overflow-hidden pointer-events-none opacity-0 -z-50 bg-white"
        style={{ width: `${A4_WIDTH_PX}px`, padding: '15mm' }}
        aria-hidden="true"
      >
        <div ref={stagingRef} className="prose prose-slate max-w-none break-words" style={{ fontFamily: 'var(--font-lora), serif' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {showToolbar && (
        <div className="flex items-center justify-between px-4 h-12 bg-slate-900/80 border-b border-slate-800 shrink-0 select-none backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" />
            PDF
            <div className="flex bg-slate-950/40 rounded-lg p-1 border border-white/5 ml-3 shadow-inner">
              <button 
                onClick={() => setViewMode('live')} 
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer border",
                  viewMode === 'live' 
                    ? "bg-white/20 text-white border-white/20 shadow-inner" 
                    : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-100"
                )}
              >
                LIVE
              </button>
              <button 
                onClick={() => isMetadataValid && setViewMode('preview')} 
                disabled={!isMetadataValid}
                title={!isMetadataValid ? "Fill in all fields to view print preview" : "View print preview"}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all duration-200 border ml-1",
                  !isMetadataValid 
                    ? "text-slate-700 border-transparent cursor-not-allowed opacity-40" 
                    : viewMode === 'preview' 
                      ? "bg-white/20 text-white border-white/20 shadow-inner cursor-pointer" 
                      : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-100 cursor-pointer"
                )}
              >
                PRINT
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/40 rounded-lg p-1 border border-white/5 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(1)}
                disabled={currentPage === 1}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="First Page"
              >
                <ChevronsUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="Previous Page"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1 px-1.5 min-w-[3.5rem] justify-center">
                <Input 
                  type="text" 
                  value={pageInput} 
                  onChange={handlePageInputChange} 
                  onBlur={handlePageInputSubmit} 
                  className="h-5 w-8 text-center bg-white/5 border-none p-0 text-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm tabular-nums shadow-inner transition-all" 
                />
                <span className="text-xs text-slate-400 font-bold select-none tabular-nums">/ {totalPages}</span>
              </form>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="Next Page"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="Last Page"
              >
                <ChevronsDown className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-4 bg-slate-800/50 mx-0.5" />

            <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-lg p-1 border border-white/5 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleZoomChange(-10)}
                disabled={getScale() * 100 <= 25}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <form onSubmit={handleZoomInputSubmit} className="min-w-[3rem] flex justify-center">
                <Input
                  type="text"
                  value={zoomInput}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputSubmit}
                  className="h-5 w-10 text-center bg-white/5 border-none p-0 text-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-primary/50 rounded-sm tabular-nums shadow-inner transition-all"
                />
              </form>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleZoomChange(10)}
                disabled={getScale() * 100 >= 400}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="w-px h-4 bg-slate-800/50 mx-0.5" />

            <div className="flex items-center gap-1 bg-slate-800/40 rounded-lg p-1 border border-white/5 shadow-inner">
              <button 
                onClick={() => setZoomMode('fit-page')} 
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-md transition-all duration-200 active:scale-95 border cursor-pointer outline-none",
                  zoomMode === 'fit-page' 
                    ? "bg-white/20 text-white border-white/20 shadow-inner" 
                    : "text-slate-500 border-transparent hover:bg-white/10 hover:text-slate-100 hover:border-white/5"
                )}
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setZoomMode('fit-width')} 
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-md transition-all duration-200 active:scale-95 border cursor-pointer outline-none",
                  zoomMode === 'fit-width' 
                    ? "bg-white/20 text-white border-white/20 shadow-inner" 
                    : "text-slate-500 border-transparent hover:bg-white/10 hover:text-slate-100 hover:border-white/5"
                )}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-800/50 mx-0.5" />

            <div 
              title={!isMetadataValid ? "Fill in all fields to download PDF" : "Download PDF"}
              className={cn(
                "inline-block",
                (isGenerating || !isMetadataValid) && "cursor-not-allowed"
              )}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDownload} 
                disabled={isGenerating || !isMetadataValid} 
                className={cn(
                  "h-8 w-8 rounded-md transition-all duration-200 active:scale-95 group/download relative border",
                  isGenerating || !isMetadataValid
                    ? "opacity-50 cursor-not-allowed" 
                    : "",
                  isGenerating 
                    ? "bg-white/20 text-white border-white/20 shadow-inner" 
                    : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-100"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <DownloadCloud className="w-[18px] h-[18px]" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className={cn("flex-grow overflow-auto flex justify-center bg-slate-900/40 custom-scrollbar transition-all duration-200", zoomMode === 'fit-width' ? "p-0 overflow-x-hidden" : "p-4")}>
        <div className="flex flex-col gap-4 origin-top" style={{ transform: `scale(${getScale()}) translateZ(0)`, width: `${A4_WIDTH_PX}px`, height: 'fit-content', willChange: 'transform' }}>
          {viewMode === 'live' ? (
            <>
              {metadata && (
                <div ref={currentPage === 1 ? pageRef : null} data-page-index={0} className="shadow-xl">
                  <CoverPage metadata={metadata} />
                </div>
              )}
              {content.trim() && paginatedPages.length > 0 && (
                paginatedPages.map((pageHtml, index) => (
                  <div key={index} ref={currentPage === (index + (metadata ? 2 : 1)) ? pageRef : null} data-page-index={index + (metadata ? 1 : 0)} className="shadow-xl">
                    <PageWrapper pageNumber={index + (metadata ? 2 : 1)} totalPages={totalPages}>
                      <div className="prose prose-slate max-w-none break-words" style={{ fontFamily: 'var(--font-lora), serif' }} dangerouslySetInnerHTML={{ __html: pageHtml }} />
                    </PageWrapper>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="relative" key={`pdf-view-${renderKey}`}>
              {isPdfLoading && <div className="absolute inset-0 flex items-center justify-center min-h-[50vh] text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /><span className="ml-2">Rendering PDF...</span></div>}
              {pdfBlobUrl && <PdfViewer key={renderKey} url={pdfBlobUrl} onLoadSuccess={handlePdfLoadSuccess} width={A4_WIDTH_PX} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
