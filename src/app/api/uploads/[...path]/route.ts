import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import fs from "fs";
import { lookup } from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path: routePath } = await params;
  
  if (!routePath || routePath.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Security check: ensure no path traversal
  const safePath = routePath.join("/");
  if (safePath.includes("..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Map /api/uploads/xxx to public/uploads/xxx
  // Note: routePath will be ["user-id", "batch-id", "filename.png"] or similar
  // We assume the route is /api/uploads/[...path]
  
  console.log('🔍 Uploads API - Requested path:', routePath);
  
  // Construct absolute path to file
  const uploadsDir = join(process.cwd(), "public", "uploads");
  const filePath = join(uploadsDir, ...routePath);
  
  console.log('📂 Uploads API - Looking for file at:', filePath);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = lookup(filePath) || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
