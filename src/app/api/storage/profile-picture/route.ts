import { NextRequest, NextResponse } from "next/server";
import { uploadProfilePicture, downloadProfilePicture } from "@/server/storage";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";

// POST /api/storage/profile-picture - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const fileRecord = await uploadProfilePicture(user, file);

    return NextResponse.json({
      success: true,
      data: fileRecord,
    } as UploadProfilePictureResponse);
  } catch (error) {
    console.error("Error in POST /api/storage/profile-picture:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/storage/profile-picture?fileId=... - Download profile picture
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      );
    }

    const blob = await downloadProfilePicture(user, fileId);

    if (!blob) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    return new Response(blob, {
      headers: {
        "Content-Type": blob.type || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/storage/profile-picture:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
