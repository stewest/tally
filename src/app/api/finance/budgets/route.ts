import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { isBudgetPeriod } from "@/lib/finance";
import { requireRole } from "@/server/api-auth";
import { listBudgets, upsertBudget } from "@/server/finance/budgets";

export async function GET() {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const data = await listBudgets(user.organisation.id);

    return NextResponse.json({
      success: true,
      data,
    } satisfies ListBudgetsResponse);
  } catch (error) {
    console.error("Error in GET /api/finance/budgets:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies ListBudgetsResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const body = (await request.json()) as UpsertBudgetRequest;
    if (!body.category || !body.period || !body.startsOn || body.amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "category, period, amount and startsOn are required.",
        } satisfies UpsertBudgetResponse,
        { status: 400 }
      );
    }
    if (!isBudgetPeriod(body.period)) {
      return NextResponse.json(
        { success: false, error: "Invalid budget period." } satisfies UpsertBudgetResponse,
        { status: 400 }
      );
    }

    const data = await upsertBudget(user.organisation.id, {
      category: body.category,
      period: body.period,
      amount: body.amount,
      startsOn: body.startsOn,
      endsOn: body.endsOn,
      notes: body.notes,
      currency: body.currency,
    });

    return NextResponse.json({
      success: true,
      data,
    } satisfies UpsertBudgetResponse);
  } catch (error) {
    console.error("Error in POST /api/finance/budgets:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message } satisfies UpsertBudgetResponse,
      { status: 500 }
    );
  }
}
