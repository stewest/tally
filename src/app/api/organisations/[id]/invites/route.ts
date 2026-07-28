import { NextRequest, NextResponse } from "next/server";
import { getInvitesForOrganisation } from "@/server/users";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";
import { RouteParams } from "@/app/api/types";

// GET /api/organisations/[id]/invites - Get invites for organisation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    const invites = await getInvitesForOrganisation(user.organisation.id);

    return NextResponse.json({
      success: true,
      data: invites,
    } as GetInvitesForOrganisationResponse);
  } catch (error) {
    console.error("Error in GET /api/organisations/[id]/invites:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
