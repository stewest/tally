import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, updateProfile } from "@/server/profile";
import { getCurrentUser } from "@/server/authentication";

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    } as GetUserProfileResponse);
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UpdateProfileRequest;

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (body.firstName && body.firstName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "First name cannot be empty" },
        { status: 400 }
      );
    }

    if (body.lastName && body.lastName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Last name cannot be empty" },
        { status: 400 }
      );
    }

    const result = await updateProfile(body);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.profile,
    } as UpdateProfileResponse);
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
