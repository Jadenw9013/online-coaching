"use client";

import { useState } from "react";

export function ClientDetailTabs({
  overview,
  plans,
  history,
  info,
}: {
  overview: React.ReactNode;
  plans: React.ReactNode;
  history: React.ReactNode;
  info: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "history" | "info">("overview");

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
        <div className="flex max-w-[400px] w-full items-center rounded-xl bg-zinc-900/80 p-1 border border-white/[0.04]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "overview" ? "bg-[#18181b] text-zinc-100 shadow-sm border border-white/[0.06]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "plans" ? "bg-[#18181b] text-zinc-100 shadow-sm border border-white/[0.06]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "history" ? "bg-[#18181b] text-zinc-100 shadow-sm border border-white/[0.06]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "info" ? "bg-[#18181b] text-zinc-100 shadow-sm border border-white/[0.06]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Info
          </button>
        </div>
      </div>

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === "overview" && overview}
        {activeTab === "plans" && plans}
        {activeTab === "history" && history}
        {activeTab === "info" && info}
      </div>
    </div>
  );
}
