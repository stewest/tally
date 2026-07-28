"use client";

import React, { useState, ReactNode } from "react";

interface BaseTabProps {
  tabs: string[];
  defaultTab?: string;
  containerClassName?: string;
  tabButtonClassName?: string;
  contentClassName?: string;
  modalClassName?: string;
}

interface ChildrenTabProps extends BaseTabProps {
  children: ReactNode[];
  renderContent?: never;
}

interface RenderPropTabProps extends BaseTabProps {
  children?: never;
  renderContent: (tabName: string) => ReactNode;
}

type TabProps = ChildrenTabProps | RenderPropTabProps;

export default function FormTabs({
  tabs,
  defaultTab,
  children,
  renderContent,
  onTabChange,
}: TabProps & { onTabChange?: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]);

  // Only update activeTab when defaultTab changes and it's different from current activeTab
  // This prevents the tab from resetting when user manually switches tabs
  React.useEffect(() => {
    if (defaultTab && defaultTab !== activeTab && tabs.includes(defaultTab)) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]); // Remove activeTab from dependency array

  // Filter out falsy children (like conditional JSX that evaluates to false)
  const validChildren = children
    ? React.Children.toArray(children).filter(Boolean)
    : [];

  // Ensure we have the right number of children when using children array
  if (children && validChildren.length !== tabs.length) {
    console.error("Number of children must match number of tabs");
    return null;
  }

  // Determine content to render based on props
  const renderTabContent = () => {
    if (renderContent) {
      return renderContent(activeTab);
    }

    // Render all children but hide inactive ones to preserve form state
    return validChildren?.map((child, index) => (
      <div
        key={tabs[index]}
        className={activeTab === tabs[index] ? "block" : "hidden"}
      >
        {child}
      </div>
    ));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className="flex flex-wrap border-b border-[#cbd2d9] mb-6"
        role="tablist"
      >
        {tabs.map(tab => (
          <button
            key={tab}
            className={`py-2 px-4 text-base whitespace-nowrap relative ${
              activeTab === tab
                ? "border-b-2 border-yellow-500 text-gray-800"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={e => {
              e.preventDefault();
              handleTabChange(tab);
            }}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tab-panel-${tab.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        className="flex-1"
        role="tabpanel"
        id={`tab-panel-${activeTab.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {renderTabContent()}
      </div>
    </div>
  );
}
