import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { isInsightCategory } from "@/lib/insights";
import { requireRole } from "@/server/api-auth";
import {
  listInsights,
  organisationHasTransactions,
  queueInsights,
} from "@/server/finance/insights";

export async function GET() {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const hasTransactions = await organisationHasTransactions(
      user.organisation.id
    );
    let insightRows: Awaited<ReturnType<typeof listInsights>> = [];
    try {
      insightRows = await listInsights(user.organisation.id);
    } catch (listError) {
      console.error("Error listing insights:", listError);
    }

    return NextResponse.json({
      success: true,
      data: { insights: insightRows, hasTransactions },
    } satisfies ListInsightsResponse);
  } catch (error) {
    console.error("Error in GET /api/finance/insights:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies ListInsightsResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const body = (await request.json()) as QueueInsightsRequest;
    const categories = Array.isArray(body.categories) ? body.categories : [];
    const validCategories = [...new Set(categories.filter(isInsightCategory))];

    if (validCategories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Select at least one insight category.",
        } satisfies QueueInsightsResponse,
        { status: 400 }
      );
    }

    const hasTransactions = await organisationHasTransactions(
      user.organisation.id
    );
    let existing: Awaited<ReturnType<typeof listInsights>> = [];
    try {
      existing = await listInsights(user.organisation.id);
    } catch (listError) {
      console.error("Error listing insights:", listError);
    }
    if (!hasTransactions) {
      return NextResponse.json(
        {
          success: false,
          error: "Add transactions before queueing an insight.",
        } satisfies QueueInsightsResponse,
        { status: 400 }
      );
    }

    const analysingCategories = new Set(
      existing
        .filter(insight => insight.status === "analysing")
        .map(insight => insight.category)
    );
    const alreadyQueued = validCategories.filter(category =>
      analysingCategories.has(category)
    );
    if (alreadyQueued.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "An insight for that category is already analysing.",
        } satisfies QueueInsightsResponse,
        { status: 409 }
      );
    }

    const data = await queueInsights(user.organisation.id, validCategories);

    return NextResponse.json({
      success: true,
      data,
    } satisfies QueueInsightsResponse);
  } catch (error) {
    console.error("Error in POST /api/finance/insights:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message } satisfies QueueInsightsResponse,
      { status: 500 }
    );
  }
}
