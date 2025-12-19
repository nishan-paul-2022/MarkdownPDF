'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
          <img src="/du-logo.png" alt="Logo" className="w-[140px] h-auto" />
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

export const MdPreview = ({ content, metadata, className }: MdPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customZoom, setCustomZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
  }, [totalPages]);

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
  }, [customZoom, zoomMode]);

  const handleZoomChange = (delta: number) => {
    if (zoomMode !== 'custom') {
      setZoomMode('custom');
      setCustomZoom(100 + delta);
    } else {
      setCustomZoom(prev => Math.max(25, Math.min(400, prev + delta)));
    }
  };

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

  const handleZoomSelect = (value: string) => {
    if (value === 'fit-page' || value === 'fit-width') {
      setZoomMode(value);
    } else {
      setZoomMode('custom');
      setCustomZoom(parseInt(value));
    }
  };

  const getCurrentZoomValue = () => {
    if (zoomMode === 'fit-page') return 'fit-page';
    if (zoomMode === 'fit-width') return 'fit-width';
    return customZoom.toString();
  };

  const getScale = () => {
    if (zoomMode === 'fit-page') return 0.5;
    if (zoomMode === 'fit-width') return 0.75;
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
              code({ node, inline, className, children, ...props }: any) {
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
      {/* Professional PDF Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 shrink-0 gap-4">
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First page (Home)"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            title="Previous page (←)"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2 mx-2">
            <Input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputSubmit}
              className="h-8 w-12 text-center bg-slate-700 border-slate-600 text-slate-100 text-sm focus:ring-primary focus:border-primary"
            />
            <span className="text-sm text-slate-400">of {totalPages}</span>
          </form>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            title="Next page (→)"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page (End)"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange(-10)}
            disabled={zoomMode === 'custom' && customZoom <= 25}
            title="Zoom out (Ctrl + -)"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <Select value={getCurrentZoomValue()} onValueChange={handleZoomSelect}>
            <SelectTrigger className="h-8 w-[130px] bg-slate-700 border-slate-600 text-slate-100 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="fit-page" className="text-slate-100 focus:bg-slate-700 focus:text-white">
                Fit Page
              </SelectItem>
              <SelectItem value="fit-width" className="text-slate-100 focus:bg-slate-700 focus:text-white">
                Fit Width
              </SelectItem>
              <div className="border-t border-slate-700 my-1" />
              {ZOOM_LEVELS.map(level => (
                <SelectItem
                  key={level}
                  value={level.toString()}
                  className="text-slate-100 focus:bg-slate-700 focus:text-white"
                >
                  {level}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoomChange(10)}
            disabled={zoomMode === 'custom' && customZoom >= 400}
            title="Zoom in (Ctrl + +)"
            className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="text-xs text-slate-500 hidden xl:block">
          Use ← → or Page Up/Down to navigate • Ctrl+Scroll to zoom
        </div>
      </div>

      {/* PDF Content */}
      <div ref={containerRef} className="flex-grow overflow-auto p-8 flex justify-center bg-slate-900/40">
        <div
          className="transition-transform duration-200 origin-top"
          style={{ transform: `scale(${getScale()})` }}
        >
          <div className="shadow-2xl">
            {renderPage(allPages[currentPage - 1], currentPage - 1)}
          </div>
        </div>
      </div>
    </div>
  );
};
