import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { isBudgetPeriod } from "@/lib/finance";
import { RouteParams } from "@/app/api/types";
import { requireRole } from "@/server/api-auth";
import { deleteBudget, updateBudget } from "@/server/finance/budgets";

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const body = (await request.json()) as UpdateBudgetRequest;

    if (body.period && !isBudgetPeriod(body.period)) {
      return NextResponse.json(
        { success: false, error: "Invalid budget period." } satisfies UpdateBudgetResponse,
        { status: 400 }
      );
    }

    const updated = await updateBudget(user.organisation.id, id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Budget not found." } satisfies UpdateBudgetResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    } satisfies UpdateBudgetResponse);
  } catch (error) {
    console.error("Error in PUT /api/finance/budgets/[id]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message } satisfies UpdateBudgetResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const deleted = await deleteBudget(user.organisation.id, id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Budget not found." } satisfies DeleteBudgetResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    } satisfies DeleteBudgetResponse);
  } catch (error) {
    console.error("Error in DELETE /api/finance/budgets/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies DeleteBudgetResponse,
      { status: 500 }
    );
  }
}
