"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Icon } from "../ui/Icon";

interface Option {
  value: string;
  label: string;
  [key: string]: any; // Allow additional properties for custom rendering
}

interface NotFoundProps {
  searchTerm: string;
  onCreateNew?: () => void;
  createButtonText?: string;
  notFoundText?: string;
}

interface SearchableDropdownProps {
  id: string;
  label: string;
  name?: string;
  placeholder?: string;
  options: Option[];
  colSpan?: string;
  register?: UseFormRegister<any>;
  setValue?: UseFormSetValue<any>;
  error?: string;
  required?: boolean;
  value?: string;
  onSelectionChange?: (value: string, option?: Option) => void;
  NotFoundComponent?: React.ComponentType<NotFoundProps>;
  createButtonText?: string;
  notFoundText?: string;
  onCreateNew?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  // Custom rendering props
  renderOption?: (option: Option) => React.ReactNode;
  renderSelected?: (option: Option) => React.ReactNode;
  allowToggle?: boolean; // Allow clicking to toggle dropdown when item is selected
  portalContainer?: HTMLElement | null; // Optional portal target to avoid clipping
}

export default function SearchableDropdown({
  id,
  label,
  name = "",
  placeholder = "Search and select...",
  options = [],
  colSpan = "col-span-6",
  register,
  setValue,
  error,
  required = false,
  value,
  onSelectionChange,
  NotFoundComponent,
  createButtonText = "Create New",
  notFoundText = "No items found",
  onCreateNew,
  isLoading = false,
  disabled = false,
  renderOption,
  renderSelected,
  allowToggle = false,
  portalContainer,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const scrollParentsRef = useRef<Element[]>([]);
  const [defaultPortalContainer, setDefaultPortalContainer] =
    useState<HTMLElement | null>(null);

  // Ensure we have a safe default portal container on the client
  useEffect(() => {
    if (typeof window !== "undefined" && document?.body) {
      setDefaultPortalContainer(document.body);
    }
  }, []);

  // Initialize selected option from value prop
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => opt.value === value);
      if (option) {
        setSelectedOption(option);
        setSearchTerm(option.label);
      }
    } else if (!value) {
      setSelectedOption(null);
      setSearchTerm("");
    }
  }, [value, options]);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside (but ignore clicks inside the menu, including portal-rendered menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(menuRef.current && menuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
        // Reset search term to selected option label when closing
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);

    // Clear selection if input is cleared
    if (!newSearchTerm && selectedOption) {
      setSelectedOption(null);
      if (setValue) {
        setValue(name, "");
      }
      if (onSelectionChange) {
        onSelectionChange("");
      }
    }
  };

  const handleOptionSelect = (option: Option) => {
    if (disabled) return;

    setSelectedOption(option);
    setSearchTerm(option.label);
    setIsOpen(false);

    if (setValue) {
      setValue(name, option.value);
    }
    if (onSelectionChange) {
      onSelectionChange(option.value, option);
    }
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleToggleDropdown = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation(); // Prevent triggering parent click handlers

    setSelectedOption(null);
    setSearchTerm("");
    setIsOpen(false);

    if (setValue) {
      setValue(name, "");
    }
    if (onSelectionChange) {
      onSelectionChange("");
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreateNew) {
      onCreateNew();
    }
  };

  // Compute and track menu position when open
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const triggerEl = inputRef.current ?? selectedRef.current;
      if (!triggerEl) return;
      const rect = triggerEl.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    };

    const getScrollParents = (el: Element | null): Element[] => {
      const parents: Element[] = [];
      let node: Element | null = el ? el.parentElement : null;
      const scrollRegex = /(auto|scroll)/;
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const overflowY = style.getPropertyValue("overflow-y");
        const overflow = style.getPropertyValue("overflow");
        if (scrollRegex.test(overflowY) || scrollRegex.test(overflow)) {
          parents.push(node);
        }
        node = node.parentElement;
      }
      return parents;
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("orientationchange", updatePosition);
    // Attach scroll listeners to all relevant ancestors so inner modal scrolling updates position
    const triggerEl = inputRef.current ?? selectedRef.current;
    const parents = getScrollParents(triggerEl);
    scrollParentsRef.current = parents;
    parents.forEach(parent =>
      parent.addEventListener("scroll", updatePosition, {
        passive: true,
      } as any)
    );

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("orientationchange", updatePosition);
      scrollParentsRef.current.forEach(parent =>
        parent.removeEventListener("scroll", updatePosition as EventListener)
      );
      scrollParentsRef.current = [];
    };
  }, [isOpen]);

  return (
    <div className={`w-full mb-4 text-sm ${colSpan}`} ref={dropdownRef}>
      <label htmlFor={id} className="block text-gray-700 mb-1">
        {label}
      </label>

      <div className="relative">
        {selectedOption &&
        renderSelected &&
        searchTerm === selectedOption.label ? (
          // Show custom selected rendering when available and not actively searching
          <div
            ref={selectedRef}
            className={`w-full px-3 py-2 pr-10 border rounded-md flex items-center justify-between ${
              disabled
                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                : "bg-white cursor-pointer focus-within:border-blue-500"
            } ${error ? "border-red-500" : "border-gray-300"}`}
            onClick={allowToggle ? handleToggleDropdown : handleInputFocus}
          >
            <div className="flex-1">{renderSelected(selectedOption)}</div>
          </div>
        ) : (
          // Show regular input field
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none ${
              disabled
                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                : "focus:border-blue-500"
            } ${error ? "border-red-500" : "border-gray-300"}`}
          />
        )}

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {allowToggle && (selectedOption || searchTerm) && !disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="mr-2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded pointer-events-auto"
              title="Clear selection"
            >
              <Icon icon="times" className="w-4 h-4" />
            </button>
          )}
          <div className="pointer-events-none">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <Icon icon={isOpen ? "chevronUp" : "chevronDown"} />
            )}
          </div>
        </div>

        {isOpen &&
          !disabled &&
          ((portalContainer ?? defaultPortalContainer) && menuPosition ? (
            createPortal(
              <div
                ref={menuRef}
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                }}
                className="z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {isLoading ? (
                  <div className="px-4 py-2 text-gray-500 text-center">
                    Loading...
                  </div>
                ) : filteredOptions.length > 0 ? (
                  filteredOptions.map(option => (
                    <div
                      key={option.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2"
                      onClick={() => handleOptionSelect(option)}
                    >
                      {renderOption ? renderOption(option) : option.label}
                    </div>
                  ))
                ) : NotFoundComponent ? (
                  <NotFoundComponent
                    searchTerm={searchTerm}
                    onCreateNew={handleCreateNew}
                    createButtonText={createButtonText}
                    notFoundText={notFoundText}
                  />
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-center">
                    {notFoundText}
                  </div>
                )}
              </div>,
              (portalContainer ?? defaultPortalContainer) as HTMLElement
            )
          ) : (
            <div
              ref={menuRef}
              className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-50"
            >
              {isLoading ? (
                <div className="px-4 py-2 text-gray-500 text-center">
                  Loading...
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {renderOption ? renderOption(option) : option.label}
                  </div>
                ))
              ) : NotFoundComponent ? (
                <NotFoundComponent
                  searchTerm={searchTerm}
                  onCreateNew={handleCreateNew}
                  createButtonText={createButtonText}
                  notFoundText={notFoundText}
                />
              ) : (
                <div className="px-4 py-2 text-gray-500 text-center">
                  {notFoundText}
                </div>
              )}
            </div>
          ))}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Hidden input for form registration */}
      {register && (
        <input
          type="hidden"
          {...register(name)}
          value={selectedOption?.value || ""}
        />
      )}
    </div>
  );
}
