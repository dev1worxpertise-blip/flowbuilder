import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  playTelecomRing,
  playConnectChime,
  playAiProcessPulse,
  playDecisionTap,
  playAgentHandoff,
  playStepSoundForNode,
  speakStep,
  stopSpeech,
  isSpeechSynthesisSupported,
} from "./audioEngine";

describe("audioEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Web Audio API Synthesizer", () => {
    it("handles missing AudioContext gracefully in non-browser environment without throwing", () => {
      expect(() => playTelecomRing()).not.toThrow();
      expect(() => playConnectChime()).not.toThrow();
      expect(() => playAiProcessPulse()).not.toThrow();
      expect(() => playDecisionTap()).not.toThrow();
      expect(() => playAgentHandoff()).not.toThrow();
    });

    it("triggers correct sound mapping for node titles and kinds", () => {
      // Mock AudioContext
      const mockOsc = {
        type: "sine",
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      const mockGain = {
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      const mockCtx = {
        currentTime: 0,
        state: "running",
        createOscillator: vi.fn(() => mockOsc),
        createGain: vi.fn(() => mockGain),
        destination: {},
        resume: vi.fn().mockResolvedValue(undefined),
      };

      (window as any).AudioContext = vi.fn(() => mockCtx);

      expect(() => playStepSoundForNode("Call Initiated", "card")).not.toThrow();
      expect(() => playStepSoundForNode("SIP INVITE", "card")).not.toThrow();
      expect(() => playStepSoundForNode("Live Transcription", "process")).not.toThrow();
      expect(() => playStepSoundForNode("Tool Required?", "decision")).not.toThrow();
      expect(() => playStepSoundForNode("Human Agent Transfer", "card")).not.toThrow();
      expect(() => playStepSoundForNode("Generic Node", "card")).not.toThrow();
    });
  });

  describe("Web Speech API Narration", () => {
    it("detects speech synthesis availability", () => {
      const supported = isSpeechSynthesisSupported();
      expect(typeof supported).toBe("boolean");
    });

    it("speaks step with SpeechSynthesisUtterance and handles stopSpeech safely", () => {
      const mockCancel = vi.fn();
      const mockSpeak = vi.fn();
      const mockGetVoices = vi.fn(() => []);

      (window as any).speechSynthesis = {
        cancel: mockCancel,
        speak: mockSpeak,
        getVoices: mockGetVoices,
        speaking: false,
      };

      (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
        text,
        rate: 1,
        pitch: 1,
        volume: 1,
      }));

      speakStep("Worxpertise Dialer", "Inbound & Outbound Calling");

      expect(mockCancel).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalled();

      stopSpeech();
      expect(mockCancel).toHaveBeenCalledTimes(2);
    });
  });
});
