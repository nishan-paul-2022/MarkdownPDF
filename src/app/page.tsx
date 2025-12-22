'use client';

import Image from 'next/image';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MdPreview } from '@/components/md-preview';
import { DEFAULT_MARKDOWN_PATH, DEFAULT_METADATA, parseMetadataFromMarkdown, removeLandingPageSection, Metadata } from '@/constants/default-content';
import { FileCode, Upload, RotateCcw, ChevronsUp, ChevronsDown, PencilLine } from 'lucide-react';

export default function Home() {
  const [rawContent, setRawContent] = useState(''); // Full markdown including Landing Page section
  const [content, setContent] = useState(''); // Content without Landing Page section
  const [metadata, setMetadata] = useState<Metadata>(DEFAULT_METADATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filename, setFilename] = useState('document.md');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get filename without extension for display
  const getBaseName = (name: string) => {
    return name.replace(/\.md$/i, '');
  };

  // Update filename with .md extension
  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const baseName = e.target.value;
    setFilename(baseName ? `${baseName}.md` : 'document.md');
  };

  // Calculate input width based on content
  const getInputWidth = () => {
    const baseName = getBaseName(filename);
    const charCount = baseName.length || 8; // minimum 8 chars for "document"
    return `${Math.max(charCount * 0.6, 5)}rem`; // ~0.6rem per character, min 5rem
  };

  // Parse metadata from markdown whenever rawContent changes
  React.useEffect(() => {
    const parsedMetadata = parseMetadataFromMarkdown(rawContent);
    const contentWithoutLandingPage = removeLandingPageSection(rawContent);
    
    setMetadata(parsedMetadata);
    setContent(contentWithoutLandingPage);
  }, [rawContent]);

  React.useEffect(() => {
    fetch(DEFAULT_MARKDOWN_PATH)
      .then(res => res.text())
      .then(text => setRawContent(text))
      .catch(err => console.error('Failed to load default content:', err));
  }, []);



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

      // Generate filename with date and time
      const now = new Date();
      const dateTimeString = now.toISOString()
        .replace(/T/, '-')
        .replace(/:/g, '-')
        .replace(/\..+/, ''); // Format: YYYY-MM-DD-HH-MM-SS
      const baseName = getBaseName(filename);
      a.download = `${baseName}-${dateTimeString}.pdf`;

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
          setRawContent(text);
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
      setRawContent(text);
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
      metadata.university?.trim() &&
      metadata.program?.trim() &&
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
      <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-2 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all hover:scale-105 hover:bg-slate-900 duration-300 group select-none">
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
            className="h-12 bg-slate-900/80 px-4 border-b border-slate-800 flex items-center justify-between transition-colors backdrop-blur-sm"
          >
            {/* Left Section - Label & Filename Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200 uppercase tracking-wider">
                <FileCode className="w-3.5 h-3.5" /> Markdown
              </div>

              {/* Filename Badge */}
              <div className="group flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 hover:bg-slate-800/70 border border-white/5 hover:border-white/10 rounded-full transition-all duration-200">
                <input
                  type="text"
                  value={getBaseName(filename)}
                  onChange={handleFilenameChange}
                  style={{ width: getInputWidth() }}
                  className="bg-transparent border-none outline-none text-xs text-slate-300 placeholder:text-slate-500 transition-all duration-200"
                  placeholder="document"
                />
                <PencilLine className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>

            {/* Right Section - Actions & Controls */}
            <div className="flex items-center gap-2">
              {/* Navigation Controls */}
              <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-lg p-0.5 border border-white/5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollToStart}
                  className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200"
                  title="Jump to Start (Ctrl+Home)"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollToEnd}
                  className="h-7 w-7 rounded-md text-slate-500 hover:bg-white/10 hover:text-slate-100 active:scale-90 transition-all duration-200"
                  title="Jump to End (Ctrl+End)"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="w-px h-4 bg-slate-700/50" />

              {/* File Actions */}
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
                className="h-7 px-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-100 hover:bg-white/10 active:scale-95 transition-all duration-200 rounded-md"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="h-7 px-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-100 hover:bg-white/10 active:scale-95 transition-all duration-200 rounded-md"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>


            </div>
          </div>

          <div className="flex-grow relative overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
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

