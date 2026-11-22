import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAudioStore } from "../../store/audioStore";
import { useThemeStore } from "../../store/themeStore";
import type { SoundTheme } from "../../lib/audioEngine";

export function AudioWaveform() {
  const isSpeaking = useAudioStore((s) => s.isSpeaking);

  if (!isSpeaking) return null;

  return (
    <div
      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#c00000]/15 border border-[#c00000]/40 shadow-xs"
      title="AI Voice Speaking"
    >
      <span className="w-0.5 h-2 bg-[#ff4040] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-0.5 h-3 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-0.5 h-4 bg-[#ff4040] rounded-full animate-bounce" />
      <span className="w-0.5 h-3 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:-0.2s]" />
      <span className="w-0.5 h-1.5 bg-[#ff4040] rounded-full animate-bounce [animation-delay:-0.35s]" />
    </div>
  );
}

export function AudioControls({
  compact = false,
  dropdownDirection,
}: {
  compact?: boolean;
  dropdownDirection?: "up" | "down";
}) {
  const {
    isSfxEnabled,
    isVoiceEnabled,
    isSpeaking,
    sfxTheme,
    sfxVolume,
    toggleSfx,
    toggleVoice,
    setSfxTheme,
    setSfxVolume,
    stopAllAudio,
    playStepSound,
  } = useAudioStore();

  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  const [showSettings, setShowSettings] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 60, left: 100 });
  const gearBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate position relative to gear button so it NEVER clips or goes off-screen
  const updatePosition = () => {
    if (!gearBtnRef.current) return;
    const rect = gearBtnRef.current.getBoundingClientRect();
    const popoverWidth = 290;
    const popoverHeight = 360;
    const padding = 12;

    // Horizontal placement: try aligning right edge with button, clamped within window
    let left = rect.right - popoverWidth;
    if (left < padding) left = padding;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - popoverWidth - padding);
    }

    // Vertical placement: decide based on dropdownDirection or button position in viewport
    let top: number;
    const opensUp = dropdownDirection === "up" || (rect.bottom + popoverHeight > window.innerHeight && rect.top > popoverHeight);
    if (opensUp) {
      top = Math.max(padding, rect.top - popoverHeight - 8);
    } else {
      top = Math.min(window.innerHeight - popoverHeight - padding, rect.bottom + 8);
    }

    setPopoverPos({ top, left });
  };

  const handleToggleSettings = () => {
    if (!showSettings) {
      updatePosition();
    }
    setShowSettings((prev) => !prev);
  };

  // Close popover when clicked outside or on Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        gearBtnRef.current &&
        !gearBtnRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowSettings(false);
      }
    }
    if (showSettings) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings]);

  const soundThemes: { id: SoundTheme; label: string; icon: string; desc: string }[] = [
    { id: "telecom", label: "Telecom Modern", icon: "📞", desc: "Ring-back, SIP harmonic chimes & AI pulses" },
    { id: "soft", label: "Soft Acoustic", icon: "🍃", desc: "Subtle, non-intrusive soft clicks" },
    { id: "chime", label: "Pure Chimes", icon: "🔔", desc: "Harmonic musical chime triad tones" },
    { id: "mute", label: "Mute All SFX", icon: "🔇", desc: "Completely silent during all steps" },
  ];

  return (
    <div className="relative flex items-center gap-1 shrink-0">
      {/* Sound Effects Toggle Button (Click to toggle Mute / Sound) */}
      <button
        type="button"
        onClick={toggleSfx}
        className={`flex items-center gap-1 rounded-full transition cursor-pointer text-xs ${
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          isSfxEnabled && sfxTheme !== "mute"
            ? isDark
              ? "bg-sky-950/70 text-sky-300 border border-sky-500/40 hover:bg-sky-900/80"
              : "bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 shadow-xs"
            : isDark
            ? "bg-gray-800/80 text-gray-400 border border-gray-700/60 hover:text-gray-200"
            : "bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-800"
        }`}
        title={
          isSfxEnabled && sfxTheme !== "mute"
            ? `Sound Effects Active (${sfxTheme.toUpperCase()}) — Click to Mute`
            : "Sound Effects Muted — Click to Enable"
        }
      >
        <span>{isSfxEnabled && sfxTheme !== "mute" ? "🔊" : "🔇"}</span>
        <span>{isSfxEnabled && sfxTheme !== "mute" ? "SFX" : "Muted"}</span>
      </button>

      {/* AI Voice Narration Toggle Button */}
      <button
        type="button"
        onClick={toggleVoice}
        className={`flex items-center gap-1.5 rounded-full transition cursor-pointer ${
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } font-semibold ${
          isVoiceEnabled
            ? "bg-[#c00000] text-white border border-[#ff4040] shadow-md shadow-[#c00000]/40"
            : isDark
            ? "bg-gray-800/80 text-gray-400 border border-gray-700/60 hover:text-gray-200"
            : "bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-800"
        }`}
        title={isVoiceEnabled ? "AI Voice Narration Active (Click to Mute)" : "Enable AI Voice Narration"}
      >
        <span className={isSpeaking ? "animate-pulse" : ""}>🎙️</span>
        {!compact && <span>{isVoiceEnabled ? "Voice" : "Voice"}</span>}
        {isSpeaking && <AudioWaveform />}
      </button>

      {/* Sound Settings Quick Gear Button */}
      <button
        ref={gearBtnRef}
        type="button"
        onClick={handleToggleSettings}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition text-xs border ${
          showSettings
            ? "bg-[#c00000] text-white border-[#c00000] shadow-sm"
            : isDark
            ? "text-gray-400 hover:bg-gray-800 hover:text-white border-transparent hover:border-gray-700"
            : "text-slate-500 hover:bg-slate-200 hover:text-slate-900 border-transparent hover:border-slate-300"
        }`}
        title="Customize Sound & Audio Settings (Tone, Volume, Mute)"
      >
        ⚙️
      </button>

      {/* Sound Settings Popover - Rendered via Portal at document.body so it NEVER clips or goes off-screen */}
      {showSettings &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Click-away backdrop overlay */}
            <div
              className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px]"
              onClick={() => setShowSettings(false)}
            />

            {/* Floating Popover Container */}
            <div
              ref={popoverRef}
              style={{
                position: "fixed",
                top: `${popoverPos.top}px`,
                left: `${popoverPos.left}px`,
                zIndex: 9999,
              }}
              className={`w-[290px] rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl ring-1 transition-all animate-in fade-in zoom-in-95 duration-150 ${
                isDark
                  ? "border-gray-800 bg-[#0d121f]/98 text-gray-100 ring-white/10 shadow-black/60"
                  : "border-slate-200 bg-white/98 text-slate-900 ring-slate-900/10 shadow-slate-400/40"
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between border-b pb-2.5 mb-3 ${
                  isDark ? "border-gray-800/80" : "border-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎛️</span>
                  <h4
                    className={`text-xs font-black uppercase tracking-wider ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Audio Preferences
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-xs transition ${
                    isDark ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                  title="Close Settings (Esc)"
                >
                  ✕
                </button>
              </div>

              {/* SFX Sound Tones Selection */}
              <div className="space-y-2 mb-3.5">
                <div className="flex items-center justify-between">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    Sound Style & Tone:
                  </label>
                  <button
                    type="button"
                    onClick={() => playStepSound("Test Tone", "card")}
                    className="text-[10px] font-semibold text-[#c00000] hover:underline"
                    title="Play sample tone"
                  >
                    ▶ Test Tone
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {soundThemes.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSfxTheme(st.id);
                        if (st.id !== "mute") playStepSound("Test", "card");
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition border cursor-pointer ${
                        sfxTheme === st.id
                          ? isDark
                            ? "bg-[#c00000]/20 border-[#c00000]/60 text-white font-bold"
                            : "bg-rose-50 border-[#c00000] text-[#c00000] font-bold"
                          : isDark
                          ? "bg-gray-900/60 border-gray-800/80 text-gray-300 hover:bg-gray-800 hover:text-white"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{st.icon}</span>
                        <div>
                          <div className="text-[11px] font-semibold leading-tight">{st.label}</div>
                          <div
                            className={`text-[9.5px] font-normal leading-tight ${
                              isDark ? "text-gray-400" : "text-slate-500"
                            }`}
                          >
                            {st.desc}
                          </div>
                        </div>
                      </div>
                      {sfxTheme === st.id && (
                        <span className="text-[11px] text-emerald-500 font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 mb-3.5">
                <div
                  className={`flex items-center justify-between text-[10px] font-bold uppercase ${
                    isDark ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  <span>SFX Volume</span>
                  <span className="text-sky-500 font-mono font-bold">
                    {Math.round(sfxVolume * 100 * 5)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.02"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#c00000]"
                />
              </div>

              {/* Stop Audio Emergency Button */}
              <button
                type="button"
                onClick={() => {
                  stopAllAudio();
                  setShowSettings(false);
                }}
                className={`w-full rounded-xl py-1.5 text-[10.5px] font-bold border transition cursor-pointer ${
                  isDark
                    ? "bg-gray-800/80 hover:bg-rose-950/60 hover:border-rose-600 border-gray-700/80 text-gray-300 hover:text-rose-200"
                    : "bg-slate-100 hover:bg-rose-50 hover:border-rose-300 border-slate-200 text-slate-700 hover:text-[#c00000]"
                }`}
              >
                ⏹ Stop All Audio Immediately
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
