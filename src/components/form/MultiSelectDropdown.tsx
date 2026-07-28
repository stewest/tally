"use client";

import { useState, useRef } from "react";
import { Icon } from "../ui/Icon";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  id: string;
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  error?: string;
  className?: string;
  showSelectAll?: boolean;
}

export default function MultiSelectDropdown({
  id,
  label,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  options = [],
  selectedValues = [],
  onSelectionChange,
  error,
  className = "",
  showSelectAll = true,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Computed values
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllSelected = selectedValues.length === options.length;
  const hasSelectedItems = selectedValues.length > 0;

  // Display logic
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const selectedOption = options.find(option => option.value === selectedValues[0]);
      return selectedOption?.label || selectedValues[0];
    }
    if (isAllSelected) {
      if (placeholder.toLowerCase().includes('cities')) return "All Cities";
      if (placeholder.toLowerCase().includes('status')) return "All Statuses"; 
      return "All Selected";
    }
    if (placeholder.toLowerCase().includes('cities')) {
      return `${selectedValues.length} cities selected`;
    }
    if (placeholder.toLowerCase().includes('status')) {
      return `${selectedValues.length} statuses selected`;
    }
    return `${selectedValues.length} selected`;
  };

  // Event handlers
  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const toggleOption = (optionValue: string) => {
    const newSelectedValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(value => value !== optionValue)
      : [...selectedValues, optionValue];
    
    onSelectionChange(newSelectedValues);
  };

  const toggleSelectAll = () => {
    onSelectionChange(isAllSelected ? [] : options.map(option => option.value));
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const handleOutsideClick = (event: React.MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      closeDropdown();
    }
  };

  // Render helpers
  const renderSelectedTags = () => {
    if (!hasSelectedItems || selectedValues.length > 3 || isOpen) return null;

    return (
      <div className="mt-1 flex flex-wrap gap-1">
        {selectedValues.map(value => {
          const option = options.find(opt => opt.value === value);
          return (
            <span
              key={value}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {option?.label || value}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(value);
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
                aria-label={`Remove ${option?.label || value}`}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  const renderActionButtons = () => (
    <div className="p-2 border-b border-gray-200 flex gap-2">
      {showSelectAll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectAll();
          }}
          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
        >
          {isAllSelected ? "Deselect All" : "Select All"}
        </button>
      )}
      {hasSelectedItems && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            clearSelection();
          }}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
        >
          Clear All
        </button>
      )}
    </div>
  );

  const renderOptionsList = () => (
    <div className="max-h-48 overflow-y-auto">
      {filteredOptions.length > 0 ? (
        filteredOptions.map(option => (
          <div
            key={option.value}
            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              toggleOption(option.value);
            }}
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => toggleOption(option.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${option.label}`}
            />
            <span className="text-gray-900">{option.label}</span>
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-gray-500 text-center">
          No options found
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Invisible overlay to handle outside clicks */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleOutsideClick}
          aria-hidden="true"
        />
      )}
      
      <div className={`w-full text-sm ${className}`} ref={dropdownRef}>
        <label htmlFor={id} className="block text-gray-700 mb-1">
          {label}
        </label>

        <div className="relative">
          {/* Main dropdown trigger */}
          <div
            className={`w-full px-3 py-2 border rounded-md cursor-pointer flex items-center justify-between ${
              error ? "border-red-500" : "border-gray-300"
            } ${isOpen ? "border-blue-500" : ""}`}
            onClick={toggleDropdown}
            role="button"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown();
              }
            }}
          >
            <span className={selectedValues.length === 0 ? "text-gray-500" : "text-gray-900"}>
              {getDisplayText()}
            </span>
            <Icon icon={isOpen ? "chevronUp" : "chevronDown"} />
          </div>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={searchPlaceholder}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>

              {renderActionButtons()}
              {renderOptionsList()}
            </div>
          )}
        </div>

        {renderSelectedTags()}

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </>
  );
} 