import React from "react";
import { cn } from "@/lib/utils";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
}

export const TextShimmer: React.FC<TextShimmerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <span 
      className={cn(
        "inline-block bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-pulse",
        className
      )}
      style={{
        background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite"
      }}
    >
      {children}
    </span>
  );
};

export default TextShimmer;
