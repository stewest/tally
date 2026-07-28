import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/authentication";

// GET /api/auth/current-user - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: currentUser,
    } as GetCurrentUserResponse);
  } catch (error) {
    console.error("Error in GET /api/auth/current-user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
