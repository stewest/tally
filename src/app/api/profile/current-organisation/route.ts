import { NextRequest, NextResponse } from "next/server";
import { setProfileCurrentOrganisation } from "@/server/profile";
import { getCurrentUser } from "@/server/authentication";

// PUT /api/profile/current-organisation - Set current organisation
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SetCurrentOrganisationRequest;

    await setProfileCurrentOrganisation(body.organisationId);

    return NextResponse.json({
      success: true,
    } as SetCurrentOrganisationResponse);
  } catch (error) {
    console.error("Error in PUT /api/profile/current-organisation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
