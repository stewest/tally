import { NextRequest, NextResponse } from "next/server";
import { getUserProfilesForOrganisation } from "@/server/profile";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";
import { RouteParams } from "@/app/api/types";

// GET /api/organisations/[id]/users - Get user profiles for organisation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const userProfiles = await getUserProfilesForOrganisation(user.organisation.id);

    return NextResponse.json({
      success: true,
      data: userProfiles,
    } as GetUserProfilesForOrganisationResponse);
  } catch (error) {
    console.error("Error in GET /api/organisations/[id]/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
