import { NextRequest, NextResponse } from "next/server";
import { getUserMemberships } from "@/server/membership";
import { getCurrentUser } from "@/server/authentication";

// GET /api/memberships - Get user memberships (user may not have an active org)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const memberships = await getUserMemberships(currentUser.profile.id);

    return NextResponse.json({
      success: true,
      data: memberships,
    } as GetUserMembershipsResponse);
  } catch (error) {
    console.error("Error in GET /api/memberships:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
