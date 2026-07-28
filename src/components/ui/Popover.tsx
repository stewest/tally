"use client";

import React, { useState, useRef, useEffect } from "react";

interface PopoverProps {
  /** The element that triggers the popover on hover */
  trigger: React.ReactNode;
  /** The content to display in the popover */
  content: React.ReactNode;
  /** Preferred position of the popover relative to the trigger */
  position?: "top" | "bottom" | "left" | "right";
  /** Additional CSS classes for the trigger wrapper */
  className?: string;
  /** Additional CSS classes for the popover content */
  contentClassName?: string;
}

/**
 * Reusable Popover component that shows content on hover
 *
 * @example
 * // Basic usage
 * <Popover
 *   trigger={<button>Hover me</button>}
 *   content={<div>Popover content</div>}
 * />
 *
 * @example
 * // With custom styling and position
 * <Popover
 *   trigger={<Icon icon="info" />}
 *   content={<div>Detailed information here</div>}
 *   position="right"
 *   contentClassName="w-64 bg-blue-50"
 * />
 */
export default function Popover({
  trigger,
  content,
  position = "top",
  className = "",
  contentClassName = "",
}: PopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const showPopover = () => {
    setIsVisible(true);
    updatePosition();
  };

  const hidePopover = () => {
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let x = 0;
    let y = 0;

    // Calculate position based on the preferred position prop
    switch (position) {
      case "top":
        x = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
        y = triggerRect.top - popoverRect.height - 8;
        break;
      case "bottom":
        x = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case "left":
        x = triggerRect.left - popoverRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
        break;
      case "right":
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
        break;
    }

    // Adjust if popover would go outside viewport
    if (x < 8) x = 8;
    if (x + popoverRect.width > viewport.width - 8) {
      x = viewport.width - popoverRect.width - 8;
    }
    if (y < 8) y = 8;
    if (y + popoverRect.height > viewport.height - 8) {
      y = viewport.height - popoverRect.height - 8;
    }

    setPopoverPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
      >
        {trigger}
      </div>

      {isVisible && (
        <div
          ref={popoverRef}
          className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm ${contentClassName}`}
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
          }}
          onMouseEnter={showPopover}
          onMouseLeave={hidePopover}
        >
          {/* Arrow pointer */}
          <div
            className={`absolute w-2 h-2 bg-white border-gray-200 transform rotate-45 ${
              position === "top"
                ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r"
                : position === "bottom"
                  ? "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l"
                  : position === "left"
                    ? "right-[-4px] top-1/2 -translate-y-1/2 border-r border-b"
                    : "left-[-4px] top-1/2 -translate-y-1/2 border-l border-t"
            }`}
          />
          {content}
        </div>
      )}
    </>
  );
}
