import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { RouteParams } from "@/app/api/types";
import { requireRole } from "@/server/api-auth";
import { dismissInsight } from "@/server/finance/insights";

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const deleted = await dismissInsight(user.organisation.id, id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Insight not found." } satisfies DismissInsightResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    } satisfies DismissInsightResponse);
  } catch (error) {
    console.error("Error in DELETE /api/finance/insights/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies DismissInsightResponse,
      { status: 500 }
    );
  }
}
