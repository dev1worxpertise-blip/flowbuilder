import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CALL_SCENARIOS, type CallScenario, type TranscriptMessage } from "../data/callScenarios";

interface TranscriptState {
  isOpen: boolean;
  isMinimized: boolean;
  selectedScenarioId: string;
  revealedMessageIds: string[];
  activeMessage: TranscriptMessage | null;

  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleMinimized: () => void;
  setScenario: (scenarioId: string) => void;

  processNodeStep: (title: string, subtitle?: string) => void;
  resetTranscript: () => void;

  getActiveScenario: () => CallScenario;
  getRevealedMessages: () => TranscriptMessage[];
}

export const useTranscriptStore = create<TranscriptState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      selectedScenarioId: "balance-inquiry",
      revealedMessageIds: [],
      activeMessage: null,

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set({ isOpen: !get().isOpen }),
      setIsMinimized: (isMinimized) => set({ isMinimized }),
      toggleMinimized: () => set({ isMinimized: !get().isMinimized }),

      setScenario: (selectedScenarioId) => {
        set({
          selectedScenarioId,
          revealedMessageIds: [],
          activeMessage: null,
        });
      },

      processNodeStep: (title, subtitle = "") => {
        const scenario = get().getActiveScenario();
        if (!scenario) return;

        const combinedText = `${title} ${subtitle}`.toLowerCase();

        // Find messages matching this node that haven't been revealed yet
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
        }
      },

      resetTranscript: () => {
        set({
          revealedMessageIds: [],
          activeMessage: null,
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
        selectedScenarioId: s.selectedScenarioId,
      }),
    }
  )
);
