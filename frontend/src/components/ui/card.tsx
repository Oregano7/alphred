// src/components/ui/card.tsx
import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card text-white rounded-2xl shadow-soft p-4 border border-gray-700">
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-2 ${className}`}>{children}</div>;
}
