import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { RouteParams } from "@/app/api/types";
import { requireRole } from "@/server/api-auth";
import {
  deleteSession,
  getSession,
  getSessionMessages,
  renameSession,
} from "@/server/chat/sessions";

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const session = await getSession(
      user.organisation.id,
      id,
      user.profile.id
    );
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Chat session not found." } satisfies GetChatSessionResponse,
        { status: 404 }
      );
    }

    const messages = await getSessionMessages(
      user.organisation.id,
      id,
      user.profile.id
    );

    return NextResponse.json({
      success: true,
      data: { session, messages },
    } satisfies GetChatSessionResponse);
  } catch (error) {
    console.error("Error in GET /api/chat/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies GetChatSessionResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const body = (await request.json()) as RenameChatSessionRequest;
    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: "title is required." } satisfies RenameChatSessionResponse,
        { status: 400 }
      );
    }

    const updated = await renameSession(
      user.organisation.id,
      id,
      body.title,
      user.profile.id
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Chat session not found." } satisfies RenameChatSessionResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    } satisfies RenameChatSessionResponse);
  } catch (error) {
    console.error("Error in PATCH /api/chat/sessions/[id]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message } satisfies RenameChatSessionResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireRole(Role.Member);
    if (error) return error;

    const { id } = await params;
    const deleted = await deleteSession(
      user.organisation.id,
      id,
      user.profile.id
    );
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Chat session not found." } satisfies DeleteChatSessionResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    } satisfies DeleteChatSessionResponse);
  } catch (error) {
    console.error("Error in DELETE /api/chat/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } satisfies DeleteChatSessionResponse,
      { status: 500 }
    );
  }
}
