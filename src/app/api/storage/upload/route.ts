import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/server/storage";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";

// POST /api/storage/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storagePath = formData.get("storagePath") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: "Storage path is required" },
        { status: 400 }
      );
    }

    const fileRecord = await uploadFile(user, file, storagePath);

    return NextResponse.json({
      success: true,
      data: fileRecord,
    } as UploadFileResponse);
  } catch (error) {
    console.error("Error in POST /api/storage/upload:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
