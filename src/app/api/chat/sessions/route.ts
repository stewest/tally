import { NextResponse } from "next/server";
import { Role } from "@db/schema";
import { requireRole } from "@/server/api-auth";
import { createSession, listSessions } from "@/server/chat/sessions";

export async function GET() {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const data = await listSessions(user.organisation.id, user.profile.id);

    return NextResponse.json({
      success: true,
      data,
    } satisfies ListChatSessionsResponse);
  } catch (error) {
    console.error("Error in GET /api/chat/sessions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies ListChatSessionsResponse,
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const data = await createSession(user.organisation.id, user.profile.id);

    return NextResponse.json({
      success: true,
      data,
    } satisfies CreateChatSessionResponse);
  } catch (error) {
    console.error("Error in POST /api/chat/sessions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies CreateChatSessionResponse,
      { status: 500 }
    );
  }
}
