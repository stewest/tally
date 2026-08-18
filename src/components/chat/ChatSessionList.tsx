"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ChatSession } from "@db/schema";
import { Icon } from "@/components/ui/Icon";
import { sessionGroupLabel, type SessionGroup } from "@/lib/chat";

const GROUP_ORDER: SessionGroup[] = ["Today", "Previous 7 days", "Earlier"];

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading?: boolean;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onRename: (sessionId: string, title: string) => void;
  onDelete: (sessionId: string) => void;
}

export default function ChatSessionList({
  sessions,
  activeSessionId,
  isLoading = false,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: ChatSessionListProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups = new Map<SessionGroup, ChatSession[]>();
    for (const group of GROUP_ORDER) {
      groups.set(group, []);
    }
    for (const session of sessions) {
      groups.get(sessionGroupLabel(session.lastMessageAt))?.push(session);
    }
    return groups;
  }, [sessions]);

  const startRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
    setConfirmDeleteId(null);
  };

  const submitRename = (event: FormEvent, sessionId: string) => {
    event.preventDefault();
    const title = renameValue.trim();
    if (title) {
      onRename(sessionId, title);
    }
    setRenamingId(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-gray-300 bg-white px-3 py-[9px] text-[13.5px] font-medium leading-5 text-gray-900 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-100"
        >
          <Icon icon="plus" className="h-2.5 w-2.5 text-gray-500" />
          New chat
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-3 pb-4 pt-1">
        {isLoading && (
          <p className="px-2 py-3 text-sm text-gray-500">Loading chats…</p>
        )}
        {!isLoading && sessions.length === 0 && (
          <p className="px-2 py-3 text-sm text-gray-500">
            No chats yet. Start one to import transactions or ask about spend.
          </p>
        )}
        {GROUP_ORDER.map(group => {
          const items = grouped.get(group) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-0.5">
              <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase leading-[14px] tracking-[0.04em] text-gray-500">
                {group}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map(session => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <li key={session.id}>
                      {renamingId === session.id ? (
                        <form
                          onSubmit={event => submitRename(event, session.id)}
                          className="px-1"
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={event => setRenameValue(event.target.value)}
                            onBlur={() => setRenamingId(null)}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[13.5px] text-gray-900 focus:border-gray-400 focus:outline-none"
                          />
                        </form>
                      ) : (
                        <div
                          className={`group flex min-w-0 items-center rounded-lg ${
                            isActive
                              ? "bg-gray-200"
                              : "bg-transparent hover:bg-gray-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(session.id)}
                            className={`min-w-0 flex-1 truncate px-2 py-[7px] text-left text-[13.5px] leading-5 ${
                              isActive
                                ? "font-medium text-gray-900"
                                : "font-normal text-gray-700"
                            }`}
                          >
                            {session.title}
                          </button>
                          <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              title="Rename"
                              onClick={() => startRename(session)}
                              className="p-1.5 text-gray-400 hover:text-gray-700"
                            >
                              <Icon icon="pencil" className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => setConfirmDeleteId(session.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600"
                            >
                              <Icon icon="trash" className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      {confirmDeleteId === session.id && (
                        <div className="mb-1 mt-1 rounded-md bg-red-50 px-2 py-2 text-xs text-red-700">
                          Delete this chat?
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              className="font-medium"
                              onClick={() => {
                                onDelete(session.id);
                                setConfirmDeleteId(null);
                              }}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
