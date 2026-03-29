import { type ReactNode } from "react";

/**
 * Section Label — mirrors iOS `tileLabel()`.
 * Tiny all-caps text in a frosted glass pill.
 */
export function SFSectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`sf-section-label ${className}`}>
      {children}
    </span>
  );
}
