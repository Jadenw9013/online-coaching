"use client";

import { useState, useRef, useEffect } from "react";

const NUMERIC_UNITS = new Set(["g", "ml", "oz", "mg", "kg", "lb", "lbs"]);

export function PortionEditor({
  quantity,
  unit,
  onChange,
}: {
  quantity: string;
  unit: string;
  onChange: (quantity: string, unit: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tempQty, setTempQty] = useState(quantity);
  const [tempUnit, setTempUnit] = useState(unit);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    onChange(tempQty || "1", tempUnit || "serving");
    setEditing(false);
  }

  function revert() {
    setTempQty(quantity);
    setTempUnit(unit);
    setEditing(false);
  }

  function adjustAbsolute(amount: number) {
    const current = parseFloat(tempQty) || 0;
    const next = Math.max(0, current + amount);
    const newQty = Number.isInteger(next) ? String(next) : next.toFixed(1);
    setTempQty(newQty);
    onChange(newQty, tempUnit || unit);
  }

  function adjustPercent(pct: number) {
    const current = parseFloat(tempQty) || 1;
    const next = Math.max(0, current * (1 + pct / 100));
    const newQty = next < 10 ? next.toFixed(1) : String(Math.round(next));
    setTempQty(newQty);
    onChange(newQty, tempUnit || unit);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setTempQty(quantity);
          setTempUnit(unit);
          setEditing(true);
        }}
        aria-label={`Edit portion: ${quantity} ${unit}`}
        className="rounded px-1.5 py-0.5 text-sm tabular-nums transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800"
      >
        {quantity}{unit}
      </button>
    );
  }

  const isNumeric = NUMERIC_UNITS.has(unit.toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={tempQty}
        onChange={(e) => setTempQty(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") revert();
        }}
        onBlur={commit}
        aria-label="Quantity"
        className="w-14 rounded border border-zinc-300 px-1.5 py-0.5 text-sm tabular-nums focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
      />
      <input
        type="text"
        value={tempUnit}
        onChange={(e) => setTempUnit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") revert();
        }}
        onBlur={commit}
        aria-label="Unit"
        className="w-14 rounded border border-zinc-300 px-1.5 py-0.5 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
      />
      <div className="flex gap-0.5" role="group" aria-label="Quick adjust">
        {isNumeric ? (
          <>
            <AdjustChip label="-25" onClick={() => adjustAbsolute(-25)} />
            <AdjustChip label="+25" onClick={() => adjustAbsolute(25)} />
          </>
        ) : null}
        <AdjustChip label="-10%" onClick={() => adjustPercent(-10)} />
        <AdjustChip label="-5%" onClick={() => adjustPercent(-5)} />
        <AdjustChip label="+5%" onClick={() => adjustPercent(5)} />
        <AdjustChip label="+10%" onClick={() => adjustPercent(10)} />
      </div>
    </div>
  );
}

function AdjustChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs tabular-nums transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-600 dark:hover:bg-zinc-800"
    >
      {label}
    </button>
  );
}
