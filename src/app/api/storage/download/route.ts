import { NextRequest, NextResponse } from "next/server";
import { downloadFile } from "@/server/storage";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";

// GET /api/storage/download?fileId=...&storagePath=... - Download a file
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const storagePath = searchParams.get("storagePath");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      );
    }

    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: "Storage path is required" },
        { status: 400 }
      );
    }

    const blob = await downloadFile(user, storagePath, fileId);

    if (!blob) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    return new Response(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Content-Disposition": "attachment",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/storage/download:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
