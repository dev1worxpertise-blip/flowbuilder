/**
 * Worxpertise Audio & Voice Engine
 * 1. Web Audio API synthesized sound effects (100% offline, zero external asset files)
 * 2. Web Speech API AI voice bot narration with natural pacing and waveform events
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// -------------------------------------------------------------
// 1. SYNTHESIZED SOUND EFFECTS (Zero audio files / 100% offline)
// -------------------------------------------------------------

/** Realistic telecom ring-back tone (dual frequency 440Hz + 480Hz) */
export function playTelecomRing(volume = 0.18): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(440, now);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(480, now);

  // Telecom cadence burst (0.55s burst with gentle envelope)
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.05);
  gain.gain.setValueAtTime(volume, now + 0.45);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.56);
  osc2.stop(now + 0.56);
}

/** Soft melodic harmonic chime (C5 -> E5 -> G5) for connection / media ready */
export function playConnectChime(volume = 0.15): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + idx * 0.09;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.42);
  });
}

/** Futuristic shimmer frequency sweep for AI / LLM / Speech processing */
export function playAiProcessPulse(volume = 0.12): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.34);
}

/** Subtle acoustic pop for decision branching */
export function playDecisionTap(volume = 0.14): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/** Gentle office transfer bell chime for human agent escalation */
export function playAgentHandoff(volume = 0.16): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(987.77, now); // B5 bell tone
  osc.frequency.setValueAtTime(1318.51, now + 0.12); // E6

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.62);
}

/** Soft navigation step click */
export function playStepClick(volume = 0.08): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(540, now);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Automatically selects and plays the contextual sound effect for a flowchart step
 */
export function playStepSoundForNode(
  title = "",
  kind = "card",
  enabled = true
): void {
  if (!enabled) return;
  const t = title.toLowerCase();

  if (
    t.includes("dialer") ||
    t.includes("call") ||
    t.includes("initiat") ||
    t.includes("inbound") ||
    t.includes("outbound") ||
    t.includes("asterisk")
  ) {
    playTelecomRing();
  } else if (
    t.includes("connect") ||
    t.includes("sip") ||
    t.includes("livekit") ||
    t.includes("media") ||
    t.includes("session")
  ) {
    playConnectChime();
  } else if (
    t.includes("stt") ||
    t.includes("tts") ||
    t.includes("llm") ||
    t.includes("speech") ||
    t.includes("ai") ||
    t.includes("transcription") ||
    t.includes("generation")
  ) {
    playAiProcessPulse();
  } else if (
    kind === "decision" ||
    t.includes("check") ||
    t.includes("require") ||
    t.includes("decision")
  ) {
    playDecisionTap();
  } else if (
    t.includes("transfer") ||
    t.includes("human") ||
    t.includes("agent") ||
    t.includes("escalat")
  ) {
    playAgentHandoff();
  } else {
    playStepClick();
  }
}

// -------------------------------------------------------------
// 2. AI VOICE BOT NARRATION (Web Speech API)
// -------------------------------------------------------------

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeaking(): boolean {
  return currentUtterance !== null;
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export interface VoiceNarrationOptions {
  onStart?: () => void;
  onEnd?: () => void;
  rate?: number;
  pitch?: number;
}

/**
 * Speaks step title and description using natural voice synthesis
 */
export function speakStep(
  title: string,
  subtitle = "",
  options?: VoiceNarrationOptions
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  stopSpeech();

  // Create clear, natural spoken sentence
  const cleanTitle = title.replace(/^\d+(\.\d+)?\s*/, "").replace(/[|•]/g, " ");
  let speechText = cleanTitle;
  if (subtitle && subtitle.length > 2 && subtitle.length < 160) {
    speechText += `. ${subtitle}`;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = options?.rate ?? 1.05; // Slightly confident, brisk pace
  utterance.pitch = options?.pitch ?? 1.0;

  // Pick high-quality English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Google") ||
        v.name.includes("Natural") ||
        v.name.includes("Jenny") ||
        v.name.includes("Samantha") ||
        v.name.includes("Zira"))
  ) || voices.find((v) => v.lang.startsWith("en"));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    options?.onEnd?.();
    currentUtterance = null;
  };

  utterance.onerror = () => {
    options?.onEnd?.();
    currentUtterance = null;
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
