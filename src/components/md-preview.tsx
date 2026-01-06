'use client';

import Image from 'next/image';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Maximize, ArrowLeftRight, DownloadCloud, Loader2, RefreshCw, Play, Pause, Check, MoreVertical, Eye, Printer } from 'lucide-react';
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
  isDownloaded?: boolean;
  isLoading?: boolean;
  basePath?: string;
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
              <div className="text-[32px] font-extrabold leading-[1.2] mb-[8px] w-full px-8 break-words text-center">
                {metadata.title}
              </div>
            )}
            {metadata.subtitle && (
              <div className="text-[18px] font-semibold opacity-95 w-full px-8 break-words text-center">
                {metadata.subtitle}
              </div>
            )}
          </div>
        )}

        {metadata.course && (
          <div className="mt-[1cm] text-[15px] w-[85%] border-b border-white/20 pb-[10px] break-words">
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
                  <div className="w-[58%] font-medium text-white pl-2 break-words text-left">{detail.value}</div>
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

export const MdPreview = React.memo(({ content, metadata, className, showToolbar = true, onDownload, onGeneratePdf, isGenerating = false, isDownloaded = false, isLoading = false, basePath = '' }: MdPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customZoom, setCustomZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState('');
  const [fitWidthScale, setFitWidthScale] = useState(0.75);
  const [fitPageScale, setFitPageScale] = useState(0.5);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [paginatedPages, setPaginatedPages] = useState<string[]>([]);
  const [renderKey] = useState(0);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isPaginating, setIsPaginating] = useState(true);
  const [isScaleCalculated, setIsScaleCalculated] = useState(false);
  const [isAutoRender, setIsAutoRender] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stagingRef = useRef<HTMLDivElement>(null);
  const lastViewModeRef = useRef<ViewMode>(viewMode);
  const lastIsPdfReadyRef = useRef<boolean>(isPdfReady);
  const transitionTargetPageRef = useRef<number | null>(null);
  const [lastRenderedSignature, setLastRenderedSignature] = useState<string>('');
  const [renderSuccess, setRenderSuccess] = useState(false);

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
            inline ? "bg-slate-100 text-[#0c4a6e] px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-slate-200 break-words" : "bg-transparent p-0 border-0 text-inherit",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }: React.ComponentPropsWithoutRef<'pre'>) => (
      <pre className="mt-[0.2cm] mb-[0.8cm] relative bg-[#0f172a] text-[#f8fafc] p-[15px] rounded-lg text-[9pt] font-mono shadow-sm border border-white/5 leading-[1.45] whitespace-pre-wrap break-words overflow-hidden">
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
    p: ({ children }: React.ComponentPropsWithoutRef<'p'>) => {
      // Check if this paragraph only contains the \pagebreak command
      if (React.Children.count(children) === 1) {
        const firstChild = React.Children.toArray(children)[0];
        if (typeof firstChild === 'string' && firstChild.trim() === '\\pagebreak') {
          return <div className="page-break-marker" />;
        }
      }
      return (
        <p className="mb-[0.4cm] leading-[1.6] text-[#334155] text-justify text-[11pt] font-normal font-serif">
          {children}
        </p>
      );
    },
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
      <div className="mt-[0.2cm] mb-[0.6cm] w-full overflow-hidden">
        <table className="w-full border-collapse text-[10pt] font-sans">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: React.ComponentPropsWithoutRef<'th'>) => (
      <th className="bg-[#f8fafc] text-[#0369a1] font-bold uppercase tracking-[0.05em] text-[8.5pt] p-[10px] border-b-2 border-[#e2e8f0] text-left break-words">
        {children}
      </th>
    ),
    td: ({ children }: React.ComponentPropsWithoutRef<'td'>) => (
      <td className="p-[10px] border-b border-[#f1f5f9] text-[#475569] break-words">
        {children}
      </td>
    ),
    img: ({ src, alt }: React.ComponentPropsWithoutRef<'img'>) => {
      let imageSrc = typeof src === 'string' ? src : '';
      if (imageSrc.startsWith('./') && basePath) {
        // Remove ./ and prepend base path
        const cleanBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
        imageSrc = cleanBasePath + imageSrc.slice(2);
      } else if (imageSrc && !imageSrc.startsWith('/') && !imageSrc.startsWith('http') && basePath) {
        // Handle case where it doesn't start with ./ but is relative
        const cleanBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
        imageSrc = cleanBasePath + imageSrc;
      }
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={imageSrc} alt={alt} className="max-w-full h-auto rounded-lg mx-auto mt-[0.2cm] mb-[0.8cm] block" />
      );
    },
    blockquote: ({ children }: React.ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-[0.8cm] border-slate-200" />,
    // Handle the custom divider if we decide to use it, but keeping it simple for now
  }), [basePath]);

  const handlePdfLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const onPdfRenderSuccess = useCallback(() => {
    setIsPdfReady(true);
    setRenderSuccess(true);
    setTimeout(() => setRenderSuccess(false), 2000);
  }, []);

  useEffect(() => {
    if (viewMode === 'preview' && onGeneratePdf && !pdfBlobUrl) {
      setIsPdfLoading(true);
      onGeneratePdf()
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          // Mark this content as "rendered"
          setLastRenderedSignature(JSON.stringify({ content, metadata }));
        })
        .catch(err => console.error(err))
        .finally(() => setIsPdfLoading(false));
    }
  }, [viewMode, onGeneratePdf, pdfBlobUrl, content, metadata]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Debounced PDF regeneration: reset PDF blob 2s after user stops typing
  useEffect(() => {
    // If auto-render is disabled and we are in preview mode, do not reset the PDF blob automatically
    if (!isAutoRender && viewMode === 'preview') return;

    // IF the current content matches what we last rendered, we don't need to invalidate.
    const currentSignature = JSON.stringify({ content, metadata });
    if (currentSignature === lastRenderedSignature) return;

    const timer = setTimeout(() => {
      setPdfBlobUrl(null);
      setIsPdfReady(false);
    }, 2000); // Keep PDF steady for 2s while Live View updates quickly

    return () => clearTimeout(timer);
  }, [content, metadata, isAutoRender, viewMode, lastRenderedSignature]);

  const handleManualRefresh = useCallback(() => {
    setPdfBlobUrl(null);
    setIsPdfReady(false);
  }, []);


  // Ensure observer is refreshed when view mode changes
  useEffect(() => {
    // No longer resetting currentPage or renderKey here to allow for smooth transitions
  }, [viewMode]);

  // Client-side Pagination Logic
  useEffect(() => {
    if (viewMode === 'preview') {
      setIsPaginating(false);
      return;
    }

    // We no longer set isPaginating(true) here because it's so fast it just causes flicker.
    // The previous pages stay visible until the new ones are ready.
    const timer = setTimeout(() => {
      if (!stagingRef.current) return;

      const pages: string[] = [];
      let currentPageBucket: string[] = [];

      const children = Array.from(stagingRef.current.children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;

        // ONLY break on explicit page markers
        if (child.classList.contains('page-break-marker') || child.classList.contains('page-break')) {
          if (currentPageBucket.length > 0) {
            pages.push(currentPageBucket.join(''));
            currentPageBucket = [];
          }
          continue;
        }

        currentPageBucket.push(child.outerHTML);
      }

      if (currentPageBucket.length > 0) {
        pages.push(currentPageBucket.join(''));
      }

      setPaginatedPages(pages);
      setIsPaginating(false);

    }, 0); 

    return () => clearTimeout(timer);
  }, [content, metadata, viewMode]);

  const isInitializing = isLoading || isPaginating;
  const isPdfRendering = viewMode === 'preview' && (isPdfLoading || !isPdfReady || isInitializing);

  const hasMetadataValues = (meta: MdPreviewProps['metadata']) => {
    if (!meta) return false;
    return Object.values(meta).some(val => val && val.trim().length > 0);
  };
  
  const showCoverPage = metadata && hasMetadataValues(metadata);

  const totalPages = viewMode === 'preview'
    ? numPages
    : (showCoverPage
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

  const scrollToPage = useCallback((pageNum: number, behavior: ScrollBehavior = 'smooth') => {
    if (pageNum >= 1 && pageNum <= totalPages && containerRef.current) {
      // Only target the layer that is currently active and relative to avoid targeting hidden elements
      const selector = (viewMode === 'live' || !isPdfReady)
        ? `.live-view-page[data-page-index="${pageNum - 1}"]`
        : `.pdf-view-page[data-page-index="${pageNum - 1}"]`;

      const pageEl = containerRef.current.querySelector(selector);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior, block: 'start' });
      }
    }
  }, [totalPages, viewMode, isPdfReady]);

  // Clamp current page when total pages decrease or view mode changes
  useEffect(() => {
    const isModeSwitch = lastViewModeRef.current !== viewMode;
    const isPdfJustReady = !lastIsPdfReadyRef.current && isPdfReady;
    
    // When we start a mode switch, remember the page we were on to prevent "drifting" 
    // caused by observers during the transition
    if (isModeSwitch) {
      transitionTargetPageRef.current = currentPage;
    }

    lastViewModeRef.current = viewMode;
    lastIsPdfReadyRef.current = isPdfReady;

    // Determine what page we should be looking at. 
    // If we are in a transition, we stay locked to the page we were on.
    const targetPage = transitionTargetPageRef.current !== null 
      ? transitionTargetPageRef.current 
      : currentPage;
      
    let needsScroll = isModeSwitch || isPdfJustReady;

    // Safety check for target page vs total pages
    let clampedTarget = targetPage;
    if (targetPage > totalPages && totalPages > 0) {
      clampedTarget = totalPages;
      if (transitionTargetPageRef.current === null) {
        setCurrentPage(clampedTarget);
      }
      needsScroll = true;
    }

    if (needsScroll && totalPages > 0) {
      // PDF swap uses instant scroll to avoid visual drift
      const behavior = isPdfJustReady ? 'auto' : 'smooth';
      
      const timer = setTimeout(() => {
        scrollToPage(clampedTarget, behavior);
        
        // Once we've attempted the scroll in the "final" state (PDF ready), 
        // we can unlock the observer.
        if (!isModeSwitch || (isModeSwitch && isPdfReady)) {
          transitionTargetPageRef.current = null;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [totalPages, viewMode, currentPage, scrollToPage, isPdfReady]);

  // Calculate Scale for fit modes
  const calculateScale = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const pageWidth = A4_WIDTH_PX;
    const pageHeight = A4_HEIGHT_PX;

    const newFitWidthScale = containerWidth / pageWidth;
    setFitWidthScale(newFitWidthScale);

    const padding = 32;
    const widthScaleWithPadding = (containerWidth - padding) / pageWidth;
    const heightScaleWithPadding = (containerHeight - padding) / pageHeight;
    const newFitPageScale = Math.min(widthScaleWithPadding, heightScaleWithPadding);
    setFitPageScale(newFitPageScale);

    // Immediately sync zoom input with newly calculated scales to avoid flashes
    const currentScale = zoomMode === 'fit-page' ? newFitPageScale : (zoomMode === 'fit-width' ? newFitWidthScale : customZoom / 100);
    setZoomInput(`${Math.round(currentScale * 100)}%`);
    
    setIsScaleCalculated(true);
  }, [zoomMode, customZoom]);

  useEffect(() => {
    calculateScale();
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [calculateScale]);

  // Track content height for layout compensation
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // We use scrollHeight to get the full height of the untransformed content
        setContentHeight(entry.target.scrollHeight);
      }
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  // Sync Zoom Input for subsequent mode or value changes
  useEffect(() => {
    if (!isScaleCalculated) return;
    let scale = 1;
    if (zoomMode === 'fit-page') scale = fitPageScale;
    else if (zoomMode === 'fit-width') scale = fitWidthScale;
    else scale = customZoom / 100;
    setZoomInput(`${Math.round(scale * 100)}%`);
  }, [zoomMode, customZoom, fitPageScale, fitWidthScale, isScaleCalculated]);

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
          // IMPORTANT: If we are in the middle of a view transition, 
          // ignore observer updates to prevent the "page 11 to 12" jump
          if (transitionTargetPageRef.current !== null) {
            return;
          }
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

  const currentSignature = JSON.stringify({ content, metadata });
  const hasChanges = currentSignature !== lastRenderedSignature;

  return (
    <TooltipProvider>
      <div className={cn("pdf-viewer relative flex flex-col h-full bg-slate-900/50", className)}>
        {/* Global Loader Overlay - Centered in viewport, independent of scroll position */}
        <div className={cn(
          "absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-in-out backdrop-blur-[2px] bg-slate-950/20",
          showToolbar ? "top-12" : "top-0",
          isPdfRendering ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="relative flex flex-col items-center gap-8 -translate-y-6">
            <div className="relative w-16 h-16">
              {/* Simplifed Rings */}
              <div className="absolute inset-0 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full border border-primary/20 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-slate-400" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Staging Area */}
        {viewMode === 'live' && (
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
        )}

        {showToolbar && (
          <div className="flex items-center justify-between px-4 h-12 bg-slate-900/80 border-b border-slate-800 shrink-0 select-none backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('live')}
                      className={cn(
                        "h-6 px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-full border border-transparent flex items-center justify-center gap-1.5",
                        viewMode === 'live'
                          ? "bg-white/10 text-white border-white/20 shadow-sm"
                          : "text-slate-500 hover:text-slate-100 hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      LIVE
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Switch to Live Preview</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('preview')}
                      className={cn(
                        "h-6 px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-full border border-transparent flex items-center justify-center gap-1.5",
                        viewMode === 'preview'
                            ? "bg-white/10 text-white border-white/20 shadow-sm"
                            : "text-slate-500 hover:text-slate-100 hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      PRINT
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Switch to Print Preview</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-5">
              {viewMode === 'preview' && (
                <div className="hidden md:flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAutoRender(!isAutoRender)}
                        className={cn(
                          "h-6 w-6 rounded-full transition-all duration-200 active:scale-90 border flex items-center justify-center",
                          isAutoRender
                            ? "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 hover:border-white/10"
                            : "bg-white/10 text-white border-white/20 shadow-sm hover:bg-white/15"
                        )}
                      >
                        {isAutoRender ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isAutoRender ? "Pause Auto-Sync" : "Resume Auto-Sync"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => !renderSuccess && handleManualRefresh()}
                          disabled={!renderSuccess && (isPdfRendering || (isAutoRender && isPdfReady) || !hasChanges)}
                          className={cn(
                            "h-6 w-6 rounded-full transition-all duration-200 active:scale-90 border border-transparent flex items-center justify-center",
                            renderSuccess
                              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                              : !isAutoRender && !isPdfRendering && hasChanges
                                ? "text-blue-400 hover:bg-blue-400/10 hover:border-white/10"
                                : "text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 disabled:opacity-20 disabled:hover:bg-transparent"
                          )}
                        >
                          {renderSuccess ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <RefreshCw className={cn(
                              "w-3.5 h-3.5",
                              isPdfRendering && "animate-spin"
                            )} />
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {renderSuccess 
                        ? "Sync Complete" 
                        : isPdfRendering
                          ? "Syncing" 
                          : !hasChanges
                            ? "No Changes Detected" 
                            : isAutoRender 
                              ? "Auto-Sync Enabled"
                              : "Sync Pending Changes"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
                <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollToPage(1)}
                      disabled={isInitializing || isPdfRendering || currentPage === 1}
                      className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>First Page</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollToPage(currentPage - 1)}
                      disabled={isInitializing || isPdfRendering || currentPage === 1}
                      className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous Page</TooltipContent>
                </Tooltip>

                <div className="px-1.5 min-w-[4.5rem] flex justify-center items-center relative h-6 overflow-hidden">
                  {/* Spinner Reveal */}
                  <div className={cn(
                    "absolute transition-all duration-300 ease-in-out flex items-center justify-center",
                    (isInitializing || isPdfRendering) 
                      ? "opacity-100 scale-100 blur-0" 
                      : "opacity-0 scale-75 blur-sm pointer-events-none"
                  )}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  </div>

                  {/* Numbers Reveal */}
                  <div className={cn(
                    "transition-all duration-300 ease-out flex items-center justify-center",
                    !(isInitializing || isPdfRendering) 
                      ? "opacity-100 scale-100 translate-y-0" 
                      : "opacity-0 scale-95 translate-y-1 pointer-events-none"
                  )}>
                    <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1">
                      <Input
                        type="text"
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onBlur={handlePageInputSubmit}
                        className="h-5 w-8 text-center bg-white/5 border-none p-0 text-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-full tabular-nums shadow-inner transition-all hover:bg-white/10"
                      />
                      <span className="text-xs text-slate-400 font-bold select-none tabular-nums">/ {totalPages}</span>
                    </form>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollToPage(currentPage + 1)}
                      disabled={isInitializing || isPdfRendering || currentPage === totalPages || totalPages === 0}
                      className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Page</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollToPage(totalPages)}
                      disabled={isInitializing || isPdfRendering || currentPage === totalPages || totalPages === 0}
                      className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Last Page</TooltipContent>
                </Tooltip>
              </div>



              <div className="hidden lg:flex items-center gap-0.5 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleZoomChange(-10)}
                      disabled={getScale() * 100 <= 25}
                      className="h-[24px] w-[24px] rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>

                <form onSubmit={handleZoomInputSubmit} className="min-w-[3rem] flex justify-center">
                  {!isScaleCalculated ? (
                    <div className="flex items-center justify-center w-10 h-5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={zoomInput}
                      onChange={handleZoomInputChange}
                      onBlur={handleZoomInputSubmit}
                      className="h-5 w-10 text-center bg-white/5 border-none p-0 text-white text-xs font-bold focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-full tabular-nums shadow-inner transition-all hover:bg-white/10"
                    />
                  )}
                </form>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleZoomChange(10)}
                      disabled={getScale() * 100 >= 400}
                      className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
              </div>

              <div className="hidden md:flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoomMode('fit-page')}
                      className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 border cursor-pointer outline-none",
                        zoomMode === 'fit-page'
                          ? "bg-white/10 text-white border-white/20 shadow-sm"
                          : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 hover:border-white/10"
                      )}
                    >
                      <Maximize className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fit Page</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoomMode('fit-width')}
                      className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 border cursor-pointer outline-none",
                        zoomMode === 'fit-width'
                          ? "bg-white/10 text-white border-white/20 shadow-sm"
                          : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 hover:border-white/10"
                      )}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fit Width</TooltipContent>
                </Tooltip>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner",
                    isGenerating && "opacity-50 cursor-not-allowed"
                  )}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDownload}
                      disabled={isGenerating}
                      className={cn(
                        "h-6 w-6 rounded-full transition-all duration-200 active:scale-90 group/download relative border border-transparent flex items-center justify-center",
                        isDownloaded 
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : !isGenerating ? "text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10" : "",
                        isGenerating && "bg-white/10 text-white border-white/20 shadow-sm"
                      )}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : isDownloaded ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <DownloadCloud className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isGenerating ? "Downloading" : "Download PDF"}
                </TooltipContent>
              </Tooltip>

              {/* Mobile PDF Options */}
              <div className="lg:hidden flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 min-w-44">
                    {viewMode === 'preview' && (
                      <>
                        <DropdownMenuItem onClick={() => setIsAutoRender(!isAutoRender)} className="gap-2 text-xs">
                          {isAutoRender ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {isAutoRender ? 'Pause Auto-Sync' : 'Resume Auto-Sync'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          disabled={isPdfRendering || (isAutoRender && isPdfReady) || !hasChanges} 
                          onClick={handleManualRefresh} 
                          className="gap-2 text-xs"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", isPdfRendering && "animate-spin")} />
                          Sync Changes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => setZoomMode('fit-page')} className="gap-2 text-xs">
                      <Maximize className="w-3.5 h-3.5" /> Fit Page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setZoomMode('fit-width')} className="gap-2 text-xs">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Fit Width
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem onClick={() => handleZoomChange(10)} className="gap-2 text-xs">
                      <ZoomIn className="w-3.5 h-3.5" /> Zoom In
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleZoomChange(-10)} className="gap-2 text-xs">
                      <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        <div ref={containerRef} className={cn("flex-grow overflow-y-scroll overflow-x-auto flex justify-center bg-slate-900/40 custom-scrollbar relative", zoomMode === 'fit-width' ? "p-0" : "p-4")}>
          <div 
            style={{ 
              height: contentHeight > 0 ? `${contentHeight * getScale()}px` : 'auto',
              width: `${A4_WIDTH_PX * getScale()}px`,
              transition: 'height 0.3s ease-out, width 0.3s ease-out',
              overflow: 'hidden'
            }}
          >
            <div 
              ref={contentRef}
              className="grid grid-cols-1 grid-rows-1 origin-top-left transition-transform duration-300 ease-out relative" 
              style={{ transform: `scale(${getScale()}) translateZ(0)`, width: `${A4_WIDTH_PX}px`, height: 'fit-content', willChange: 'transform' }}
            >

            {/* Live View Layer */}
            {(viewMode === 'live' || !isPdfReady) && (
              <div className={cn(
                "col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-500 ease-in-out origin-top",
                // If we are in live mode OR the PDF isn't ready yet, this layer should be relative to hold the height
                (viewMode === 'live' || !isPdfReady) ? "relative" : "absolute inset-x-0 top-0 h-0 overflow-hidden",
                viewMode === 'live' && !isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
              {showCoverPage && !isLoading && (
                <div data-page-index={0} className="live-view-page shadow-xl">
                  <CoverPage metadata={metadata} />
                </div>
              )}
              {content.trim() && paginatedPages.length > 0 && !isLoading && (
                paginatedPages.map((pageHtml, index) => (
                  <div key={index} data-page-index={index + (showCoverPage ? 1 : 0)} className="live-view-page shadow-xl">
                    <PageWrapper pageNumber={index + (showCoverPage ? 2 : 1)} totalPages={totalPages}>
                      <div className="prose prose-slate max-w-none break-words" style={{ fontFamily: 'var(--font-lora), serif' }} dangerouslySetInnerHTML={{ __html: pageHtml }} />
                    </PageWrapper>
                  </div>
                ))
              )}
              {/* Filler for empty content case */}
              {!showCoverPage && !content.trim() && (
                <div className="bg-white shadow-xl" style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}></div>
              )}
            </div>
          )}

            {/* PDF Preview Layer */}
            <div className={cn(
              "col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-500 ease-in-out origin-top",
              // Only relative when in preview mode AND the PDF is actually ready
              (viewMode === 'preview' && isPdfReady) ? "relative" : "absolute inset-x-0 top-0 h-0 overflow-hidden",
              viewMode === 'preview' && !isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="relative" key={`pdf-view-${renderKey}`}>
                {/* Note: We keep PdfViewer mounted if pdfBlobUrl exists, even in live mode, for instant switch */}
                {pdfBlobUrl && !isLoading && (
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
    </div>
    </TooltipProvider>
  );
});

MdPreview.displayName = 'MdPreview';
