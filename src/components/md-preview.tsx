'use client';

import Image from 'next/image';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Maximize, ArrowLeftRight, Eye, DownloadCloud, Loader2, Sparkles } from 'lucide-react';
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
    university?: string;
    program?: string;
    title?: string;
    subtitle?: string;
    course?: string;
    name?: string;
    roll?: string;
    reg?: string;
    batch?: string;
    date?: string;
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
          <Image src="/university-logo.png" alt="University Logo" width={120} height={120} className="w-[120px] h-auto" />
        </div>

        {metadata.university && (
          <div className="text-[28px] font-bold tracking-[2px] mt-[10px] uppercase">{metadata.university}</div>
        )}
        {metadata.program && (
          <div className="text-[16px] font-normal mt-[8px] opacity-90">{metadata.program}</div>
        )}

        {(metadata.title || metadata.subtitle) && (
          <div className="mt-[2cm] mb-[2cm] w-full flex flex-col items-center">
            {metadata.title && (
              <div className="text-[32px] font-extrabold leading-[1.2] mb-[8px] w-full px-8 whitespace-nowrap overflow-hidden text-ellipsis">
                {metadata.title}
              </div>
            )}
            {metadata.subtitle && (
              <div className="text-[18px] font-semibold opacity-95 w-full px-8 whitespace-nowrap overflow-hidden text-ellipsis">
                {metadata.subtitle}
              </div>
            )}
          </div>
        )}

        {metadata.course && (
          <div className="mt-[1cm] text-[15px] w-[85%] border-b border-white/20 pb-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
            {metadata.course}
          </div>
        )}

        {(metadata.name || metadata.roll || metadata.reg || metadata.batch || metadata.date) && (
          <div className="mt-[1cm] w-[70%] p-[20px] bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm">
            <div className="space-y-[8px]">
              {[
                { label: 'Name', value: metadata.name },
                { label: 'Roll No', value: metadata.roll },
                { label: 'Reg. No', value: metadata.reg },
                { label: 'Batch', value: metadata.batch },
                { label: 'Submission Date', value: metadata.date },
              ].filter(detail => detail.value).map((detail, idx) => (
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
        )}
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
  const [renderKey] = useState(0);
  const [isPdfReady, setIsPdfReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
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
    pre: ({ children }: React.ComponentPropsWithoutRef<'pre'>) => (
      <pre className="mt-[0.2cm] mb-[0.8cm] relative bg-[#0f172a] text-[#f8fafc] p-[15px] rounded-lg overflow-x-auto text-[9pt] font-mono shadow-sm border border-white/5 leading-[1.45]">
        {children}
      </pre>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
      const id = children?.toString().toLowerCase().replace(/\s+/g, '-');
      return (
        <h2 id={id} className="text-[24pt] text-[#0369a1] font-sans font-bold mt-[0.8cm] mb-[0.3cm] border-l-[10px] border-[#0ea5e9] pl-[20px] py-[10px] bg-[#f8fafc] rounded-r-lg leading-[1.3]" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children }: React.ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="text-[16pt] text-[#0369a1] font-sans font-bold mt-[0.6cm] mb-[0.2cm] flex items-center leading-[1.4]">
        <span className="w-[6px] h-[6px] bg-[#0ea5e9] rounded-full mr-[10px] inline-block shrink-0"></span>
        {children}
      </h3>
    ),
    p: ({ children }: React.ComponentPropsWithoutRef<'p'>) => (
      <p className="mb-[0.4cm] leading-[1.6] text-[#334155] text-justify text-[11pt] font-normal font-serif">
        {children}
      </p>
    ),
    ul: ({ children }: React.ComponentPropsWithoutRef<'ul'>) => (
      <ul className="list-disc mb-[0.4cm] pl-[1.5cm] text-[#334155] text-[11pt] font-serif leading-[1.6]">
        {children}
      </ul>
    ),
    ol: ({ children }: React.ComponentPropsWithoutRef<'ol'>) => (
      <ol className="list-decimal mb-[0.4cm] pl-[1.5cm] text-[#334155] text-[11pt] font-serif leading-[1.6]">
        {children}
      </ol>
    ),
    li: ({ children }: React.ComponentPropsWithoutRef<'li'>) => (
      <li className="mb-[0.2cm] pl-2">
        {children}
      </li>
    ),
    table: ({ children }: React.ComponentPropsWithoutRef<'table'>) => (
      <div className="mt-[0.2cm] mb-[0.6cm] w-full">
        <table className="w-full border-collapse text-[10pt] font-sans">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: React.ComponentPropsWithoutRef<'th'>) => (
      <th className="bg-[#f8fafc] text-[#0369a1] font-bold uppercase tracking-[0.05em] text-[8.5pt] p-[10px] border-b-2 border-[#e2e8f0] text-left">
        {children}
      </th>
    ),
    td: ({ children }: React.ComponentPropsWithoutRef<'td'>) => (
      <td className="p-[10px] border-b border-[#f1f5f9] color-[#475569]">
        {children}
      </td>
    ),
    img: ({ src, alt }: React.ComponentPropsWithoutRef<'img'>) => (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={alt} className="max-w-full h-auto rounded-lg mx-auto mt-[0.2cm] mb-[0.8cm] block" />
    ),
    blockquote: ({ children }: React.ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="hidden" />,
  }), []);

  const handlePdfLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPdfRenderSuccess = useCallback(() => {
    setIsPdfReady(true);
  }, []);

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
      setIsPdfReady(false);
    }, 1500); // Wait 1.5 seconds after last change before invalidating PDF

    return () => clearTimeout(timer);
  }, [content, metadata]);

  // Auto-switch to LIVE view if metadata becomes invalid while in PRINT view
  useEffect(() => {
    if (viewMode === 'preview' && !isMetadataValid) {
      setViewMode('live');
    }
  }, [isMetadataValid, viewMode]);

  // Ensure observer is refreshed when view mode changes
  useEffect(() => {
    // No longer resetting currentPage or renderKey here to allow for smooth transitions
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

      const isCaption = (el: HTMLElement, nextEl?: HTMLElement): boolean => {
        // Tag-based captions (headings)
        if (/^H[1-6]$/.test(el.tagName)) return true;
        
        // Potential "straight text" captions: short paragraphs followed by a block element
        if (nextEl && el.tagName === 'P') {
          const text = el.innerText || el.textContent || '';
          const isShort = text.length > 0 && text.length < 120;
          const capturesBlock = /^(IMG|TABLE|PRE|DIV)$/.test(nextEl.tagName) || 
                               nextEl.querySelector('img, table, pre, .mermaid');
          return isShort && !!capturesBlock;
        }
        
        return false;
      };

      const getGroupHeight = (startIndex: number): number => {
        let groupHeight = 0;
        let j = startIndex;
        while (j < children.length) {
          const child = children[j] as HTMLElement;
          const nextChild = children[j + 1] as HTMLElement;
          const style = window.getComputedStyle(child);
          const height = child.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
          groupHeight += height;

          // If this element is not a caption, we stop here.
          // This means we've grouped the caption plus the first piece of content.
          if (!isCaption(child, nextChild)) {
            break;
          }
          j++;
        }
        return groupHeight;
      };

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
        const elementHeight = child.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);

        // Smart "Keep with Next" logic:
        // If the current element is a heading, look ahead to see how much space the heading(s) + the first content block need.
        let neededHeight = elementHeight;
        if (/^H[1-6]$/.test(child.tagName)) {
          const groupHeight = getGroupHeight(i);
          // If the group height is within reasonable bounds (not larger than a whole page),
          // we use it to decide if we should break now.
          if (groupHeight <= MAX_HEIGHT) {
            neededHeight = groupHeight;
          }
        }

        if (currentHeight + neededHeight > MAX_HEIGHT && currentPageBucket.length > 0) {
          pages.push(currentPageBucket.join(''));
          currentPageBucket = [];
          currentHeight = 0;
        }

        currentPageBucket.push(child.outerHTML);
        currentHeight += elementHeight;
      }

      if (currentPageBucket.length > 0) {
        pages.push(currentPageBucket.join(''));
      }

      setPaginatedPages(pages);

    }, 500);

    return () => clearTimeout(timer);
  }, [content, metadata]);

  const isPdfRendering = viewMode === 'preview' && (isPdfLoading || !isPdfReady);

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

      // Only observe pages belonging to the current view mode to avoid confusion
      const selector = viewMode === 'live' ? '.live-view-page' : '.pdf-view-page';
      const pageElements = containerRef.current.querySelectorAll(selector);
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
    <div className={cn("pdf-viewer relative flex flex-col h-full bg-slate-900/50", className)}>
      {/* Global Loader Overlay - Centered in viewport, independent of scroll position */}
      <div className={cn(
        "absolute inset-0 z-50 flex items-center justify-center transition-all duration-500 ease-in-out backdrop-blur-[2px] bg-slate-900/5",
        showToolbar ? "top-12" : "top-0",
        isPdfRendering ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="relative flex flex-col items-center gap-8 -translate-y-6">
          {/* Radial gradient glow background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-gradient-radial from-primary/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Orbital spinner system */}
          <div className="relative w-24 h-24 scale-110">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin" style={{ animationDuration: '3s' }} />

            {/* Middle ring */}
            <div className="absolute inset-2 rounded-full border-2 border-blue-400/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

            {/* Inner glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 to-blue-500/40 blur-md animate-pulse" />

            {/* Center spinner */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" style={{ animationDuration: '1.5s' }} />
            </div>

            {/* Floating particles */}
            <div className="absolute -top-1 left-1/2 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            <div className="absolute -bottom-1 left-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </div>

          {/* Animated text */}
          <div className="relative text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl" />
            <span className="relative text-xl font-bold bg-gradient-to-r from-slate-200 via-primary to-slate-200 bg-clip-text text-transparent animate-pulse bg-[length:200%_100%]" style={{ animation: 'pulse 2s ease-in-out infinite, shimmer 3s linear infinite' }}>
              Rendering PDF...
            </span>
          </div>
        </div>
      </div>

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
                disabled={isPdfRendering || currentPage === 1}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="First Page"
              >
                <ChevronsUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={isPdfRendering || currentPage === 1}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="Previous Page"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1 px-1.5 min-w-[3.5rem] justify-center">
                {isPdfRendering ? (
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                ) : (
                  <>
                    <Input
                      type="text"
                      value={pageInput}
                      onChange={handlePageInputChange}
                      onBlur={handlePageInputSubmit}
                      className="h-5 w-8 text-center bg-white/5 border-none p-0 text-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm tabular-nums shadow-inner transition-all"
                    />
                    <span className="text-xs text-slate-400 font-bold select-none tabular-nums">/ {totalPages}</span>
                  </>
                )}
              </form>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={isPdfRendering || currentPage === totalPages || totalPages === 0}
                className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 disabled:opacity-20 border border-transparent hover:border-white/5"
                title="Next Page"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(totalPages)}
                disabled={isPdfRendering || currentPage === totalPages || totalPages === 0}
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

      <div ref={containerRef} className={cn("flex-grow overflow-auto flex justify-center bg-slate-900/40 custom-scrollbar", zoomMode === 'fit-width' ? "p-0 overflow-x-hidden" : "p-4")}>
        <div className="grid grid-cols-1 grid-rows-1 origin-top transition-transform duration-300 ease-out" style={{ transform: `scale(${getScale()}) translateZ(0)`, width: `${A4_WIDTH_PX}px`, height: 'fit-content', willChange: 'transform' }}>

          {/* Live View Layer */}
          <div className={cn(
            "col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-500 ease-in-out origin-top",
            viewMode === 'live' ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            {metadata && (
              <div data-page-index={0} className="live-view-page shadow-xl">
                <CoverPage metadata={metadata} />
              </div>
            )}
            {content.trim() && paginatedPages.length > 0 && (
              paginatedPages.map((pageHtml, index) => (
                <div key={index} data-page-index={index + (metadata ? 1 : 0)} className="live-view-page shadow-xl">
                  <PageWrapper pageNumber={index + (metadata ? 2 : 1)} totalPages={totalPages}>
                    <div className="prose prose-slate max-w-none break-words" style={{ fontFamily: 'var(--font-lora), serif' }} dangerouslySetInnerHTML={{ __html: pageHtml }} />
                  </PageWrapper>
                </div>
              ))
            )}
            {/* Filler for empty content case */}
            {!metadata && !content.trim() && (
              <div className="bg-white shadow-xl" style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}></div>
            )}
          </div>

          {/* PDF Preview Layer */}
          <div className={cn(
            "col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-500 ease-in-out origin-top",
            viewMode === 'preview' ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <div className="relative" key={`pdf-view-${renderKey}`}>
              {/* Note: We keep PdfViewer mounted if pdfBlobUrl exists, even in live mode, for instant switch */}
              {pdfBlobUrl && (
                <div className={cn(
                  "pdf-view-page-container transition-opacity duration-700 ease-in-out",
                  isPdfReady ? "opacity-100" : "opacity-0"
                )}>
                  <PdfViewer
                    key={renderKey}
                    url={pdfBlobUrl}
                    onLoadSuccess={handlePdfLoadSuccess}
                    onRenderSuccess={onPdfRenderSuccess}
                    width={A4_WIDTH_PX}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
