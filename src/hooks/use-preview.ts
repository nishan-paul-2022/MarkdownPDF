import { useState, useRef, useCallback, useEffect } from 'react';

export type ViewMode = 'live' | 'preview';
export type ZoomMode = 'fit-page' | 'fit-width' | 'custom';

export const A4_WIDTH_PX = 794; // 210mm at 96 DPI
export const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI

interface UsePreviewProps {
  content: string;
  metadata: any;
  onGeneratePdf?: () => Promise<Blob>;
}

export function usePreview({ content, metadata, onGeneratePdf }: UsePreviewProps) {
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
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isPaginating, setIsPaginating] = useState(true);
  const [isScaleCalculated, setIsScaleCalculated] = useState(false);
  const [isAutoRender, setIsAutoRender] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [lastRenderedSignature, setLastRenderedSignature] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stagingRef = useRef<HTMLDivElement>(null);
  const lastViewModeRef = useRef<ViewMode>(viewMode);
  const lastIsPdfReadyRef = useRef<boolean>(isPdfReady);
  const transitionTargetPageRef = useRef<number | null>(null);

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
          setLastRenderedSignature(JSON.stringify({ content, metadata }));
        })
        .catch((err: unknown) => console.error(err))
        .finally(() => setIsPdfLoading(false));
    }
  }, [viewMode, onGeneratePdf, pdfBlobUrl, content, metadata]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  useEffect(() => {
    if (!isAutoRender && viewMode === 'preview') return;
    const currentSignature = JSON.stringify({ content, metadata });
    if (currentSignature === lastRenderedSignature) return;

    const timer = setTimeout(() => {
      setPdfBlobUrl(null);
      setIsPdfReady(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, metadata, isAutoRender, viewMode, lastRenderedSignature]);

  const handleManualRefresh = useCallback(() => {
    setPdfBlobUrl(null);
    setIsPdfReady(false);
  }, []);

  useEffect(() => {
    if (viewMode === 'preview') {
      setIsPaginating(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!stagingRef.current) return;
      const pages: string[] = [];
      let currentPageBucket: string[] = [];
      const children = Array.from(stagingRef.current.children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
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

  const hasMetadataValues = (meta: any): boolean => {
    if (!meta) return false;
    return Object.values(meta).some(val => val && (val as string).trim().length > 0);
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

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const scrollToPage = useCallback((pageNum: number, behavior: ScrollBehavior = 'smooth') => {
    if (pageNum >= 1 && pageNum <= totalPages && containerRef.current) {
      const selector = (viewMode === 'live' || !isPdfReady)
        ? `.live-view-page[data-page-index="${pageNum - 1}"]`
        : `.pdf-view-page[data-page-index="${pageNum - 1}"]`;

      const pageEl = containerRef.current.querySelector(selector);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior, block: 'start' });
      }
    }
  }, [totalPages, viewMode, isPdfReady]);

  useEffect(() => {
    const isModeSwitch = lastViewModeRef.current !== viewMode;
    const isPdfJustReady = !lastIsPdfReadyRef.current && isPdfReady;
    
    if (isModeSwitch) {
      transitionTargetPageRef.current = currentPage;
    }

    lastViewModeRef.current = viewMode;
    lastIsPdfReadyRef.current = isPdfReady;

    const targetPage = transitionTargetPageRef.current !== null 
      ? transitionTargetPageRef.current 
      : currentPage;
      
    let needsScroll = isModeSwitch || isPdfJustReady;

    let clampedTarget = targetPage;
    if (targetPage > totalPages && totalPages > 0) {
      clampedTarget = totalPages;
      if (transitionTargetPageRef.current === null) {
        setCurrentPage(clampedTarget);
      }
      needsScroll = true;
    }

    if (needsScroll && totalPages > 0) {
      const behavior = isPdfJustReady ? 'auto' : 'smooth';
      const timer = setTimeout(() => {
        scrollToPage(clampedTarget, behavior);
        if (!isModeSwitch || (isModeSwitch && isPdfReady)) {
          transitionTargetPageRef.current = null;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [totalPages, viewMode, currentPage, scrollToPage, isPdfReady]);

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

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.target.scrollHeight);
      }
    });
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isScaleCalculated) return;
    let scale = 1;
    if (zoomMode === 'fit-page') scale = fitPageScale;
    else if (zoomMode === 'fit-width') scale = fitWidthScale;
    else scale = customZoom / 100;
    setZoomInput(`${Math.round(scale * 100)}%`);
  }, [zoomMode, customZoom, fitPageScale, fitWidthScale, isScaleCalculated]);

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
          if (transitionTargetPageRef.current !== null) return;
          setCurrentPage(visiblePageIndex + 1);
        }
      },
      { root: containerRef.current, threshold: [0, 0.3, 0.5, 0.7, 1.0] }
    );

    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;
      const selector = viewMode === 'live' ? '.live-view-page' : '.pdf-view-page';
      const pageElements = containerRef.current.querySelectorAll(selector);
      pageElements.forEach((el) => observer.observe(el));
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [paginatedPages, metadata, viewMode, numPages, pdfBlobUrl]);

  const handlePageInputSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      scrollToPage(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPageInput(e.target.value);
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputSubmit = (e: React.FormEvent): void => {
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

  const getScale = (): number => {
    if (zoomMode === 'fit-page') return fitPageScale;
    if (zoomMode === 'fit-width') return fitWidthScale;
    return customZoom / 100;
  };

  const hasChanges = JSON.stringify({ content, metadata }) !== lastRenderedSignature;

  return {
    currentPage,
    pageInput,
    zoomMode,
    customZoom,
    zoomInput,
    fitWidthScale,
    fitPageScale,
    viewMode,
    pdfBlobUrl,
    numPages,
    isPdfLoading,
    paginatedPages,
    isPdfReady,
    isPaginating,
    isScaleCalculated,
    isAutoRender,
    contentHeight,
    renderSuccess,
    hasChanges,
    containerRef,
    contentRef,
    stagingRef,
    setViewMode,
    setIsAutoRender,
    handleManualRefresh,
    handleZoomChange,
    handlePageInputChange,
    handlePageInputSubmit,
    handleZoomInputChange,
    handleZoomInputSubmit,
    handlePdfLoadSuccess,
    onPdfRenderSuccess,
    scrollToPage,
    getScale,
    totalPages,
    showCoverPage
  };
}
