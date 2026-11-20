import { useAudioStore } from "../../store/audioStore";

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
  const { isSfxEnabled, isVoiceEnabled, isSpeaking, toggleSfx, toggleVoice } =
    useAudioStore();

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Sound Effects Toggle Button */}
      <button
        type="button"
        onClick={toggleSfx}
        className={`flex items-center gap-1 rounded-full transition cursor-pointer text-xs ${
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          isSfxEnabled
            ? "bg-sky-950/70 text-sky-300 border border-sky-500/40 hover:bg-sky-900/80"
            : "bg-gray-800/60 text-gray-400 border border-gray-700/60 hover:text-gray-200"
        }`}
        title={isSfxEnabled ? "Telecom Sound Effects (Active)" : "Telecom Sound Effects (Muted)"}
      >
        <span>{isSfxEnabled ? "🔊" : "🔇"}</span>
        {!compact && <span>{isSfxEnabled ? "SFX" : "Muted"}</span>}
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
            : "bg-gray-800/60 text-gray-400 border border-gray-700/60 hover:text-gray-200"
        }`}
        title={isVoiceEnabled ? "AI Voice Bot Narration (Speaking Active)" : "Enable AI Voice Bot Narration"}
      >
        <span className={isSpeaking ? "animate-pulse" : ""}>🎙️</span>
        {!compact && <span>{isVoiceEnabled ? "Voice ON" : "Voice"}</span>}
        {isSpeaking && <AudioWaveform />}
      </button>
    </div>
  );
}
