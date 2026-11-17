import { NextResponse } from "next/server";
import { Role } from "@db/schema";
import { requireRole } from "@/server/api-auth";
import { listBrainTransactionCategories } from "@/server/finance/transactions";

export async function GET() {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const data = await listBrainTransactionCategories(user.organisation.id);

    return NextResponse.json({
      success: true,
      data,
    } satisfies ListTransactionCategoriesResponse);
  } catch (error) {
    console.error("Error in GET /api/finance/categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } satisfies ListTransactionCategoriesResponse,
      { status: 500 }
    );
  }
}
