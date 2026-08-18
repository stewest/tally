"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function ChatLayout({
  sidebar,
  children,
  sidebarOpen,
  onCloseSidebar,
}: ChatLayoutProps) {
  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-white">
      <aside
        className={`absolute inset-y-0 left-0 z-20 flex w-[264px] shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
      {sidebarOpen && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-black/30 md:hidden"
          aria-label="Close session list"
          onClick={onCloseSidebar}
        />
      )}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        {children}
      </section>
    </div>
  );
}
