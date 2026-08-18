"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatMessage, {
  type DisplayChatMessage,
} from "@/components/chat/ChatMessage";
import ChatSessionList from "@/components/chat/ChatSessionList";
import TransactionPasteNotice from "@/components/chat/TransactionPasteNotice";
import { Icon } from "@/components/ui/Icon";
import { useUser } from "@/context/UserContext";
import { useBrainChat } from "@/hooks/useBrainChat";
import {
  useChatSession,
  useChatSessions,
  useDeleteChatSession,
  useRenameChatSession,
} from "@/hooks/useChatSessions";
import {
  countBankStatementLines,
  createTextRevealer,
  deriveSessionTitle,
  wrapBankStatement,
} from "@/lib/chat";
import {
  applyTraceEvent,
  decodeAssistantContent,
  emptyTraceState,
  finalizeTrace,
  statusPhaseLabel,
  type ChatTraceState,
} from "@/lib/chat-trace";

const SUGGESTIONS = [
  "Which budgets are over 80% used?",
  "Summarise spend by category this quarter",
  "Find transactions over $250",
  "How much have I spent on groceries this month?",
];

interface BrainChatProps {
  className?: string;
  fillHeight?: boolean;
}

function persistedReplyForTurn(
  persisted: DisplayChatMessage[],
  userContent: string | undefined
): DisplayChatMessage | undefined {
  if (persisted.length === 0) return undefined;

  if (!userContent) {
    const last = persisted[persisted.length - 1];
    return last?.role === "assistant" ? last : undefined;
  }

  let lastUserIndex = -1;
  persisted.forEach((message, index) => {
    if (message.role === "user" && message.content === userContent) {
      lastUserIndex = index;
    }
  });
  if (lastUserIndex === -1) return undefined;
  return persisted
    .slice(lastUserIndex + 1)
    .find(message => message.role === "assistant");
}

function toDisplayMessages(
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date | string;
  }>
): DisplayChatMessage[] {
  return messages.map(message => {
    if (message.role !== "assistant") {
      return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt:
          typeof message.createdAt === "string"
            ? message.createdAt
            : message.createdAt.toISOString(),
      };
    }
    const decoded = decodeAssistantContent(message.content);
    return {
      id: message.id,
      role: message.role,
      content: decoded.text,
      createdAt:
        typeof message.createdAt === "string"
          ? message.createdAt
          : message.createdAt.toISOString(),
      trace: decoded.trace,
    };
  });
}

export default function BrainChat({
  className = "",
  fillHeight = false,
}: BrainChatProps) {
  const { currentUser } = useUser();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [pasteCount, setPasteCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [optimisticUser, setOptimisticUser] =
    useState<DisplayChatMessage | null>(null);
  const [streamingReply, setStreamingReply] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [traceState, setTraceState] = useState<ChatTraceState>(emptyTraceState);
  const [liveStatus, setLiveStatus] = useState("Sending to Telos Brain");
  const [stickToBottom, setStickToBottom] = useState(true);
  const sendGeneration = useRef(0);
  const assistantTurnId = useRef(0);
  const thisTurnPersistedId = useRef<string | null>(null);
  const streamingReplyRef = useRef("");
  const setStreamingReplyRef = useRef(setStreamingReply);
  setStreamingReplyRef.current = setStreamingReply;
  const revealerRef = useRef<ReturnType<typeof createTextRevealer> | null>(
    null
  );
  if (revealerRef.current === null) {
    revealerRef.current = createTextRevealer(chunk => {
      setStreamingReplyRef.current(current => {
        const next = current + chunk;
        streamingReplyRef.current = next;
        return next;
      });
    });
  }
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sessionsQuery = useChatSessions();
  const sessionQuery = useChatSession(activeSessionId);
  const renameSession = useRenameChatSession();
  const deleteSession = useDeleteChatSession();
  const chat = useBrainChat();

  const persistedMessages = useMemo(
    () => toDisplayMessages(sessionQuery.data?.messages ?? []),
    [sessionQuery.data?.messages]
  );

  const messages = useMemo(() => {
    const showFailedTrace =
      Boolean(error) && !chat.isPending && traceState.steps.length > 0;
    const persistedTurnReply = persistedReplyForTurn(
      persistedMessages,
      optimisticUser?.content
    );
    const showLive =
      chat.isPending || isRevealing || Boolean(streamingReply) || showFailedTrace;
    const visiblePersisted =
      showLive && persistedTurnReply && !error
        ? persistedMessages.filter(
            message => message.id !== persistedTurnReply.id
          )
        : persistedMessages;

    const alreadyPresent = optimisticUser
      ? visiblePersisted.some(
          message =>
            message.role === "user" &&
            message.content === optimisticUser.content
        )
      : true;
    const withUser =
      optimisticUser && !alreadyPresent
        ? [...visiblePersisted, optimisticUser]
        : visiblePersisted;

    if (!showLive) return withUser;

    const snapshot = finalizeTrace(traceState);
    return [
      ...withUser,
      {
        id: "streaming-assistant",
        role: "assistant" as const,
        content: streamingReply,
        trace: snapshot,
        live: chat.isPending || isRevealing,
        liveStatus,
      },
    ];
  }, [
    optimisticUser,
    persistedMessages,
    streamingReply,
    isRevealing,
    traceState,
    liveStatus,
    chat.isPending,
    error,
  ]);

  const precedingUserMessage = (messageId: string) => {
    const index = messages.findIndex(message => message.id === messageId);
    return [...messages.slice(0, index)]
      .reverse()
      .find(message => message.role === "user");
  };

  useEffect(() => {
    const persistedTurnReply = persistedReplyForTurn(
      persistedMessages,
      optimisticUser?.content
    );
    if (persistedTurnReply) {
      thisTurnPersistedId.current = persistedTurnReply.id;
    }
  }, [persistedMessages, optimisticUser]);

  useEffect(() => {
    if (error || isRevealing || chat.isPending) return;
    const persistedTurnReply = persistedReplyForTurn(
      persistedMessages,
      optimisticUser?.content
    );
    if (!persistedTurnReply) return;
    revealerRef.current?.reset();
    streamingReplyRef.current = "";
    setStreamingReply("");
    setOptimisticUser(null);
    setTraceState(emptyTraceState());
  }, [persistedMessages, optimisticUser, error, isRevealing, chat.isPending]);

  useEffect(() => {
    if (!stickToBottom) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending, streamingReply, stickToBottom]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    setStickToBottom(distance < 80);
  };

  const sendMessage = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || chat.isPending) return;

    const message = pasteCount >= 3 ? wrapBankStatement(trimmed) : trimmed;

    const generation = sendGeneration.current + 1;
    sendGeneration.current = generation;
    setError(null);
    setFailedMessage(null);
    setInput("");
    setPasteCount(0);
    setStickToBottom(true);
    revealerRef.current?.reset();
    streamingReplyRef.current = "";
    assistantTurnId.current += 1;
    thisTurnPersistedId.current = null;
    setStreamingReply("");
    setIsRevealing(true);
    setTraceState(emptyTraceState());
    setLiveStatus("Sending to Telos Brain");
    setOptimisticUser({
      id: "optimistic-user",
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    });

    try {
      const result = await chat.mutateAsync({
        message,
        sessionId: activeSessionId,
        onSession: sessionId => {
          if (sendGeneration.current !== generation) return;
          setActiveSessionId(sessionId);
        },
        onDelta: delta => {
          if (sendGeneration.current !== generation) return;
          revealerRef.current?.push(delta);
        },
        onActivity: event => {
          if (sendGeneration.current !== generation) return;
          setTraceState(current => applyTraceEvent(current, event));
          if (event.type === "status") {
            setLiveStatus(statusPhaseLabel(event.phase));
          } else if (event.type === "thinking") {
            setLiveStatus("Thinking");
          } else if (event.type === "tool_call") {
            setLiveStatus(`Using ${event.name}`);
          } else if (event.type === "text") {
            setLiveStatus("Writing the answer");
          }
        },
      });
      if (sendGeneration.current !== generation) return;
      await revealerRef.current?.drain();
      if (!streamingReplyRef.current && result.reply) {
        revealerRef.current?.push(result.reply);
        await revealerRef.current?.drain();
      }
      if (sendGeneration.current !== generation) return;
      setActiveSessionId(result.sessionId);
      setStreamingReply(streamingReplyRef.current || result.reply);
      setIsRevealing(false);
      if (result.trace) {
        setTraceState({
          steps: result.trace.steps,
          startedAt: Date.now() - result.trace.elapsedMs,
          currentThoughtId: null,
        });
      }
      if (result.title) {
        setTitleOverride(result.title);
      }
    } catch (err) {
      if (sendGeneration.current !== generation) return;
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setFailedMessage(message);
      revealerRef.current?.reset();
      streamingReplyRef.current = "";
      setStreamingReply("");
      setIsRevealing(false);
      setOptimisticUser({
        id: "optimistic-user",
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
        failed: true,
      });
    }
  };

  const handleNewChat = () => {
    sendGeneration.current += 1;
    revealerRef.current?.reset();
    streamingReplyRef.current = "";
    thisTurnPersistedId.current = null;
    setActiveSessionId(null);
    setOptimisticUser(null);
    setStreamingReply("");
    setIsRevealing(false);
    setTitleOverride(null);
    setTraceState(emptyTraceState());
    setError(null);
    setFailedMessage(null);
    setInput("");
    setPasteCount(0);
    setSidebarOpen(false);
  };

  const handleDelete = (sessionId: string) => {
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        if (activeSessionId === sessionId) {
          handleNewChat();
        }
      },
    });
  };

  const organisationName = currentUser?.organisation?.name;
  const storedTitle = sessionQuery.data?.session.title;
  const activeTitle =
    titleOverride ??
    (storedTitle && storedTitle !== "New chat"
      ? storedTitle
      : optimisticUser
        ? deriveSessionTitle(optimisticUser.content)
        : activeSessionId
          ? "Chat"
          : "New chat");
  const isEmpty = messages.length === 0 && !chat.isPending;

  return (
    <div
      className={`${fillHeight ? "h-full min-h-0" : "h-[36rem]"} ${className}`}
    >
      <ChatLayout
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        sidebar={
          <ChatSessionList
            sessions={sessionsQuery.data ?? []}
            activeSessionId={activeSessionId}
            isLoading={sessionsQuery.isLoading}
            onSelect={sessionId => {
              sendGeneration.current += 1;
              revealerRef.current?.reset();
              streamingReplyRef.current = "";
              thisTurnPersistedId.current = null;
              setActiveSessionId(sessionId);
              setOptimisticUser(null);
              setStreamingReply("");
              setIsRevealing(false);
              setTitleOverride(null);
              setTraceState(emptyTraceState());
              setError(null);
              setFailedMessage(null);
              setInput("");
              setSidebarOpen(false);
            }}
            onNewChat={handleNewChat}
            onRename={(sessionId, title) => {
              renameSession.mutate({ id: sessionId, title });
            }}
            onDelete={sessionId => {
              void handleDelete(sessionId);
            }}
          />
        }
      >
        <div className="flex min-w-0 shrink-0 items-center gap-2.5 border-b border-gray-100 px-6 py-2.5">
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open chats"
          >
            <Icon icon="bars" className="h-4 w-4" />
          </button>
          <span className="truncate text-[15px] font-semibold leading-[22px] text-gray-900">
            {activeTitle}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-[7px] py-0.5 font-mono text-[11px] leading-4 text-gray-500">
            WF-CHAT
          </span>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-8"
        >
          <div className="mx-auto flex max-w-[760px] flex-col gap-7">
            {isEmpty && (
              <div className="flex flex-col items-center gap-5 px-0 pb-2 pt-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Icon
                    icon="comments"
                    className="h-[18px] w-[18px] text-blue-600"
                  />
                </div>
                <div className="flex max-w-[460px] flex-col gap-2">
                  <h1 className="text-[22px] font-semibold leading-[30px] tracking-[-0.01em] text-gray-900">
                    What would you like to know?
                  </h1>
                  <p className="text-sm leading-[22px] text-pretty text-gray-500">
                    Ask about your spending, budgets, or transactions. We'll
                    only use the numbers for this account.
                  </p>
                </div>
                <div className="mt-1 grid w-full max-w-[560px] grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        void sendMessage(suggestion);
                      }}
                      className="rounded-[10px] border border-gray-200 bg-white px-[13px] py-[11px] text-left text-[13.5px] leading-5 text-gray-900 hover:border-gray-300 hover:bg-gray-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(message => {
              const isStreaming = message.id === "streaming-assistant";
              const isThisTurnAssistant =
                isStreaming || message.id === thisTurnPersistedId.current;
              const priorUser = precedingUserMessage(message.id);
              const retryContent = message.failed
                ? failedMessage
                : priorUser?.content;

              return (
                <ChatMessage
                  key={
                    isThisTurnAssistant
                      ? `assistant-turn-${assistantTurnId.current}`
                      : message.id
                  }
                  message={message}
                  onRetry={
                    !isStreaming && retryContent
                      ? () => {
                          void sendMessage(retryContent);
                        }
                      : undefined
                  }
                />
              );
            })}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="shrink-0 bg-white px-6 pb-5 pt-3">
          <div className="mx-auto flex max-w-[760px] flex-col gap-2">
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <TransactionPasteNotice
              count={pasteCount}
              onDismiss={() => setPasteCount(0)}
            />
            <ChatComposer
              value={input}
              loading={chat.isPending}
              organisationName={organisationName}
              onChange={value => {
                setInput(value);
                const count = countBankStatementLines(value);
                setPasteCount(count >= 3 ? count : 0);
              }}
              onPaste={text => {
                const count = countBankStatementLines(text);
                if (count >= 3) setPasteCount(count);
              }}
              onSubmit={() => {
                void sendMessage(input);
              }}
            />
          </div>
        </div>
      </ChatLayout>
    </div>
  );
}
