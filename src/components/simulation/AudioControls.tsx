import { useState, useRef, useEffect } from "react";
import { useAudioStore } from "../../store/audioStore";
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

export function AudioControls({ compact = false }: { compact?: boolean }) {
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
  } = useAudioStore();

  const [showSettings, setShowSettings] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const soundThemes: { id: SoundTheme; label: string; icon: string; desc: string }[] = [
    { id: "telecom", label: "Telecom Modern", icon: "📞", desc: "Ring-back, SIP harmonic chimes & AI pulses" },
    { id: "soft", label: "Soft Acoustic", icon: "🍃", desc: "Subtle, non-intrusive soft clicks" },
    { id: "chime", label: "Pure Chimes", icon: "🔔", desc: "Harmonic musical chime triad tones" },
    { id: "mute", label: "Mute All SFX", icon: "🔇", desc: "Completely silent during all steps" },
  ];

  return (
    <div className="relative flex items-center gap-1 shrink-0" ref={popoverRef}>
      {/* Sound Effects Toggle Button (Click to toggle Mute / Sound) */}
      <button
        type="button"
        onClick={toggleSfx}
        className={`flex items-center gap-1 rounded-full transition cursor-pointer text-xs ${
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          isSfxEnabled && sfxTheme !== "mute"
            ? "bg-sky-950/70 text-sky-300 border border-sky-500/40 hover:bg-sky-900/80"
            : "bg-gray-800/80 text-gray-400 border border-gray-700/60 hover:text-gray-200"
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
            : "bg-gray-800/80 text-gray-400 border border-gray-700/60 hover:text-gray-200"
        }`}
        title={isVoiceEnabled ? "AI Voice Narration Active (Click to Mute)" : "Enable AI Voice Narration"}
      >
        <span className={isSpeaking ? "animate-pulse" : ""}>🎙️</span>
        {!compact && <span>{isVoiceEnabled ? "Voice" : "Voice"}</span>}
        {isSpeaking && <AudioWaveform />}
      </button>

      {/* Sound Settings Quick Gear Button */}
      <button
        type="button"
        onClick={() => setShowSettings((s) => !s)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition text-xs border border-transparent hover:border-gray-700"
        title="Customize Sound & Audio Settings (Tone, Volume, Mute)"
      >
        ⚙️
      </button>

      {/* Sound Settings Popover */}
      {showSettings && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-2xl border border-gray-800 bg-[#0d121f]/98 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 z-[100] text-gray-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🎛️</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Audio Preferences
              </h4>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* SFX Sound Tones Selection */}
          <div className="space-y-2 mb-3.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Sound Style & Tone:
            </label>
            <div className="grid grid-cols-1 gap-1">
              {soundThemes.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSfxTheme(st.id);
                  }}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition border ${
                    sfxTheme === st.id
                      ? "bg-[#c00000]/20 border-[#c00000]/60 text-white font-bold"
                      : "bg-gray-900/60 border-gray-800/80 text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{st.icon}</span>
                    <div>
                      <div className="text-[11px] font-semibold">{st.label}</div>
                      <div className="text-[9px] text-gray-400 font-normal">{st.desc}</div>
                    </div>
                  </div>
                  {sfxTheme === st.id && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>SFX Volume</span>
              <span className="text-sky-400 font-mono">
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
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#c00000]"
            />
          </div>

          {/* Stop Audio Emergency Button */}
          <button
            onClick={() => {
              stopAllAudio();
              setShowSettings(false);
            }}
            className="w-full rounded-xl bg-gray-800/80 hover:bg-rose-950/60 hover:border-rose-600 border border-gray-700/80 py-1.5 text-[10.5px] font-bold text-gray-300 hover:text-rose-200 transition"
          >
            ⏹ Stop All Audio Immediately
          </button>
        </div>
      )}
    </div>
  );
}
