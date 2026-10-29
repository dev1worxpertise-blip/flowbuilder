import { useEffect, useRef } from "react";
import { useTrafficStore } from "../../store/trafficStore";

export function TrafficDock() {
  const isSimulating = useTrafficStore((s) => s.isSimulating);
  const totalPackets = useTrafficStore((s) => s.totalPackets);
  const avgLatency = useTrafficStore((s) => s.avgLatency);
  const incidentCount = useTrafficStore((s) => s.incidentCount);

  const tickTraffic = useTrafficStore((s) => s.tickTraffic);
  const triggerSpike = useTrafficStore((s) => s.triggerSpike);
  const injectChaos = useTrafficStore((s) => s.injectChaos);
  const healAll = useTrafficStore((s) => s.healAll);
  const stopTraffic = useTrafficStore((s) => s.stopTraffic);

  const timerRef = useRef<number | null>(null);

  // Background fluctuation ticker
  useEffect(() => {
    if (!isSimulating) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      tickTraffic();
    }, 1600);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isSimulating, tickTraffic]);

  if (!isSimulating) return null;

  return (
    <div
      role="region"
      aria-label="Live Traffic Simulation Dock"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-emerald-500/50 bg-[#07121e]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md text-gray-100 animate-in slide-in-from-bottom duration-300 max-w-2xl"
    >
      {/* Live Badge & Rate */}
      <div className="flex items-center gap-2.5 border-r border-gray-800 pr-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm shadow-inner">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <span>📡 LIVE TRAFFIC</span>
            <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-1 text-[9px] text-emerald-400">
              ACTIVE
            </span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {totalPackets.toLocaleString()} pkts/s • avg {avgLatency}ms
          </div>
        </div>
      </div>

      {/* Incidents Counter */}
      <div className="flex items-center gap-1.5 border-r border-gray-800 pr-3">
        {incidentCount > 0 ? (
          <span className="flex items-center gap-1 rounded-full bg-red-950/80 border border-red-500/60 px-2 py-0.5 text-[10px] font-bold text-red-300 animate-pulse">
            <span>⚠️</span> {incidentCount} Incident{incidentCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <span>✓</span> All Systems Normal
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={triggerSpike}
          title="Simulate sudden traffic surge"
          className="flex items-center gap-1 rounded-lg border border-amber-600/50 bg-amber-950/40 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 hover:border-amber-400 transition shadow-sm"
        >
          <span>⚡</span> Spike
        </button>

        <button
          type="button"
          onClick={injectChaos}
          title="Inject random node outage (Chaos Engineering test)"
          className="flex items-center gap-1 rounded-lg border border-rose-600/50 bg-rose-950/40 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 transition shadow-sm"
        >
          <span>💥</span> Chaos Outage
        </button>

        {incidentCount > 0 && (
          <button
            type="button"
            onClick={healAll}
            title="Restore all failing nodes to healthy"
            className="flex items-center gap-1 rounded-lg border border-emerald-600/60 bg-emerald-950/60 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-400 transition shadow-sm animate-bounce"
          >
            <span>🩺</span> Heal
          </button>
        )}
      </div>

      {/* Stop & Restore Buttons */}
      <div className="flex items-center gap-1.5 border-l border-gray-800 pl-3">
        <button
          type="button"
          onClick={() => stopTraffic(true)}
          title="Exit and restore original metrics before simulation"
          className="rounded-lg border border-gray-700 bg-gray-900/80 px-2 py-1 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
        >
          Restore
        </button>
        <button
          type="button"
          onClick={() => stopTraffic(false)}
          title="Stop traffic simulation"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-red-400 transition text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
