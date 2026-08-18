import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { requireRole } from "@/server/api-auth";
import { getBudgetProgress } from "@/server/finance/budgets";
import { summariseSpendByCategory } from "@/server/finance/transactions";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate") ?? undefined;
    const toDate = searchParams.get("toDate") ?? undefined;

    const [byCategory, budgets] = await Promise.all([
      summariseSpendByCategory(user.organisation.id, { fromDate, toDate }),
      getBudgetProgress(user.organisation.id),
    ]);

    return NextResponse.json({
      success: true,
      data: { byCategory, budgets },
    } satisfies FinanceSummaryResponse);
  } catch (error) {
    console.error("Error in GET /api/finance/summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies FinanceSummaryResponse,
      { status: 500 }
    );
  }
}
