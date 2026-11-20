import { useEffect, useRef, useState } from "react";
import { useTranscriptStore } from "../../store/transcriptStore";
import { CALL_SCENARIOS } from "../../data/callScenarios";

export function LiveCallTranscript() {
  const isOpen = useTranscriptStore((s) => s.isOpen);
  const isMinimized = useTranscriptStore((s) => s.isMinimized);
  const toggleOpen = useTranscriptStore((s) => s.toggleOpen);
  const toggleMinimized = useTranscriptStore((s) => s.toggleMinimized);
  const selectedScenarioId = useTranscriptStore((s) => s.selectedScenarioId);
  const setScenario = useTranscriptStore((s) => s.setScenario);
  const getActiveScenario = useTranscriptStore((s) => s.getActiveScenario);
  const getRevealedMessages = useTranscriptStore((s) => s.getRevealedMessages);
  const resetTranscript = useTranscriptStore((s) => s.resetTranscript);

  const scenario = getActiveScenario();
  const messages = getRevealedMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Call Timer (MM:SS)
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Minimized Pill Mode
  if (isMinimized) {
    return (
      <div className="fixed right-6 bottom-20 z-50 flex items-center gap-2 rounded-full border border-[#c00000]/60 bg-[#0c101a]/95 px-4 py-2 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-200">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-bold text-gray-200">
          📞 Live Call ({formatTime(seconds)})
        </span>
        <button
          onClick={toggleMinimized}
          className="ml-2 rounded px-2 py-0.5 text-[10px] font-bold bg-[#c00000] text-white hover:bg-[#a00000]"
          title="Expand Live Transcript"
        >
          Expand
        </button>
        <button
          onClick={toggleOpen}
          className="rounded p-1 text-xs text-gray-400 hover:text-white"
          title="Close Transcript"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-6 bottom-20 z-50 flex flex-col w-[380px] max-w-[92vw] h-[480px] rounded-2xl border border-gray-800 bg-[#0c101a]/98 text-gray-100 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden ring-1 ring-white/10">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-800/90 px-4 py-3 bg-[#111726]/90">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c00000]/20 border border-[#c00000]/50 text-[#ff4040]">
            <span className="text-sm">📞</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white tracking-wide uppercase">
                Live Call Simulator
              </h4>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {formatTime(seconds)}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 truncate max-w-[190px]">
              Worxpertise AI Voice Bot Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimized}
            className="rounded-lg p-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition"
            title="Minimize"
          >
            _
          </button>
          <button
            onClick={toggleOpen}
            className="rounded-lg p-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-rose-400 transition"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scenario Selector & Caller Badge */}
      <div className="px-3.5 py-2.5 bg-[#090d15] border-b border-gray-800/60 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Customer Scenario:
          </label>
          <select
            value={selectedScenarioId}
            onChange={(e) => setScenario(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900/90 px-2 py-1 text-[11px] font-bold text-sky-300 outline-none hover:border-sky-500 transition cursor-pointer max-w-[200px]"
          >
            {CALL_SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.icon} {sc.shortLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Caller Info Pill */}
        <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#121927]/60 px-3 py-1.5 text-[10.5px]">
          <div className="flex items-center gap-2">
            <span className="text-sm">👤</span>
            <div>
              <span className="font-bold text-gray-200">{scenario.caller.name}</span>
              <span className="text-gray-400 ml-1.5 font-mono text-[10px]">
                {scenario.caller.phone}
              </span>
            </div>
          </div>
          <span className="rounded-full bg-sky-950/60 border border-sky-500/40 px-2 py-0.5 text-[9px] font-bold text-sky-300">
            {scenario.caller.tier}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 select-text">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500">
            <span className="text-3xl mb-2">🎙️</span>
            <p className="text-xs font-semibold text-gray-400">
              Waiting for call initiation...
            </p>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[220px]">
              Start the simulation or walk through the flow to generate real-time customer and AI bot conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="flex justify-center my-1 animate-in fade-in duration-200">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-2.5 py-1 text-center max-w-[90%] shadow-xs">
                    <p className="text-[10px] font-mono text-emerald-400 leading-tight">
                      ⚡ {msg.text}
                    </p>
                    {msg.subtext && (
                      <p className="text-[9px] font-mono text-gray-500 mt-0.5 truncate">
                        {msg.subtext}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            const isCustomer = msg.sender === "customer";
            const isAgent = msg.sender === "agent";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCustomer ? "items-start" : "items-end"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    {isCustomer
                      ? scenario.caller.name
                      : isAgent
                      ? "Human Agent (Priya)"
                      : "Worxpertise AI Bot"}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {msg.timeOffset}
                  </span>
                  {msg.latencyMs && (
                    <span className="rounded bg-emerald-950/80 text-[8px] font-mono text-emerald-300 px-1 border border-emerald-800/40">
                      {msg.latencyMs}ms
                    </span>
                  )}
                </div>

                <div
                  className={`rounded-2xl px-3.5 py-2 text-[11.5px] leading-relaxed max-w-[85%] shadow-md ${
                    isCustomer
                      ? "bg-slate-800/90 text-gray-100 rounded-tl-xs border border-slate-700/60"
                      : isAgent
                      ? "bg-purple-950/90 text-purple-100 rounded-tr-xs border border-purple-500/50"
                      : "bg-[#c00000]/25 text-rose-50 rounded-tr-xs border border-[#c00000]/60 ring-1 ring-[#c00000]/20"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-800/80 px-3 py-2 bg-[#0d121f] flex items-center justify-between">
        <button
          onClick={resetTranscript}
          className="text-[10px] font-semibold text-gray-400 hover:text-white transition"
          title="Clear Conversation History"
        >
          ↺ Reset Log
        </button>
        <span className="text-[9px] text-gray-500 font-mono">
          {messages.length} / {scenario.messages.length} Messages
        </span>
      </div>
    </div>
  );
}
