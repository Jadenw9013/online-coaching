import { type ReactNode, type CSSProperties } from "react";

/**
 * Flow palette — mirrors iOS `Color.sfFlowPalette(index:totalCount:)`.
 * Returns atmospheric highlight + background tint based on position.
 */
const FLOW_PALETTE = [
  { highlight: "#8B5CF6", atmosphere: "#160B24" },
  { highlight: "#6366F1", atmosphere: "#101126" },
  { highlight: "#3B82F6", atmosphere: "#0B1120" },
  { highlight: "#0891B2", atmosphere: "#08161D" },
  { highlight: "#10B981", atmosphere: "#071A18" },
] as const;

function getFlowColors(index: number, totalCount: number) {
  if (totalCount <= 1) return FLOW_PALETTE[0];
  const progress = index / Math.max(totalCount - 1, 1);
  const paletteIndex = Math.round(progress * (FLOW_PALETTE.length - 1));
  return FLOW_PALETTE[Math.min(Math.max(paletteIndex, 0), FLOW_PALETTE.length - 1)];
}

/**
 * Surface Card — mirrors iOS `sfSurfaceCard` / `planSurfaceCard`.
 * An atmospheric card with radial glow and flow palette support.
 */
export function SFSurfaceCard({
  children,
  className = "",
  flowIndex,
  totalCount,
  highlight,
  atmosphere,
  padding,
}: {
  children: ReactNode;
  className?: string;
  /** If provided with totalCount, uses the flow palette for colors */
  flowIndex?: number;
  totalCount?: number;
  /** Override highlight color (bypasses flow palette) */
  highlight?: string;
  /** Override atmosphere/background color */
  atmosphere?: string;
  /** Override padding */
  padding?: number;
}) {
  // Determine colors
  let finalHighlight = highlight ?? "rgba(59, 91, 219, 0.12)";
  let finalAtmosphere = atmosphere ?? "#111114";

  if (flowIndex !== undefined && totalCount !== undefined) {
    const flow = getFlowColors(flowIndex, totalCount);
    finalHighlight = flow.highlight;
    finalAtmosphere = flow.atmosphere;
  }

  const style: CSSProperties = {
    "--sf-card-highlight": finalHighlight,
    "--sf-card-atmosphere": finalAtmosphere,
    ...(padding !== undefined ? { padding: `${padding}px` } : {}),
  } as CSSProperties;

  return (
    <div className={`sf-surface-card ${className}`} style={style}>
      <div className="sf-surface-edge" aria-hidden="true" />
      {children}
    </div>
  );
}
