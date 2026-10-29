import type { Accent } from "../types";

const MAP: Record<Accent, { border: string; glow: string; title: string }> = {
  neutral: { border: "#858591", glow: "rgba(133,133,145,0.35)", title: "#c0c0c8" },
  green: { border: "#34d399", glow: "rgba(52,211,153,0.45)", title: "#6ee7b7" },
  pink: { border: "#ec4899", glow: "rgba(236,72,153,0.45)", title: "#f9a8d4" },
  blue: { border: "#60a5fa", glow: "rgba(96,165,250,0.45)", title: "#93c5fd" },
  amber: { border: "#fbbf24", glow: "rgba(251,191,36,0.45)", title: "#fcd34d" },
  crimson: { border: "#c00000", glow: "rgba(192,0,0,0.45)", title: "#ff4040" },
  purple: { border: "#858591", glow: "rgba(192,192,200,0.45)", title: "#ffbfbf" },
};

export function accentStyle(accent: Accent) {
  return MAP[accent] || MAP.neutral;
}
