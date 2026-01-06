"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Image as ImageIcon, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export function FileUpload() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const items = Array.from(e.dataTransfer.items)
    const newFiles: File[] = []

    const traverseFileTree = async (item: FileSystemEntry, path = "") => {
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          ;(item as FileSystemFileEntry).file((file) => {
            // Create a new File object with the relative path prepended to the name
            // or use a custom property that we can use later
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + file.name,
              writable: false
            })
            newFiles.push(file)
            resolve()
          })
        })
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader()
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          dirReader.readEntries((entries) => resolve(Array.from(entries)))
        })
        for (const entry of entries) {
          await traverseFileTree(entry, path + item.name + "/")
        }
      }
    }

    const itemPromises = items.map(item => {
      const entry = item.webkitGetAsEntry()
      if (entry) return traverseFileTree(entry)
      return Promise.resolve()
    })

    await Promise.all(itemPromises)

    // Validation for folders/batches
    if (newFiles.length > 1) {
      const hasMarkdown = newFiles.some(f => f.name.endsWith('.md'))
      if (!hasMarkdown) {
        alert("Dropped folder/files must contain at least one .md file.")
        return
      }
    }

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      // If it's a folder upload (detected by presence of webkitRelativePath on the first file)
      const isFolder = selectedFiles.length > 0 && selectedFiles[0].webkitRelativePath !== ""
      
      if (isFolder) {
        const hasMarkdown = selectedFiles.some(f => f.name.endsWith('.md'))
        if (!hasMarkdown) {
          alert("The selected folder must contain at least one .md file.")
          return
        }
      }

      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a single batch for all files if they were uploaded together
      const batchId = crypto.randomUUID()
      const totalFiles = files.length
      let uploadedCount = 0

      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("batchId", batchId)
        // webkitRelativePath is available if it was a folder upload
        const webkitFile = file as File & { webkitRelativePath?: string }
        if (webkitFile.webkitRelativePath) {
          formData.append("relativePath", webkitFile.webkitRelativePath)
        }

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        uploadedCount++
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100))
      }

      // Clear files and refresh
      setFiles([])
      setUploadProgress(0)
      router.refresh()
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-green-500" />
  }

  return (
    <div className="space-y-4">
      {/* Selection Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1 h-28 flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="h-6 w-6 text-blue-500" />
          <span className="font-semibold">Upload Markdown</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">.md files only</span>
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-28 flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="h-6 w-6 text-amber-500" />
          <span className="font-semibold">Upload Folder</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Contains .md & images/</span>
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".md"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handleFileSelect}
      />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
            : "border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/50",
          files.length > 0 && "hidden"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="relative inline-block mb-4">
          <Upload className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
        <p className="text-lg font-semibold mb-2">
          Drop files or folder here
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          We&apos;ll automatically detect if it&apos;s a single Markdown file or a structured project folder.
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Selected items ({files.length})</h3>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])} disabled={uploading} className="h-8 text-xs">
              Clear All
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {(file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Uploading project...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full shadow-lg"
            size="lg"
          >
            {uploading ? "Processing Batch..." : `Upload ${files.length} Item${files.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  )
}
