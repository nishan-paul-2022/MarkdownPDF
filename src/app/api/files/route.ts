import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

// Note: Prisma Client was regenerated to include batchId and relativePath.
// If you see errors below, please restart your IDE's TypeScript server.

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    
    console.log('🔐 File upload - Auth check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id 
    });
    
    if (!session?.user?.id) {
      console.error('❌ File upload REJECTED - No authentication');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    console.log('✅ File upload - User authenticated:', session.user.id);

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const batchId = formData.get("batchId") as string | null
    const relativePath = formData.get("relativePath") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Validate file type (markdown and related files)
    const allowedTypes = [
      "text/markdown",
      "text/plain",
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp"
    ]
    
    // Some browsers might not send correct mime types for .md files
    const isMarkdown = file.name.endsWith(".md") || file.type === "text/markdown"
    
    if (!allowedTypes.includes(file.type) && !isMarkdown) {
      return NextResponse.json(
        { error: "Invalid file type: " + file.type },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    
    // We store the file in a structure that allows linking if it's part of a batch
    // If relativePath exists, we can use it, but for storage convenience we still use UUID
    // However, if we want to preserve the structure on disk for easier Markdown processing:
    const storageKey = batchId 
      ? `uploads/${session.user.id}/${batchId}/${relativePath || file.name}`
      : `uploads/${session.user.id}/${uniqueFilename}`

    // Create upload directory if it doesn't exist
    const relativeStorageDir = batchId 
      ? join("uploads", session.user.id, batchId)
      : join("uploads", session.user.id)
      
    const uploadDir = join(process.cwd(), "public", relativeStorageDir)
    
    if (relativePath && relativePath.includes("/")) {
      const subDir = relativePath.substring(0, relativePath.lastIndexOf("/"))
      await mkdir(join(uploadDir, subDir), { recursive: true })
    } else {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(process.cwd(), "public", storageKey)
    
    console.log('💾 Saving file to disk:', filePath);
    console.log('📦 Buffer size:', buffer.length);
    await writeFile(filePath, buffer)
    
    // Verify file existence immediately
    try {
      // proper check using fs stat
      const { stat } = await import('fs/promises');
      const stats = await stat(filePath);
      console.log('✅ File saved successfully. Size on disk:', stats.size);
    } catch (verErr) {
      console.error('❌ CRITICAL: File does not exist after write!', filePath, verErr);
      throw new Error(`File write verified failed: ${filePath}`);
    }

    // Save file metadata to database (non-blocking - file is already on disk)
    let fileRecord;
    try {
      fileRecord = await prisma.file.create({
        data: {
          userId: session.user.id,
          batchId,
          filename: uniqueFilename,
          originalName: file.name,
          relativePath,
          mimeType: file.type || (isMarkdown ? "text/markdown" : "application/octet-stream"),
          size: file.size,
          storageKey,
          url: `/${storageKey}`,
        },
      })
      console.log('✅ File metadata saved to database');
    } catch (dbError) {
      console.error('⚠️ Database save failed (file still saved to disk):', dbError);
      // Create a mock record for response
      fileRecord = {
        id: uniqueFilename,
        filename: uniqueFilename,
        originalName: file.name,
        url: `/${storageKey}`,
        size: file.size,
        mimeType: file.type || (isMarkdown ? "text/markdown" : "application/octet-stream"),
        batchId,
        relativePath,
        createdAt: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        url: fileRecord.url,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        batchId: fileRecord.batchId,
        relativePath: fileRecord.relativePath,
        createdAt: fileRecord.createdAt,
      },
    })
  } catch (error: unknown) {
    console.error("File upload error detailed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to upload file: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          batchId: true,
          relativePath: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.file.count({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error("File fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    )
  }
}
