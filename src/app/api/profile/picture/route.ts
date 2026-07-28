import { NextRequest, NextResponse } from "next/server";
import { updateProfilePicture } from "@/server/profile";
import { getCurrentUser } from "@/server/authentication";

// PUT /api/profile/picture - Update profile picture
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UpdateProfilePictureRequest;

    if (!body.fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      );
    }

    const result = await updateProfilePicture(body.fileId);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.profile,
    } as UpdateProfilePictureResponse);
  } catch (error) {
    console.error("Error in PUT /api/profile/picture:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
