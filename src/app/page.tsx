'use client';

import Image from 'next/image';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MdPreview } from '@/components/md-preview';
import { DEFAULT_MARKDOWN_PATH, DEFAULT_METADATA } from '@/constants/default-content';
import { ChevronDown, ChevronUp, FileCode, Upload, RotateCcw, ChevronsUp, ChevronsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [showPdfControls, setShowPdfControls] = useState(true);
  const [filename, setFilename] = useState('document.md');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    fetch(DEFAULT_MARKDOWN_PATH)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error('Failed to load default content:', err));
  }, []);

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const generatePdfBlob = async () => {
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
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePdfBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pki-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleReset = async () => {
    try {
      const res = await fetch(DEFAULT_MARKDOWN_PATH);
      const text = await res.text();
      setContent(text);
      setMetadata(DEFAULT_METADATA);
      setFilename('document.md');
    } catch (err) {
      console.error('Failed to reset content:', err);
    }
  };

  const scrollToStart = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.setSelectionRange(0, 0);
      textareaRef.current.focus();
    }
  };

  const scrollToEnd = () => {
    if (textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      textareaRef.current.setSelectionRange(length, length);
      textareaRef.current.focus();
    }
  };

  const validateMetadata = () => {
    return !!(
      metadata.title?.trim() &&
      metadata.subtitle?.trim() &&
      metadata.course?.trim() &&
      metadata.name?.trim() &&
      metadata.roll?.trim() &&
      metadata.reg?.trim() &&
      metadata.batch?.trim() &&
      metadata.date?.trim()
    );
  };

  const isMetadataValid = validateMetadata();

  return (
    <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      {/* Floating Branding Island */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all hover:scale-105 hover:bg-slate-900 duration-300 group select-none">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Image src="/brand-logo.svg" alt="Logo" width={24} height={24} className="w-6 h-6 object-contain relative z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>
        <h1 className="text-sm font-medium tracking-wide text-slate-300/90 group-hover:text-slate-100 transition-colors">
          MarkdownPDF
        </h1>
      </div>

      {/* Main Content Area - Full Height */}
      <div className="flex-grow flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Editor Side */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
          <div
            className="h-12 bg-slate-900/80 pl-4 pr-2 border-b border-slate-800 flex items-center justify-between transition-colors backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200 uppercase tracking-wider">
                <FileCode className="w-3.5 h-3.5" /> Markdown
              </div>

              {/* Filename Input */}
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="flex-1 h-7 px-3 bg-slate-800/40 border border-white/5 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all shadow-inner"
                  placeholder="filename.md"
                />
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1 bg-slate-800/40 rounded-lg p-1 border border-white/5 shadow-inner">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollToStart}
                  className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 border border-transparent hover:border-white/5"
                  title="Jump to Start"
                >
                  <ChevronsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollToEnd}
                  className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200 border border-transparent hover:border-white/5"
                  title="Jump to End"
                >
                  <ChevronsDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="file"
                accept=".md"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}
                className="h-7 px-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-100 hover:bg-white/10 active:scale-95 transition-all duration-200 rounded-md border border-transparent hover:border-white/5"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload MD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="h-7 px-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-100 hover:bg-white/10 active:scale-95 transition-all duration-200 rounded-md border border-transparent hover:border-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Default
              </Button>

              <div className="w-px h-3 bg-slate-800 mx-1" />

              <div
                className={cn(
                  "h-7 w-7 cursor-pointer rounded-md transition-all duration-200 active:scale-95 group flex items-center justify-center border",
                  isSettingsOpen
                    ? "bg-white/20 text-white border-white/20 shadow-inner"
                    : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200"
                )}
                title={isSettingsOpen ? "Hide Markdown Options" : "Show Markdown Options"}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                {isSettingsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>

          {isSettingsOpen && (
            <div className="p-4 bg-slate-900/30 border-b border-slate-800 transition-all duration-300 ease-in-out">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Course Name</label>
                  <input
                    name="course"
                    value={metadata.course}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.course?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Submission Date</label>
                  <input
                    name="date"
                    value={metadata.date}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.date?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Name</label>
                  <input
                    name="name"
                    value={metadata.name}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.name?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Roll No</label>
                  <input
                    name="roll"
                    value={metadata.roll}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.roll?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Reg No</label>
                  <input
                    name="reg"
                    value={metadata.reg}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.reg?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Batch</label>
                  <input
                    name="batch"
                    value={metadata.batch}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.batch?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Cover Title</label>
                  <input
                    name="title"
                    value={metadata.title}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.title?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block uppercase">Cover Subtitle</label>
                  <input
                    name="subtitle"
                    value={metadata.subtitle}
                    onChange={handleMetadataChange}
                    className={cn(
                      "w-full bg-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:ring-1",
                      metadata.subtitle?.trim() ? "border-slate-700 focus:ring-primary" : "border-red-500/50 focus:ring-red-500"
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex-grow relative overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none border-none p-6 font-mono text-sm focus-visible:ring-0 bg-slate-950 text-slate-300 selection:bg-primary/30 custom-scrollbar dark-editor"
              placeholder="Write your markdown here..."
            />
          </div>
        </div>

        {/* Preview Side */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/20">
          <MdPreview
            content={content}
            metadata={metadata}
            showToolbar={true}
            onDownload={handleDownloadPdf}
            onGeneratePdf={generatePdfBlob}
            isGenerating={isGenerating}
            isMetadataValid={isMetadataValid}
          />
        </div>
      </div>
    </main>
  );
}

