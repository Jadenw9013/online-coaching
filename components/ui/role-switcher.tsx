"use client";

import { setActiveRole } from "@/app/actions/roles";
import { useState } from "react";

export function RoleSwitcher({
  currentRole,
}: {
  currentRole: "coach" | "client";
}) {
  const [switching, setSwitching] = useState(false);

  const targetRole = currentRole === "coach" ? "CLIENT" : "COACH";
  const label =
    currentRole === "coach" ? "Switch to Client" : "Switch to Coach";

  async function handleSwitch() {
    setSwitching(true);
    try {
      await setActiveRole({ role: targetRole });
    } catch {
      // redirect throws NEXT_REDIRECT — expected behavior
    } finally {
      setSwitching(false);
    }
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={switching}
      aria-label={label}
      className="hidden sm:inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/[0.08] hover:text-blue-300 disabled:opacity-40"
    >
      {switching ? "Switching..." : label}
    </button>
  );
}
