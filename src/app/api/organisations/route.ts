import { NextRequest, NextResponse } from "next/server";
import {
  getMemberOrganisations,
  createOrganisation,
} from "@/server/organisation";
import { getCurrentUser } from "@/server/authentication";

// GET /api/organisations - Get member organisations (user may not have an active org)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await getMemberOrganisations(currentUser.profile.id);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.organisations,
    } as GetMemberOrganisationsResponse);
  } catch (error) {
    console.error("Error in GET /api/organisations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/organisations - Create new organisation (user may not have an active org)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateOrganisationRequest;

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Organisation name is required" },
        { status: 400 }
      );
    }

    const result = await createOrganisation(body.name.trim(), currentUser.profile.id);

    return NextResponse.json({
      success: true,
      data: result,
    } as CreateOrganisationResponse);
  } catch (error) {
    console.error("Error in POST /api/organisations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
