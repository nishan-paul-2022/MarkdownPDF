import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface FileListResponse {
  files: File[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useFiles() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch("/api/files");
      if (!response.ok) throw new Error("Failed to fetch files");
      
      const data: FileListResponse = await response.json();
      setFiles(data.files);
    } catch (error: unknown) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete file");
      }

      setFiles((prev) => prev.filter((file) => file.id !== id));
      router.refresh();
    } catch (error: unknown) {
      console.error("Delete error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete file");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [router]);

  return {
    files,
    loading,
    deleteId,
    deleting,
    setDeleteId,
    handleDelete,
    refreshFiles: fetchFiles
  };
}
