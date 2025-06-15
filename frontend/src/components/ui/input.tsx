// src/components/ui/input.tsx
import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring focus:border-blue-400"
      {...props}
    />
  );
}
