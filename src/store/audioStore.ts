import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  playStepSoundForNode,
  speakStep,
  stopSpeech,
  playConnectChime,
  type SoundTheme,
} from "../lib/audioEngine";

export interface AudioState {
  isSfxEnabled: boolean;
  isVoiceEnabled: boolean;
  isSpeaking: boolean;
  sfxTheme: SoundTheme;
  sfxVolume: number;

  toggleSfx: () => void;
  toggleVoice: () => void;
  setSfxEnabled: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setSfxTheme: (theme: SoundTheme) => void;
  setSfxVolume: (volume: number) => void;
  setIsSpeaking: (speaking: boolean) => void;

  playStepSound: (title: string, kind?: string) => void;
  narrateStep: (title: string, subtitle?: string) => void;
  stopAllAudio: () => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      isSfxEnabled: true,
      isVoiceEnabled: false,
      isSpeaking: false,
      sfxTheme: "telecom",
      sfxVolume: 0.16,

      toggleSfx: () => {
        const next = !get().isSfxEnabled;
        set({ isSfxEnabled: next });
        if (next && get().sfxTheme !== "mute") {
          playConnectChime(get().sfxVolume);
        }
      },

      toggleVoice: () => {
        const next = !get().isVoiceEnabled;
        if (!next) {
          stopSpeech();
          set({ isVoiceEnabled: false, isSpeaking: false });
        } else {
          set({ isVoiceEnabled: true });
          speakStep("Voice narration active", "AI walkthrough ready", {
            onStart: () => set({ isSpeaking: true }),
            onEnd: () => set({ isSpeaking: false }),
          });
        }
      },

      setSfxEnabled: (isSfxEnabled) => set({ isSfxEnabled }),
      setVoiceEnabled: (isVoiceEnabled) => {
        if (!isVoiceEnabled) stopSpeech();
        set({ isVoiceEnabled, isSpeaking: false });
      },

      setSfxTheme: (sfxTheme) => set({ sfxTheme }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume }),
      setIsSpeaking: (isSpeaking) => set({ isSpeaking }),

      playStepSound: (title, kind) => {
        const { isSfxEnabled, sfxTheme, sfxVolume } = get();
        if (isSfxEnabled && sfxTheme !== "mute") {
          playStepSoundForNode(title, kind, true, sfxTheme, sfxVolume);
        }
      },

      narrateStep: (title, subtitle) => {
        if (!get().isVoiceEnabled) return;
        speakStep(title, subtitle, {
          onStart: () => set({ isSpeaking: true }),
          onEnd: () => set({ isSpeaking: false }),
        });
      },

      stopAllAudio: () => {
        stopSpeech();
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        set({ isSpeaking: false });
      },
    }),
    {
      name: "worxpertise-audio-preferences",
      partialize: (s) => ({
        isSfxEnabled: s.isSfxEnabled,
        isVoiceEnabled: s.isVoiceEnabled,
        sfxTheme: s.sfxTheme,
        sfxVolume: s.sfxVolume,
      }),
    }
  )
);
