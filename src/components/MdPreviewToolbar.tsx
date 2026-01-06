import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Maximize, ArrowLeftRight, DownloadCloud, Loader2, RefreshCw, Play, Pause, Check, MoreVertical, Eye, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, ZoomMode } from '@/hooks/use-preview';

interface MdPreviewToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAutoRender: boolean;
  setIsAutoRender: (auto: boolean) => void;
  renderSuccess: boolean;
  handleManualRefresh: () => void;
  isPdfRendering: boolean;
  isPdfReady: boolean;
  hasChanges: boolean;
  scrollToPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
  isInitializing: boolean;
  pageInput: string;
  handlePageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePageInputSubmit: (e: React.FormEvent) => void;
  zoomMode: ZoomMode;
  setZoomMode: (mode: ZoomMode) => void;
  handleZoomChange: (delta: number) => void;
  getScale: () => number;
  isScaleCalculated: boolean;
  zoomInput: string;
  handleZoomInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleZoomInputSubmit: (e: React.FormEvent) => void;
  onDownload?: () => void;
  isGenerating: boolean;
  isDownloaded: boolean;
}

export const MdPreviewToolbar = ({
  viewMode,
  setViewMode,
  isAutoRender,
  setIsAutoRender,
  renderSuccess,
  handleManualRefresh,
  isPdfRendering,
  isPdfReady,
  hasChanges,
  scrollToPage,
  currentPage,
  totalPages,
  isInitializing,
  pageInput,
  handlePageInputChange,
  handlePageInputSubmit,
  zoomMode,
  setZoomMode,
  handleZoomChange,
  getScale,
  isScaleCalculated,
  zoomInput,
  handleZoomInputChange,
  handleZoomInputSubmit,
  onDownload,
  isGenerating,
  isDownloaded,
}: MdPreviewToolbarProps) => {
  return (
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
            <div className={cn(
              "absolute transition-all duration-300 ease-in-out flex items-center justify-center",
              (isInitializing || isPdfRendering) 
                ? "opacity-100 scale-100 blur-0" 
                : "opacity-0 scale-75 blur-sm pointer-events-none"
            )}>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            </div>

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
  );
};
