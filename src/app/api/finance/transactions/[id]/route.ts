import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { RouteParams } from "@/app/api/types";
import { requireRole } from "@/server/api-auth";
import {
  deleteTransaction,
  updateTransaction,
} from "@/server/finance/transactions";

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const body = (await request.json()) as UpdateTransactionRequest;

    const updated = await updateTransaction(user.organisation.id, id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Transaction not found." } satisfies UpdateTransactionResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    } satisfies UpdateTransactionResponse);
  } catch (error) {
    console.error("Error in PUT /api/finance/transactions/[id]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message } satisfies UpdateTransactionResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const deleted = await deleteTransaction(user.organisation.id, id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Transaction not found." } satisfies DeleteTransactionResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    } satisfies DeleteTransactionResponse);
  } catch (error) {
    console.error("Error in DELETE /api/finance/transactions/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies DeleteTransactionResponse,
      { status: 500 }
    );
  }
}
