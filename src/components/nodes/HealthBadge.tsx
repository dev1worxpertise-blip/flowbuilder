import { HEALTH_STATUS_CONFIG, type NodeHealthStatus } from "../../types";

export interface HealthBadgeProps {
  status?: NodeHealthStatus;
  metric?: string;
  className?: string;
  size?: "sm" | "md";
}

export function HealthBadge({
  status,
  metric,
  className = "",
  size = "md",
}: HealthBadgeProps) {
  if (!status || !HEALTH_STATUS_CONFIG[status]) return null;
  const cfg = HEALTH_STATUS_CONFIG[status];
  const isSm = size === "sm";

  return (
    <div
      role="status"
      aria-label={`Status: ${cfg.label}${metric ? `, Metric: ${metric}` : ""}`}
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
        color: cfg.color,
        boxShadow: `0 0 10px ${cfg.glow}`,
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md select-none transition-all ${
        isSm ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[10px]"
      } font-semibold ${className}`}
      title={`${cfg.label}${metric ? ` • ${metric}` : ""}`}
    >
      <span
        data-testid="health-dot"
        className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: cfg.dot }}
      />
      <span className="leading-tight tracking-wide">{cfg.label}</span>
      {metric && (
        <span
          data-testid="health-metric"
          className="opacity-95 font-mono text-[9px] border-l border-white/20 pl-1.5 ml-0.5 leading-none"
        >
          {metric}
        </span>
      )}
    </div>
  );
}
