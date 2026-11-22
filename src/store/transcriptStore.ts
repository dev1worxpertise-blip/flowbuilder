import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CALL_SCENARIOS, type CallScenario, type TranscriptMessage } from "../data/callScenarios";

export type TranscriptViewMode = "live" | "full" | "edit";

interface TranscriptState {
  isOpen: boolean;
  isMinimized: boolean;
  viewMode: TranscriptViewMode;
  selectedScenarioId: string;
  customScenarios: Record<string, CallScenario>;
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

  // Custom Script Editing Actions
  updateMessageText: (msgId: string, text: string) => void;
  updateMessageSender: (msgId: string, sender: TranscriptMessage["sender"]) => void;
  addMessage: (sender: TranscriptMessage["sender"], text: string) => void;
  deleteMessage: (msgId: string) => void;
  updateCaller: (name: string, phone: string, tier: string) => void;
  resetScenarioToDefault: (scenarioId?: string) => void;

  // Interactive Live CX & Export Actions
  injectInteractiveCustomerMessage: (
    customerText: string,
    timeOffset?: string
  ) => { botMessage: TranscriptMessage; customerMessage: TranscriptMessage };
  exportTranscriptAsText: () => string;

  getActiveScenario: () => CallScenario;
  getRevealedMessages: () => TranscriptMessage[];
}

export const useTranscriptStore = create<TranscriptState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      viewMode: "live",
      selectedScenarioId: "inbound-support",
      customScenarios: {},
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

        // 2. Proportion fallback if simulation step provided
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

      // Custom Script Editing Actions
      updateMessageText: (msgId, text) => {
        const scenario = { ...get().getActiveScenario() };
        const updatedMsgs = scenario.messages.map((m) =>
          m.id === msgId ? { ...m, text } : m
        );
        scenario.messages = updatedMsgs;
        set({
          customScenarios: {
            ...get().customScenarios,
            [scenario.id]: scenario,
          },
        });
      },

      updateMessageSender: (msgId, sender) => {
        const scenario = { ...get().getActiveScenario() };
        const updatedMsgs = scenario.messages.map((m) =>
          m.id === msgId ? { ...m, sender } : m
        );
        scenario.messages = updatedMsgs;
        set({
          customScenarios: {
            ...get().customScenarios,
            [scenario.id]: scenario,
          },
        });
      },

      addMessage: (sender, text) => {
        const scenario = { ...get().getActiveScenario() };
        const newMsg: TranscriptMessage = {
          id: `custom_${Date.now()}`,
          sender,
          text,
          timeOffset: `00:${(scenario.messages.length * 3 + 2).toString().padStart(2, "0")}`,
          triggerNodeKeywords: [],
        };
        scenario.messages = [...scenario.messages, newMsg];
        set({
          customScenarios: {
            ...get().customScenarios,
            [scenario.id]: scenario,
          },
          revealedMessageIds: [...get().revealedMessageIds, newMsg.id],
        });
      },

      deleteMessage: (msgId) => {
        const scenario = { ...get().getActiveScenario() };
        scenario.messages = scenario.messages.filter((m) => m.id !== msgId);
        set({
          customScenarios: {
            ...get().customScenarios,
            [scenario.id]: scenario,
          },
          revealedMessageIds: get().revealedMessageIds.filter((id) => id !== msgId),
        });
      },

      updateCaller: (name, phone, tier) => {
        const scenario = { ...get().getActiveScenario() };
        scenario.caller = {
          ...scenario.caller,
          name,
          phone,
          tier,
        };
        set({
          customScenarios: {
            ...get().customScenarios,
            [scenario.id]: scenario,
          },
        });
      },

      resetScenarioToDefault: (scenarioId) => {
        const targetId = scenarioId || get().selectedScenarioId;
        const customs = { ...get().customScenarios };
        delete customs[targetId];
        set({
          customScenarios: customs,
          revealedMessageIds: [],
        });
      },

      getActiveScenario: () => {
        const state = get();
        if (state.customScenarios[state.selectedScenarioId]) {
          return state.customScenarios[state.selectedScenarioId];
        }
        return (
          CALL_SCENARIOS.find((s) => s.id === state.selectedScenarioId) ||
          CALL_SCENARIOS[0]
        );
      },

      injectInteractiveCustomerMessage: (customerText, timeOffset = "Live") => {
        const scenario = get().getActiveScenario();
        const lower = customerText.toLowerCase();

        let botReplyText = "";
        let intentName = "";

        if (/supervisor|human|agent|manager|escalat/i.test(lower)) {
          intentName = "HUMAN_ESCALATION_REQUEST";
          botReplyText =
            "I completely understand. I am transferring your call to a senior technical manager right now with your full session context.";
        } else if (/ticket|status|bug|issue|progress|update/i.test(lower)) {
          intentName = "CRM_STATUS_LOOKUP";
          botReplyText =
            "I have retrieved your ticket details from the PostgreSQL datastore. The system indicates active progress with expected resolution shortly.";
        } else if (/refund|bill|payment|charge|fraud|money|invoice/i.test(lower)) {
          intentName = "FINANCIAL_LEDGER_QUERY";
          botReplyText =
            "I have verified your account billing ledger. The authorization check is clear and your statement has been synchronized.";
        } else if (/meeting|appointment|review|demo|schedule|call/i.test(lower)) {
          intentName = "CALENDAR_CONFIRMATION";
          botReplyText =
            "Your architecture walkthrough and review session is confirmed on our calendar. I have sent the invite details to your email.";
        } else {
          intentName = "GENERAL_CONVERSATION";
          botReplyText = `Thank you for your inquiry: "${customerText}". I have verified your request and logged it into our enterprise systems.`;
        }

        const msgTimestamp = timeOffset;
        const custMsgId = `cust_${Date.now()}`;
        const sysMsgId = `sys_${Date.now() + 1}`;
        const botMsgId = `bot_${Date.now() + 2}`;

        const custMsg: TranscriptMessage = {
          id: custMsgId,
          sender: "customer",
          text: customerText,
          timeOffset: msgTimestamp,
          triggerNodeKeywords: ["customer", "audio streaming"],
          latencyMs: Math.floor(Math.random() * 40) + 80,
        };

        const sysMsg: TranscriptMessage = {
          id: sysMsgId,
          sender: "system",
          text: `LLM intent recognized: ${intentName} | Real-Time Latency: ${custMsg.latencyMs}ms`,
          subtext: `Telemetry: Session state synchronized with FlowBuilder live architecture`,
          timeOffset: msgTimestamp,
          triggerNodeKeywords: ["llm", "ai agent"],
          latencyMs: 35,
        };

        const botMsg: TranscriptMessage = {
          id: botMsgId,
          sender: "bot",
          text: botReplyText,
          timeOffset: msgTimestamp,
          triggerNodeKeywords: ["generated speech", "voice delivery"],
          latencyMs: Math.floor(Math.random() * 50) + 95,
        };

        const newMessages = [...scenario.messages, custMsg, sysMsg, botMsg];
        const updatedScenario: CallScenario = {
          ...scenario,
          messages: newMessages,
        };

        const currentCustoms = { ...get().customScenarios };
        currentCustoms[scenario.id] = updatedScenario;

        set({
          customScenarios: currentCustoms,
          revealedMessageIds: [
            ...get().revealedMessageIds,
            custMsgId,
            sysMsgId,
            botMsgId,
          ],
          activeMessage: botMsg,
        });

        return { botMessage: botMsg, customerMessage: custMsg };
      },

      exportTranscriptAsText: () => {
        const scenario = get().getActiveScenario();
        const header = [
          "============================================================",
          `WORXPERTISE ENTERPRISE CALL TRANSCRIPT & CX LOG`,
          `Scenario: ${scenario.name} (${scenario.shortLabel})`,
          `Caller: ${scenario.caller.name} (${scenario.caller.phone}) | Tier: ${scenario.caller.tier}`,
          `Channel: SIP Trunk / WebRTC LiveKit Gateway (Opus 48kHz)`,
          `Export Date: ${new Date().toLocaleString()}`,
          "============================================================",
          "",
        ].join("\n");

        const lines = scenario.messages.map((m) => {
          const speaker =
            m.sender === "customer"
              ? scenario.caller.name
              : m.sender === "agent"
              ? "Human Agent (Priya)"
              : m.sender === "system"
              ? "SYSTEM EVENT"
              : "Worxpertise AI Bot";
          const sub = m.subtext ? `\n      ↳ ${m.subtext}` : "";
          const lat = m.latencyMs ? ` [${m.latencyMs}ms]` : "";
          return `[${m.timeOffset}] ${speaker}${lat}: ${m.text}${sub}`;
        });

        return (
          header +
          lines.join("\n\n") +
          "\n\n============================================================\nEnd of Call Log | First Contact Resolution: Verified\n============================================================"
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
        customScenarios: s.customScenarios,
      }),
    }
  )
);
