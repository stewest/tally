"use client";

import { useState } from "react";
import { Icon } from "./Icon";

interface AccordionItemProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
  className?: string;
}

export function AccordionItem({
  id,
  title,
  description,
  children,
  defaultOpen = false,
}: AccordionItemProps & {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
      >
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <Icon
          icon={isOpen ? "chevronUp" : "chevronDown"}
          className="w-5 h-5 text-gray-400"
        />
      </button>
      {isOpen && (
        <div
          id={`accordion-content-${id}`}
          className="px-4 pb-4 border-t border-gray-200"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function Accordion({
  items,
  allowMultiple = false,
  className = "",
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter(item => item.defaultOpen).map(item => item.id))
  );

  const handleToggle = (id: string) => {
    const newOpenItems = new Set(openItems);

    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(id);
    }

    setOpenItems(newOpenItems);
  };

  return (
    <div className={`${className}`}>
      {items.map(item => (
        <div
          key={item.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <button
            type="button"
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg transition-colors duration-200"
            onClick={() => handleToggle(item.id)}
            aria-expanded={openItems.has(item.id)}
            aria-controls={`accordion-content-${item.id}`}
          >
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
            </div>
            <Icon
              icon={openItems.has(item.id) ? "chevronUp" : "chevronDown"}
              className="w-4 h-4 text-gray-500 transition-transform duration-200"
            />
          </button>
          {openItems.has(item.id) && (
            <div
              id={`accordion-content-${item.id}`}
              className="px-4 pb-4 border-t border-gray-100"
            >
              {item.children}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
