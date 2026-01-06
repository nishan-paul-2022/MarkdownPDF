'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import MdPreview from '@/components/MdPreview';
import Editor from '@/components/Editor';
import { FileCode, Upload, RotateCcw, ChevronsUp, ChevronsDown, PencilLine, Check, X, Copy, Download, Eye, MoreVertical, FolderOpen } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import UserNav from '@/components/UserNav';
import { Metadata } from '@/constants/default-content';

interface ConverterViewProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  rawContent: string;
  content: string;
  metadata: Metadata;
  isGenerating: boolean;
  filename: string;
  isEditing: boolean;
  isUploaded: boolean;
  isReset: boolean;
  tempFilename: string;
  activeTab: 'editor' | 'preview';
  uploadTime: Date | null;
  lastModifiedTime: Date | null;
  isEditorAtTop: boolean;
  isLoading: boolean;
  basePath: string;
  isCopied: boolean;
  isDownloaded: boolean;
  isPdfDownloaded: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  stats: {
    chars: number;
    words: number;
  };
  setActiveTab: (tab: 'editor' | 'preview') => void;
  setTempFilename: (name: string) => void;
  handleStartEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleContentChange: (content: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileUpload: () => void;
  triggerFolderUpload: () => void;
  handleReset: () => void;
  handleCopy: () => void;
  handleDownloadMd: () => void;
  handleDownloadPdf: () => void;
  generatePdfBlob: () => Promise<Blob>;
  scrollToStart: () => void;
  scrollToEnd: () => void;
  MAX_FILENAME_LENGTH: number;
  getBaseName: (name: string) => string;
}

export function ConverterView({
  user,
  rawContent,
  content,
  metadata,
  isGenerating,
  filename,
  isEditing,
  isUploaded,
  isReset,
  tempFilename,
  activeTab,
  uploadTime,
  lastModifiedTime,
  isEditorAtTop,
  isLoading,
  basePath,
  isCopied,
  isDownloaded,
  isPdfDownloaded,
  fileInputRef,
  folderInputRef,
  textareaRef,
  stats,
  setActiveTab,
  setTempFilename,
  handleStartEdit,
  handleSave,
  handleCancel,
  handleContentChange,
  handleFileUpload,
  handleFolderUpload,
  triggerFileUpload,
  triggerFolderUpload,
  handleReset,
  handleCopy,
  handleDownloadMd,
  handleDownloadPdf,
  generatePdfBlob,
  scrollToStart,
  scrollToEnd,
  MAX_FILENAME_LENGTH,
  getBaseName,
}: ConverterViewProps) {
  const formatDateTime = (date: Date | null): string => {
    if (!date) return '—';
    return date.toLocaleTimeString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  const getInputWidth = (name: string): string => {
    const charCount = name.length || 8;
    return `${Math.max(charCount * 0.65, 5)}rem`;
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <TooltipProvider>
      <main className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative">
        <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-[60] flex items-center gap-3">
             <UserNav user={user} />
        </div>

        <div className="lg:hidden p-3 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 flex justify-center">
          <div className="flex items-center p-1 bg-slate-900/50 border border-white/5 rounded-xl w-full max-w-sm shadow-inner relative overflow-hidden">
            <button
              onClick={() => setActiveTab('editor')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
                activeTab === 'editor' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'editor' ? 'scale-110' : ''}`} /> 
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
                activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Eye className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'preview' ? 'scale-110' : ''}`} /> 
              <span>Preview</span>
            </button>
            
            <div 
              className="absolute top-1 bottom-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white/10 rounded-lg shadow-sm"
              style={{
                width: 'calc(50% - 4px)',
                left: activeTab === 'editor' ? '4px' : 'calc(50% + 0px)',
              }}
            />
          </div>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row gap-0 overflow-hidden relative">
          <div className={`flex-1 flex flex-col border-r border-slate-800/50 overflow-hidden transition-all duration-300 ${
            activeTab === 'editor' ? 'flex tab-enter' : 'hidden lg:flex'
          }`}>
            <div
              className="h-12 bg-slate-900/80 px-4 border-b border-slate-800 flex items-center justify-between transition-colors backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`group hidden sm:flex items-center gap-1.5 px-3 h-7 rounded-full transition-all duration-200 border ${
                    isEditing 
                      ? 'bg-slate-800 border-primary/50 ring-1 ring-primary/20' 
                      : 'bg-slate-800/50 hover:bg-slate-800/70 border-white/5 hover:border-white/10'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempFilename}
                            onChange={(e) => {
                              if (e.target.value.length <= MAX_FILENAME_LENGTH) {
                                setTempFilename(e.target.value);
                              }
                            }}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                              setTimeout(handleSave, 200);
                            }}
                            autoFocus
                            maxLength={MAX_FILENAME_LENGTH}
                            style={{ width: getInputWidth(tempFilename) }}
                            className="bg-transparent border-none outline-none text-xs font-medium placeholder:text-slate-500 text-slate-100 h-6 flex items-center focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="document"
                          />
                        <span className="text-[10px] tabular-nums select-none opacity-40 font-medium text-slate-400">
                          {tempFilename.length}/{MAX_FILENAME_LENGTH}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 border-l border-slate-700 ml-1 pl-1">
                        <Button 
                          variant="ghost"
                          size="icon"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); handleSave(); }}
                          className="h-6 w-6 p-0 cursor-pointer text-green-400/80 hover:text-green-400 hover:bg-green-400/10 rounded-full transition-all border-transparent"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                          className="h-6 w-6 p-0 cursor-pointer text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all border-transparent"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-slate-300 font-medium">
                        {getBaseName(filename)}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-full transition-all cursor-pointer ml-2"
                          >
                            <PencilLine className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rename File</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-5">
                <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={scrollToStart}
                        className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-90 transition-all duration-200"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Scroll to Top</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={scrollToEnd}
                        className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-90 transition-all duration-200"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Scroll to Bottom</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <input
                    type="file"
                    accept=".md"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={folderInputRef}
                    className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                    onChange={handleFolderUpload}
                  />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}
                        className="h-6 w-16 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isUploaded ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Upload className="w-3 h-3 mr-1" />}
                        File
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload .md File</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); triggerFolderUpload(); }}
                        className="h-6 w-20 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        <FolderOpen className="w-3 h-3 mr-1 text-amber-500/70" />
                        Folder
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Folder (.md + images)</TooltipContent>
                  </Tooltip>

                  <div className="w-[1px] h-3 bg-white/10 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownloadMd(); }}
                        className="h-6 w-24 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isDownloaded ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Download className="w-3 h-3 mr-1" />}
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Source</TooltipContent>
                  </Tooltip>
                </div>

                <div className="hidden md:flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="h-6 w-20 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Source</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="h-6 w-20 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isReset ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                        {isReset ? 'Done' : 'Reset'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset Content</TooltipContent>
                  </Tooltip>
                </div>

                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 min-w-40">
                      <DropdownMenuItem onClick={handleCopy} className="gap-2 text-xs">
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copied' : 'Copy Source'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleReset} className="gap-2 text-xs">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Content
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </div>
            </div>

            <div className="flex-grow relative overflow-hidden group/editor">
              <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 h-9 bg-transparent text-[10px] font-medium tracking-tight select-none pointer-events-none transition-opacity duration-75 ${isEditorAtTop ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 group/stat">
                    <span className="uppercase tracking-widest text-[9px] font-bold text-slate-500/80">Words</span>
                    <span className="tabular-nums text-slate-300">{stats.words}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group/stat">
                    <span className="uppercase tracking-widest text-[9px] font-bold text-slate-500/80">Characters</span>
                    <span className="tabular-nums text-slate-300">{stats.chars}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {uploadTime && (
                    <div className="flex items-center gap-1.5 group/stat">
                      <span className="uppercase tracking-widest text-[9px] font-bold text-blue-400/50">Uploaded</span>
                      <span className="tabular-nums text-slate-300">{formatDateTime(uploadTime)}</span>
                    </div>
                  )}
                  {lastModifiedTime && (
                    <div className="flex items-center gap-1.5 group/stat">
                      <span className="uppercase tracking-widest text-[9px] font-bold text-emerald-400/50">Modified</span>
                      <span className="tabular-nums text-slate-300">{formatDateTime(lastModifiedTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Editor
                innerRef={textareaRef}
                value={rawContent}
                onChange={handleContentChange}
                className="absolute inset-0 w-full h-full resize-none border-none p-4 lg:p-6 pt-10 lg:pt-10 font-mono text-sm focus-visible:ring-0 bg-slate-950 text-slate-300 selection:bg-primary/30 custom-scrollbar dark-editor"
                placeholder="Write your markdown here..."
              />
            </div>
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden bg-slate-900/10 transition-all duration-300 ${
            activeTab === 'preview' ? 'flex tab-enter' : 'hidden lg:flex'
          }`}>
            <MdPreview
              content={content}
              metadata={metadata}
              showToolbar={true}
              onDownload={handleDownloadPdf}
              onGeneratePdf={generatePdfBlob}
              isGenerating={isGenerating}
              isDownloaded={isPdfDownloaded}
              isLoading={isLoading}
              basePath={basePath}
            />
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
