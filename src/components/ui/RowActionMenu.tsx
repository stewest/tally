"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import type { IconType } from "./Icon";

export interface RowActionItem {
  icon: IconType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  dividerBefore?: boolean;
}

interface RowActionMenuProps {
  items: RowActionItem[];
}

export default function RowActionMenu({ items }: RowActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  }>({ right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const open = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const estimatedHeight = items.length * 36 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const right = window.innerWidth - rect.right;

    if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
      setDropdownStyle({ bottom: window.innerHeight - rect.top + 4, right });
    } else {
      setDropdownStyle({ top: rect.bottom + 4, right });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const visibleItems = items.filter(item => !item.disabled);
  if (visibleItems.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={e => {
          e.stopPropagation();
          isOpen ? setIsOpen(false) : open();
        }}
        className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title="Actions"
      >
        <Icon icon="ellipsisVertical" className="text-sm" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownStyle.top,
              bottom: dropdownStyle.bottom,
              right: dropdownStyle.right,
              zIndex: 9999,
            }}
            className="w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          >
            {visibleItems.map((item, index) => (
              <div key={index}>
                {item.dividerBefore && (
                  <div className="border-t border-gray-100 my-1" />
                )}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    item.onClick();
                    setIsOpen(false);
                  }}
                  disabled={item.disabled}
                  className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left transition-colors ${
                    item.destructive
                      ? "text-red-600 hover:bg-red-50"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Icon icon={item.icon} className="w-3.5 shrink-0" />
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
