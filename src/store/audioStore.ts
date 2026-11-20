import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  playStepSoundForNode,
  speakStep,
  stopSpeech,
  playConnectChime,
} from "../lib/audioEngine";

export interface AudioState {
  isSfxEnabled: boolean;
  isVoiceEnabled: boolean;
  isSpeaking: boolean;

  toggleSfx: () => void;
  toggleVoice: () => void;
  setSfxEnabled: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
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

      toggleSfx: () => {
        const next = !get().isSfxEnabled;
        set({ isSfxEnabled: next });
        if (next) {
          playConnectChime(0.12);
        }
      },

      toggleVoice: () => {
        const next = !get().isVoiceEnabled;
        if (!next) {
          stopSpeech();
          set({ isVoiceEnabled: false, isSpeaking: false });
        } else {
          set({ isVoiceEnabled: true });
          // Short confirmation announcement
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

      setIsSpeaking: (isSpeaking) => set({ isSpeaking }),

      playStepSound: (title, kind) => {
        if (get().isSfxEnabled) {
          playStepSoundForNode(title, kind, true);
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
        set({ isSpeaking: false });
      },
    }),
    {
      name: "worxpertise-audio-preferences",
      partialize: (s) => ({
        isSfxEnabled: s.isSfxEnabled,
        isVoiceEnabled: s.isVoiceEnabled,
      }),
    }
  )
);
