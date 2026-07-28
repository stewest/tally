import { NextRequest, NextResponse } from "next/server";
import { updateUserRole, removeUser } from "@/server/users";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";
import { RouteParams } from "../../types";

// PUT /api/memberships/[id] - Update user role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    const body = (await request.json()) as UpdateUserRoleRequest;

    if (!body.newRole) {
      return NextResponse.json(
        { success: false, error: "New role is required" },
        { status: 400 }
      );
    }

    if (!["admin", "member"].includes(body.newRole)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const membership = await updateUserRole(id, body.newRole);

    return NextResponse.json({
      success: true,
      data: membership,
    } as UpdateUserRoleResponse);
  } catch (error) {
    console.error("Error in PUT /api/memberships/[id]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/memberships/[id] - Remove user from organisation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    await removeUser(id);

    return NextResponse.json({
      success: true,
    } as RemoveUserResponse);
  } catch (error) {
    console.error("Error in DELETE /api/memberships/[id]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
