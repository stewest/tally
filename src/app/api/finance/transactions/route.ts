import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { requireRole } from "@/server/api-auth";
import {
  createTransactions,
  listTransactions,
} from "@/server/finance/transactions";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate") ?? undefined;
    const toDate = searchParams.get("toDate") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const account = searchParams.get("account") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const data = await listTransactions(user.organisation.id, {
      fromDate,
      toDate,
      category,
      account,
      search,
    });

    return NextResponse.json({
      success: true,
      data,
    } satisfies ListTransactionsResponse);
  } catch (error) {
    console.error("Error in GET /api/finance/transactions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies ListTransactionsResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const body = (await request.json()) as CreateTransactionRequest;
    if (!body.occurredAt || !body.description || body.amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "occurredAt, description and amount are required.",
        } satisfies CreateTransactionResponse,
        { status: 400 }
      );
    }

    const result = await createTransactions(user.organisation.id, [
      {
        occurredAt: body.occurredAt,
        description: body.description,
        amount: body.amount,
        merchant: body.merchant,
        category: body.category,
        account: body.account,
        notes: body.notes,
        currency: body.currency,
        source: "manual",
        createdByUserId: user.profile.id,
      },
    ]);

    const created = result.inserted[0];
    if (!created) {
      return NextResponse.json(
        {
          success: false,
          error: "A matching transaction already exists.",
        } satisfies CreateTransactionResponse,
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: created,
    } satisfies CreateTransactionResponse);
  } catch (error) {
    console.error("Error in POST /api/finance/transactions:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message } satisfies CreateTransactionResponse,
      { status: 500 }
    );
  }
}
