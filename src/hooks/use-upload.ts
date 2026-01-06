import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export function useUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = Array.from(e.dataTransfer.items);
    const newFiles: File[] = [];

    const traverseFileTree = async (item: FileSystemEntry, path = "") => {
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          ;(item as FileSystemFileEntry).file((file) => {
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + file.name,
              writable: false
            });
            newFiles.push(file);
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          dirReader.readEntries((entries) => resolve(Array.from(entries)));
        });
        for (const entry of entries) {
          await traverseFileTree(entry, path + item.name + "/");
        }
      }
    };

    const itemPromises = items.map(item => {
      const entry = item.webkitGetAsEntry();
      if (entry) return traverseFileTree(entry);
      return Promise.resolve();
    });

    await Promise.all(itemPromises);

    if (newFiles.length > 1) {
      const hasMarkdown = newFiles.some(f => f.name.endsWith('.md'));
      if (!hasMarkdown) {
        alert("Dropped folder/files must contain at least one .md file.");
        return;
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const isFolder = selectedFiles.length > 0 && selectedFiles[0].webkitRelativePath !== "";
      
      if (isFolder) {
        const hasMarkdown = selectedFiles.some(f => f.name.endsWith('.md'));
        if (!hasMarkdown) {
          alert("The selected folder must contain at least one .md file.");
          return;
        }
      }

      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = async (): Promise<void> => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const batchId = crypto.randomUUID();
      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("batchId", batchId);
        const webkitFile = file as File & { webkitRelativePath?: string };
        if (webkitFile.webkitRelativePath) {
          formData.append("relativePath", webkitFile.webkitRelativePath);
        }

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      setFiles([]);
      setUploadProgress(0);
      router.refresh();
    } catch (error: unknown) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return {
    isDragging,
    files,
    uploading,
    uploadProgress,
    fileInputRef,
    folderInputRef,
    setFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeFile,
    uploadFiles
  };
}
