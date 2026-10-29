import { type NodeProps } from "@xyflow/react";
import { Icon } from "@iconify/react";
import type { NodeData } from "../../types";
import { accentStyle } from "../../lib/theme";
import { DeleteButton, SideHandles, SimulationBadges, SpotlightHighlight } from "./shared";
import { HealthBadge } from "./HealthBadge";

/** True when the icon string is an image (URL or data URL) rather than an emoji/text. */
function isImageSrc(icon: string): boolean {
  return /^(https?:\/\/|data:image\/|\/)/.test(icon.trim());
}

export function CardNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const s = accentStyle(data.accent);
  const iconify = data.iconify?.trim();
  const icon = data.icon?.trim();
  const isDown = data.healthStatus === "down";
  const isWarning = data.healthStatus === "warning";
  const borderColor = isDown ? "#ef4444" : isWarning ? "#f59e0b" : s.border;
  const shadow = isDown
    ? "0 0 24px rgba(239, 68, 68, 0.75), inset 0 0 12px rgba(239, 68, 68, 0.2)"
    : isWarning
    ? "0 0 16px rgba(245, 158, 11, 0.5)"
    : data.glow
    ? `0 0 18px ${s.glow}`
    : "none";

  return (
    <div
      style={{
        width: data.width, minHeight: data.height,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        background: isDown ? "rgba(30, 10, 10, 0.9)" : "rgba(17,24,39,0.85)",
        outline: selected ? `2px solid ${borderColor}` : "none",
      }}
      className={`group relative rounded-xl px-4 py-3 backdrop-blur transition-shadow ${isDown ? "animate-pulse" : ""}`}
    >
      <SimulationBadges id={id} />
      <SpotlightHighlight id={id} />
      <DeleteButton id={id} />
      {data.healthStatus && (
        <div className="mb-2">
          <HealthBadge status={data.healthStatus} metric={data.metric} />
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-sm" style={{ color: s.title }}>{data.title}</div>
          <div className="text-xs text-gray-400 mt-1">{data.subtitle}</div>
        </div>
        {iconify ? (
          <span data-iconify={iconify} className="flex shrink-0 items-center justify-center">
            <Icon icon={iconify} width={38} height={38} style={{ color: s.title }} />
          </span>
        ) : icon ? (
          <div className="flex shrink-0 items-center justify-center">
            {isImageSrc(icon) ? (
              <img src={icon} alt="" className="h-10 w-10 rounded-md object-cover" />
            ) : (
              <span className="text-3xl leading-none">{icon}</span>
            )}
          </div>
        ) : null}
      </div>
      <SideHandles color={s.border} />
    </div>
  );
}
