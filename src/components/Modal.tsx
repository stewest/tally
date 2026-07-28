"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./ui/Icon";

interface ModalProps {
  title: string;
  onClose: () => void;
  maxWidth?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Modal({
  title,
  onClose,
  maxWidth = "md",
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[maxWidth];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`${widthClass} w-full bg-white rounded-xl shadow-xl p-6 mx-4`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Icon icon="xMark" className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
