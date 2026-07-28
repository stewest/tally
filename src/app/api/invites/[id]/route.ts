import { NextRequest, NextResponse } from "next/server";
import { cancelInvite, resendInvite } from "@/server/users";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";
import { RouteParams } from "../../types";

// DELETE /api/invites/[id] - Cancel an invite
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    await cancelInvite(id);

    return NextResponse.json({
      success: true,
    } as CancelInviteResponse);
  } catch (error) {
    console.error("Error in DELETE /api/invites/[id]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/invites/[id] - Resend an invite
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    await resendInvite(id);

    return NextResponse.json({
      success: true,
    } as ResendInviteResponse);
  } catch (error) {
    console.error("Error in POST /api/invites/[id]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
