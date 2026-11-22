import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CALL_SCENARIOS, type CallScenario, type TranscriptMessage } from "../data/callScenarios";

export type TranscriptViewMode = "live" | "full";

interface TranscriptState {
  isOpen: boolean;
  isMinimized: boolean;
  viewMode: TranscriptViewMode;
  selectedScenarioId: string;
  revealedMessageIds: string[];
  activeMessage: TranscriptMessage | null;

  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleMinimized: () => void;
  setViewMode: (mode: TranscriptViewMode) => void;
  setScenario: (scenarioId: string) => void;

  processNodeStep: (title: string, subtitle?: string, stepNumber?: number, totalSteps?: number) => void;
  resetTranscript: () => void;
  revealAllMessages: () => void;

  getActiveScenario: () => CallScenario;
  getRevealedMessages: () => TranscriptMessage[];
}

export const useTranscriptStore = create<TranscriptState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      viewMode: "live",
      selectedScenarioId: "balance-inquiry",
      revealedMessageIds: [],
      activeMessage: null,

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set({ isOpen: !get().isOpen }),
      setIsMinimized: (isMinimized) => set({ isMinimized }),
      toggleMinimized: () => set({ isMinimized: !get().isMinimized }),
      setViewMode: (viewMode) => set({ viewMode }),

      setScenario: (selectedScenarioId) => {
        set({
          selectedScenarioId,
          revealedMessageIds: [],
          activeMessage: null,
        });
      },

      processNodeStep: (title, subtitle = "", stepNumber, totalSteps) => {
        const scenario = get().getActiveScenario();
        if (!scenario) return;

        const combinedText = `${title} ${subtitle}`.toLowerCase();

        // 1. Match by keyword
        const matchingMessages = scenario.messages.filter((msg) => {
          if (get().revealedMessageIds.includes(msg.id)) return false;
          return msg.triggerNodeKeywords.some((keyword) =>
            combinedText.includes(keyword.toLowerCase())
          );
        });

        if (matchingMessages.length > 0) {
          const newIds = matchingMessages.map((m) => m.id);
          const latest = matchingMessages[matchingMessages.length - 1];
          set({
            revealedMessageIds: [...get().revealedMessageIds, ...newIds],
            activeMessage: latest,
          });
          return;
        }

        // 2. Proportion fallback if simulation step provided (ensures dialogue flows even if node title differs)
        if (typeof stepNumber === "number" && typeof totalSteps === "number" && totalSteps > 0) {
          const targetIndex = Math.min(
            scenario.messages.length - 1,
            Math.floor((stepNumber / totalSteps) * scenario.messages.length)
          );
          const toReveal = scenario.messages.slice(0, targetIndex + 1);
          const newIds = toReveal.map((m) => m.id);
          set({
            revealedMessageIds: Array.from(new Set([...get().revealedMessageIds, ...newIds])),
            activeMessage: toReveal[toReveal.length - 1] || null,
          });
        }
      },

      resetTranscript: () => {
        set({
          revealedMessageIds: [],
          activeMessage: null,
        });
      },

      revealAllMessages: () => {
        const scenario = get().getActiveScenario();
        set({
          revealedMessageIds: scenario.messages.map((m) => m.id),
          activeMessage: scenario.messages[scenario.messages.length - 1] || null,
        });
      },

      getActiveScenario: () => {
        const state = get();
        return (
          CALL_SCENARIOS.find((s) => s.id === state.selectedScenarioId) ||
          CALL_SCENARIOS[0]
        );
      },

      getRevealedMessages: () => {
        const scenario = get().getActiveScenario();
        const revealedIds = new Set(get().revealedMessageIds);
        return scenario.messages.filter((m) => revealedIds.has(m.id));
      },
    }),
    {
      name: "worxpertise-transcript-preferences",
      partialize: (s) => ({
        isOpen: s.isOpen,
        isMinimized: s.isMinimized,
        viewMode: s.viewMode,
        selectedScenarioId: s.selectedScenarioId,
      }),
    }
  )
);
