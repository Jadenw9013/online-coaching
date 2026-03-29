import { type ReactNode } from "react";

/**
 * Glass Card — mirrors iOS `GlassCardChrome` view modifier.
 * A frosted-glass container with subtle top-edge sheen and border glow.
 */
export function SFGlassCard({
  children,
  tint,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  tint?: "accent" | "none";
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={`sf-glass-card ${className}`}
      data-tint={tint === "accent" ? "accent" : undefined}
    >
      {children}
    </Tag>
  );
}
