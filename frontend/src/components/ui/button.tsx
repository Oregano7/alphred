// src/components/ui/button.tsx
import React from "react";

export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="px-4 py-2 bg-accent text-white rounded-xl hover:shadow-lg hover:brightness-110 transition duration-200"
      {...props}
    >
      {children}
    </button>
  );
}
