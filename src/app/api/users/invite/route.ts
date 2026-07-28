import { NextRequest, NextResponse } from "next/server";
import { inviteUser, acceptInvite, getInviteByToken } from "@/server/users";
import { requireRole } from "@/server/api-auth";
import { getCurrentUser } from "@/server/authentication";
import { Role } from "@db/schema";

// POST /api/users/invite - Invite a user
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    const body = (await request.json()) as InviteUserRequest;

    if (!body.email || !body.role) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and role are required",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!["admin", "member"].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const invite = await inviteUser({
      email: body.email,
      role: body.role,
      organisationId: user.organisation.id,
    });

    return NextResponse.json({
      success: true,
      data: invite,
    } as InviteUserResponse);
  } catch (error) {
    console.error("Error in POST /api/users/invite:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/users/invite - Accept an invite (user may not have an org yet)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as AcceptInviteRequest;

    if (!body.token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const invite = await getInviteByToken(body.token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    const membership = await acceptInvite(body.token, currentUser.profile.id);

    return NextResponse.json({
      success: true,
      data: membership,
    } as AcceptInviteResponse);
  } catch (error) {
    console.error("Error in PUT /api/users/invite:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
