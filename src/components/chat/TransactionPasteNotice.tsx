"use client";

import { Icon } from "@/components/ui/Icon";

interface TransactionPasteNoticeProps {
  count: number;
  onDismiss: () => void;
}

export default function TransactionPasteNotice({
  count,
  onDismiss,
}: TransactionPasteNoticeProps) {
  if (count < 3) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      <Icon icon="credits" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">
        Looks like {count} bank transactions — send to import them into your
        ledger.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-blue-500 hover:text-blue-700"
        aria-label="Dismiss import hint"
      >
        <Icon icon="xMark" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
