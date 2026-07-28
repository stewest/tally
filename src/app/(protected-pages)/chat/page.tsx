"use client";

import { useMemo } from "react";
import BrainChat from "@/components/chat/BrainChat";
import { usePageLayout } from "@/hooks/usePageLayout";

export default function ChatPage() {
  usePageLayout(useMemo(() => ({ breadcrumbs: [{ label: "Chat" }] }), []));

  return (
    <div className="h-full min-h-0">
      <BrainChat fillHeight />
    </div>
  );
}
