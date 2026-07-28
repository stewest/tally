import { NextRequest, NextResponse } from "next/server";
import { getInviteByToken } from "@/server/users";

// GET /api/invites/by-token?token=xxx — public endpoint (no auth required)
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const invite = await getInviteByToken(token);

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invite,
    } as GetInviteByTokenResponse);
  } catch (error) {
    console.error("Error in GET /api/invites/by-token:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
