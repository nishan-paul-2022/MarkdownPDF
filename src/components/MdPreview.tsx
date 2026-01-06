'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { usePreview, A4_WIDTH_PX, A4_HEIGHT_PX } from '@/hooks/use-preview';
import { createMarkdownComponents } from './MarkdownComponents';
import { CoverPage, PageWrapper } from './PageTemplates';
import { MdPreviewToolbar } from './MdPreviewToolbar';

const PdfViewer = dynamic(() => import('./PdfViewer'), {
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

const MdPreview = React.memo(({
  content,
  metadata,
  className,
  showToolbar = true,
  onDownload,
  onGeneratePdf,
  isGenerating = false,
  isDownloaded = false,
  isLoading = false,
  basePath = ''
}: MdPreviewProps): React.JSX.Element => {
  const previewState = usePreview({ content, metadata, onGeneratePdf });
  const {
    viewMode, pdfBlobUrl, isPdfReady, isPdfLoading, isPaginating, 
    renderSuccess, hasChanges, containerRef, contentRef, stagingRef,
    numPages, paginatedPages, totalPages, showCoverPage,
    contentHeight, getScale, isInitializing,
    handlePdfLoadSuccess, onPdfRenderSuccess
  } = previewState;

  const markdownComponents = useMemo(() => createMarkdownComponents({ basePath }), [basePath]);

  const isPdfRendering = viewMode === 'preview' && (isPdfLoading || !isPdfReady || isInitializing);

  return (
    <TooltipProvider>
      <div className={cn("pdf-viewer relative flex flex-col h-full bg-slate-900/50", className)}>
        {/* Global Loader Overlay */}
        <div className={cn(
          "absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-in-out backdrop-blur-[2px] bg-slate-950/20",
          showToolbar ? "top-12" : "top-0",
          isPdfRendering ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="relative flex flex-col items-center gap-8 -translate-y-6">
            <div className="relative w-16 h-16">
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
          <MdPreviewToolbar 
            {...previewState}
            isPdfRendering={isPdfRendering}
            onDownload={onDownload}
            isGenerating={isGenerating}
            isDownloaded={isDownloaded}
          />
        )}

        <div ref={containerRef} className={cn("flex-grow overflow-y-scroll overflow-x-auto flex justify-center bg-slate-900/40 custom-scrollbar relative", previewState.zoomMode === 'fit-width' ? "p-0" : "p-4")}>
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
                  {!showCoverPage && !content.trim() && (
                    <div className="bg-white shadow-xl" style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}></div>
                  )}
                </div>
              )}

              {/* PDF Preview Layer */}
              <div className={cn(
                "col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-500 ease-in-out origin-top",
                (viewMode === 'preview' && isPdfReady) ? "relative" : "absolute inset-x-0 top-0 h-0 overflow-hidden",
                viewMode === 'preview' && !isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <div className="relative">
                  {pdfBlobUrl && !isLoading && (
                    <div className={cn(
                      "pdf-view-page-container transition-opacity duration-700 ease-in-out",
                      isPdfReady ? "opacity-100" : "opacity-0"
                    )}>
                      <PdfViewer
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
export default MdPreview;
