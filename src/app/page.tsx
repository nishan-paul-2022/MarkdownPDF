'use client';

import Image from 'next/image';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MdPreview } from '@/components/md-preview';
import { Editor } from '@/components/editor';
import { DEFAULT_MARKDOWN_PATH, DEFAULT_METADATA, parseMetadataFromMarkdown, removeLandingPageSection, Metadata } from '@/constants/default-content';
import { FileCode, Upload, RotateCcw, ChevronsUp, ChevronsDown, PencilLine, Check, X, Copy, Download, Eye, MoreVertical } from 'lucide-react';
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

const MAX_FILENAME_LENGTH = 30;

// Get filename without extension for display
const getBaseName = (name: string) => {
  return name.replace(/\.md$/i, '');
};

// Get filename with timestamp for downloads
const getTimestampedFilename = (name: string, ext: string) => {
  const now = new Date();
  // Format: YYYY-MM-DD-HH-mm-ss using local time
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const dateTimeString = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  return `${getBaseName(name)}-${dateTimeString}.${ext}`;
};

export default function Home() {
  const [rawContent, setRawContent] = useState(''); // Full markdown including Landing Page section
  const [content, setContent] = useState(''); // Content without Landing Page section
  const [metadata, setMetadata] = useState<Metadata>(DEFAULT_METADATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filename, setFilename] = useState('document.md');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [tempFilename, setTempFilename] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [uploadTime, setUploadTime] = useState<Date | null>(null);
  const [lastModifiedTime, setLastModifiedTime] = useState<Date | null>(null);
  const [isEditorAtTop, setIsEditorAtTop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track scroll position for status bar visibility
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      setIsEditorAtTop(textarea.scrollTop < 20);
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  // Stats calculation
  const stats = React.useMemo(() => {
    const chars = rawContent.length;
    const words = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
    return { chars, words };
  }, [rawContent]);

  const formatDateTime = (date: Date | null) => {
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




  // Calculate input width based on content
  const getInputWidth = (name: string) => {
    const charCount = name.length || 8; // minimum 8 chars for "document"
    return `${Math.max(charCount * 0.65, 5)}rem`; // ~0.65rem per character, min 5rem
  };

  const handleStartEdit = () => {
    setTempFilename(getBaseName(filename));
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempFilename.trim()) {
      setFilename(`${tempFilename.trim()}.md`);
    } else {
      setFilename('document.md');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };


  // Buffer state to keep the Editor "Butter Smooth"
  // We don't update the Live Preview on every keystroke
  const handleContentChange = useCallback((newRawContent: string) => {
    setRawContent(newRawContent);
    setLastModifiedTime(new Date());
  }, []);

  // Debounce the heavy content processing
  React.useEffect(() => {
    if (isLoading) return; // Don't debounce if still loading initial content

    const timer = setTimeout(() => {
      const parsedMetadata = parseMetadataFromMarkdown(rawContent);
      const contentWithoutLandingPage = removeLandingPageSection(rawContent);
      
      setMetadata(parsedMetadata);
      setContent(contentWithoutLandingPage);
    }, 500); // 500ms delay for Live Preview to keep editor snappy

    return () => clearTimeout(timer);
  }, [rawContent, isLoading]);

  React.useEffect(() => {
    setIsLoading(true);
    fetch(DEFAULT_MARKDOWN_PATH)
      .then(res => res.text())
      .then(text => {
        setRawContent(text);
        // Immediate update for first load
        const parsedMetadata = parseMetadataFromMarkdown(text);
        const contentWithoutLandingPage = removeLandingPageSection(text);
        setMetadata(parsedMetadata);
        setContent(contentWithoutLandingPage);
        const now = new Date();
        setLastModifiedTime(now);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load default content:', err);
        setIsLoading(false);
      });
  }, []);



  const generatePdfBlob = useCallback(async () => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: content,
        metadata: metadata
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    return await response.blob();
  }, [content, metadata]);

  const handleDownloadPdf = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePdfBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename with date and time
      a.download = getTimestampedFilename(filename, 'pdf');

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setIsPdfDownloaded(true);
      setTimeout(() => setIsPdfDownloaded(false), 2000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePdfBlob, filename]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          handleContentChange(text);
          const now = new Date();
          setUploadTime(now);
          setLastModifiedTime(now);
          setIsUploaded(true);
          setTimeout(() => setIsUploaded(false), 2000);
        }
      };
      reader.readAsText(file);
    }
  }, [handleContentChange]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReset = useCallback(async () => {
    try {
      const res = await fetch(DEFAULT_MARKDOWN_PATH);
      const text = await res.text();
      
      handleContentChange(text);
      setFilename('document.md');
      setUploadTime(null);
      setLastModifiedTime(new Date());
      setIsReset(true);
      setTimeout(() => setIsReset(false), 2000);
    } catch (err) {
      console.error('Failed to reset content:', err);
    }
  }, [handleContentChange]);

  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  }, [rawContent]);

  // No loading state needed for client-side blob generation - it should be instant
  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([rawContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getTimestampedFilename(filename, 'md');
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  }, [rawContent, filename]);

  const scrollToStart = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.setSelectionRange(0, 0);
      textareaRef.current.focus();
    }
  }, []);

  const scrollToEnd = useCallback(() => {
    if (textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      textareaRef.current.setSelectionRange(length, length);
      textareaRef.current.focus();
    }
  }, []);



  return (
    <TooltipProvider>
      <main className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative">
        {/* Header */}
        {/* Floating Branding Island */}
        <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-[60] flex items-center gap-3 px-3 lg:px-4 h-7 lg:h-8 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-full shadow-lg transition-all hover:bg-slate-900 duration-300 group select-none">
          <div className="relative">
            <Image src="/brand-logo.svg" alt="Logo" width={18} height={18} className="w-4.5 h-4.5 object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h1 className="text-xs font-medium tracking-wide text-slate-400 group-hover:text-slate-100 transition-colors duration-300">
            Markify
          </h1>
        </div>

        {/* Mobile View Toggle */}
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
            
            {/* Animated Slider Background */}
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
          {/* Editor Side */}
          <div className={`flex-1 flex flex-col border-r border-slate-800/50 overflow-hidden transition-all duration-300 ${
            activeTab === 'editor' ? 'flex tab-enter' : 'hidden lg:flex'
          }`}>
            <div
              className="h-12 bg-slate-900/80 px-4 border-b border-slate-800 flex items-center justify-between transition-colors backdrop-blur-sm"
            >
              {/* Left Section - Filename Badge */}
              <div className="flex items-center gap-3">
                {/* Filename Badge - Hidden on very small mobile screens */}
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

              {/* Right Section - Actions & Controls */}
              <div className="flex items-center gap-2 lg:gap-5">
                {/* Navigation Group */}
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

                {/* Group 1: File Operations (IO) */}
                <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <input
                    type="file"
                    accept=".md"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}
                        className="h-6 w-24 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isUploaded ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                        {isUploaded ? 'Uploaded' : 'Upload'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Markdown</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownloadMd(); }}
                        className="h-6 w-28 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isDownloaded ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                        {isDownloaded ? 'Downloaded' : 'Download'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Source</TooltipContent>
                  </Tooltip>
                </div>

                {/* Group 2: Editor Utilities (Buffer) - Hidden on mobile, in dropdown */}
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

                {/* Mobile Overflow Menu */}
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
              {/* Floating Status Info - Visible only at top */}
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

          {/* Preview Side */}
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
            />
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
