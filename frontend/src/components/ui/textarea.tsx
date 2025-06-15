// src/components/ui/textarea.tsx
import React from "react";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full p-2 border rounded-xl border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
      {...props}
    />
  );
}