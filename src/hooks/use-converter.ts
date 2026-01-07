import { useState, useRef, useCallback, useEffect } from 'react';
import { DEFAULT_MARKDOWN_PATH, DEFAULT_METADATA, parseMetadataFromMarkdown, removeLandingPageSection, Metadata } from '@/constants/default-content';

const MAX_FILENAME_LENGTH = 30;

const getBaseName = (name: string): string => {
  return name.replace(/\.md$/i, '');
};

const getTimestampedFilename = (name: string, ext: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const dateTimeString = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  return `${getBaseName(name)}-${dateTimeString}.${ext}`;
};

export function useConverter() {
  const [rawContent, setRawContent] = useState('');
  const [content, setContent] = useState('');
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
  const [basePath, setBasePath] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      setIsEditorAtTop(textarea.scrollTop < 20);
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  const stats = (() => {
    const chars = rawContent.length;
    const words = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
    return { chars, words };
  })();

  const handleStartEdit = useCallback(() => {
    setTempFilename(getBaseName(filename));
    setIsEditing(true);
  }, [filename]);

  const handleSave = useCallback(() => {
    if (tempFilename.trim()) {
      setFilename(`${tempFilename.trim()}.md`);
    } else {
      setFilename('document.md');
    }
    setIsEditing(false);
  }, [tempFilename]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleContentChange = useCallback((newRawContent: string) => {
    setRawContent(newRawContent);
    setLastModifiedTime(new Date());
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      const parsedMetadata = parseMetadataFromMarkdown(rawContent);
      const contentWithoutLandingPage = removeLandingPageSection(rawContent);
      
      setMetadata(parsedMetadata);
      setContent(contentWithoutLandingPage);
    }, 500);

    return () => clearTimeout(timer);
  }, [rawContent, isLoading]);

  useEffect(() => {
    setIsLoading(true);
    fetch(DEFAULT_MARKDOWN_PATH)
      .then(res => res.text())
      .then(text => {
        setRawContent(text);
        const parsedMetadata = parseMetadataFromMarkdown(text);
        const contentWithoutLandingPage = removeLandingPageSection(text);
        setMetadata(parsedMetadata);
        setContent(contentWithoutLandingPage);
        const now = new Date();
        setLastModifiedTime(now);
        
        const lastSlashIndex = DEFAULT_MARKDOWN_PATH.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          setBasePath(DEFAULT_MARKDOWN_PATH.substring(0, lastSlashIndex));
        }
        
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to load default content:', err);
        setIsLoading(false);
      });
  }, []);

  const generatePdfBlob = useCallback(async (): Promise<Blob> => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: content,
        metadata: metadata,
        basePath: basePath
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    return await response.blob();
  }, [content, metadata, basePath]);

  const handleDownloadPdf = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const blob = await generatePdfBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getTimestampedFilename(filename, 'pdf');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setIsPdfDownloaded(true);
      setTimeout(() => setIsPdfDownloaded(false), 2000);
    } catch (error: unknown) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePdfBlob, filename]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
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

  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const mdFile = Array.from(files).find(f => f.name.endsWith('.md'));
      
      if (!mdFile) {
        alert("The selected folder must contain at least one .md file.");
        return;
      }

      // 1. Immediate local preview
      setFilename(mdFile.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          handleContentChange(text);
        }
      };
      reader.readAsText(mdFile);

      // 2. Upload files to server
      setIsLoading(true);
      const batchId = self.crypto.randomUUID();
      
      try {
        // Upload files in parallel
        const uploadPromises = Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('batchId', batchId);
          // Use webkitRelativePath for folder structure, fallback to name
          formData.append('relativePath', file.webkitRelativePath || file.name);
          
          try {
            const response = await fetch('/api/files', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              console.warn(`Failed to upload ${file.name}`);
              return null;
            }
            
            return await response.json();
          } catch (err) {
            console.warn(`Error uploading ${file.name}:`, err);
            return null;
          }
        });

        const results = await Promise.all(uploadPromises);
        
        // Find the uploaded markdown file to determine the correct base path for images
        const mdResult = results.find(r => r && r.file && r.file.originalName === mdFile.name);
        
        console.log('📁 Folder upload results:', results.filter(r => r !== null).map(r => ({
          originalName: r?.file?.originalName,
          url: r?.file?.url,
          relativePath: r?.file?.relativePath
        })));
        
        if (mdResult && mdResult.file && mdResult.file.url) {
           // url is typically /uploads/userId/batchId/relativePath (e.g., /uploads/userId/batchId/content-2/sample-document.md)
           // We want basePath to be /api/uploads/userId/batchId/content-2
           // This allows relative images like "./images/pic.png" to resolve to /api/uploads/userId/batchId/content-2/images/pic.png
           const fileUrl = mdResult.file.url;
           console.log('📄 Markdown file URL:', fileUrl);
           
           // Extract the directory path (remove the filename)
           const lastSlashIndex = fileUrl.lastIndexOf('/');
           if (lastSlashIndex !== -1) {
             const directoryPath = fileUrl.substring(0, lastSlashIndex);
             
             // Convert /uploads/... to /api/uploads/...
             let finalBasePath = '';
             if (directoryPath.startsWith('/uploads/')) {
               finalBasePath = '/api' + directoryPath;
             } else if (directoryPath.startsWith('uploads/')) {
               finalBasePath = '/api/' + directoryPath;
             } else {
               finalBasePath = directoryPath;
             }
             
             console.log('🗂️ Setting basePath to:', finalBasePath);
             setBasePath(finalBasePath);
           }
        }

        const now = new Date();
        setUploadTime(now);
        setLastModifiedTime(now);
        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
      } catch (error) {
        console.error("Error uploading folder batch:", error);
        // We don't alert here because the local preview might still work for text
      } finally {
        setIsLoading(false);
      }
    }
  }, [handleContentChange]);

  const triggerFileUpload = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const triggerFolderUpload = useCallback((): void => {
    folderInputRef.current?.click();
  }, []);

  const handleReset = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(DEFAULT_MARKDOWN_PATH);
      const text = await res.text();
      
      handleContentChange(text);
      setFilename('document.md');
      setUploadTime(null);
      setLastModifiedTime(new Date());
      setIsReset(true);
      setTimeout(() => setIsReset(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to reset content:', err);
    }
  }, [handleContentChange]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to copy content:', err);
    }
  }, [rawContent]);

  const handleDownloadMd = useCallback((): void => {
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

  const scrollToStart = useCallback((): void => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.setSelectionRange(0, 0);
      textareaRef.current.focus();
    }
  }, []);

  const scrollToEnd = useCallback((): void => {
    if (textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      textareaRef.current.setSelectionRange(length, length);
      textareaRef.current.focus();
    }
  }, []);

  return {
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
    getBaseName
  };
}
