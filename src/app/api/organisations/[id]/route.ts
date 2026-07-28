import { NextRequest, NextResponse } from "next/server";
import { getOrganisation, updateOrganisation } from "@/server/organisation";
import { requireRole } from "@/server/api-auth";
import { Role } from "@db/schema";
import { RouteParams } from "../../types";

// GET /api/organisations/[id] - Get specific organisation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const organisation = await getOrganisation(user.organisation.id);

    if (!organisation) {
      return NextResponse.json(
        { success: false, error: "Organisation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organisation,
    } as GetOrganisationResponse);
  } catch (error) {
    console.error("Error in GET /api/organisations/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/organisations/[id] - Update organisation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Admin);
    if (error) return error;

    const body = (await request.json()) as UpdateOrganisationRequest;

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Organisation name is required" },
        { status: 400 }
      );
    }

    if (body.name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Organisation name must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Organisation name must be less than 100 characters",
        },
        { status: 400 }
      );
    }

    const result = await updateOrganisation(user.organisation.id, body.name.trim());

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.organisation,
    } as UpdateOrganisationResponse);
  } catch (error) {
    console.error("Error in PUT /api/organisations/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
