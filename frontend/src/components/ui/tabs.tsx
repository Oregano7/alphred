import React, { ReactNode, useState } from "react";

type TabProps = {
  children: ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  value?: string;
  className?: string;
};

export function Tabs({
  defaultValue,
  children,
}: {
  defaultValue: string;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<TabProps>, {
            activeTab,
            setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({
  children,
  activeTab,
  setActiveTab,
  className = "",
}: TabProps) {
  return (
    <div className={`flex space-x-2 border-b mb-2 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<TabProps>, {
            activeTab,
            setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({
  value = "",
  children,
  activeTab,
  setActiveTab,
  className = "",
}: TabProps) {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab?.(value)}
      className={`px-4 py-2 rounded-t-xl ${
        isActive
        ? "bg-card text-white border-t border-l border-r border-gray-600"
        : "bg-gray-800 text-gray-300 hover:text-white"
        } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value = "",
  children,
  activeTab,
  className = "",
}: TabProps) {
  return activeTab === value ? (
    <div className={`p-4 ${className}`}>{children}</div>
  ) : null;
}
