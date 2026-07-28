"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Icon } from "./Icon";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (
    message: string,
    type: "success" | "error",
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: "success" | "error", duration = 5000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer1 = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer1);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const baseClasses =
    "flex items-center p-4 rounded-lg shadow-lg border max-w-sm transform transition-all duration-300 ease-in-out";
  const typeClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };
  const iconClasses = {
    success: "text-green-500",
    error: "text-red-500",
  };

  const animationClasses = isLeaving
    ? "translate-x-full opacity-0"
    : isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

  return (
    <div
      className={`${baseClasses} ${typeClasses[toast.type]} ${animationClasses}`}
    >
      <div className={`mr-3 ${iconClasses[toast.type]}`}>
        <Icon icon={toast.type === "success" ? "listCheck" : "times"} />
      </div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Icon icon="xMark" />
      </button>
    </div>
  );
}
