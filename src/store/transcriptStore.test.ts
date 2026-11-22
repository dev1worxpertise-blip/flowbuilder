import { describe, it, expect, beforeEach } from "vitest";
import { useTranscriptStore } from "./transcriptStore";

describe("transcriptStore", () => {
  beforeEach(() => {
    useTranscriptStore.setState({
      isOpen: false,
      isMinimized: false,
      viewMode: "live",
      selectedScenarioId: "inbound-support",
      customScenarios: {},
      revealedMessageIds: [],
      activeMessage: null,
    });
  });

  it("initializes with default scenario", () => {
    const scenario = useTranscriptStore.getState().getActiveScenario();
    expect(scenario.id).toBe("inbound-support");
    expect(scenario.caller.name).toBe("Rajesh Sharma");
  });

  it("switches scenario and resets revealed messages", () => {
    useTranscriptStore.getState().processNodeStep("Call Initiated", "Asterisk Dialer");
    expect(useTranscriptStore.getState().revealedMessageIds.length).toBeGreaterThan(0);

    useTranscriptStore.getState().setScenario("human-escalation");
    expect(useTranscriptStore.getState().selectedScenarioId).toBe("human-escalation");
    expect(useTranscriptStore.getState().revealedMessageIds.length).toBe(0);
    expect(useTranscriptStore.getState().getActiveScenario().caller.name).toBe("Amit Patel");
  });

  it("reveals messages corresponding to matching node titles", () => {
    useTranscriptStore.getState().processNodeStep("Call Initiated", "Asterisk server");
    const revealed = useTranscriptStore.getState().getRevealedMessages();

    expect(revealed.length).toBeGreaterThan(0);
    expect(revealed.some((m) => m.text.includes("SIP Session") || m.text.includes("LiveKit"))).toBe(true);
  });

  it("handles resetTranscript cleanly", () => {
    useTranscriptStore.getState().processNodeStep("Call Initiated");
    useTranscriptStore.getState().resetTranscript();
    expect(useTranscriptStore.getState().revealedMessageIds.length).toBe(0);
    expect(useTranscriptStore.getState().activeMessage).toBeNull();
  });

  it("toggles open and minimized state", () => {
    expect(useTranscriptStore.getState().isOpen).toBe(false);
    useTranscriptStore.getState().toggleOpen();
    expect(useTranscriptStore.getState().isOpen).toBe(true);

    expect(useTranscriptStore.getState().isMinimized).toBe(false);
    useTranscriptStore.getState().toggleMinimized();
    expect(useTranscriptStore.getState().isMinimized).toBe(true);
  });

  it("supports switching viewMode between live, full and edit", () => {
    expect(useTranscriptStore.getState().viewMode).toBe("live");
    useTranscriptStore.getState().setViewMode("full");
    expect(useTranscriptStore.getState().viewMode).toBe("full");
    useTranscriptStore.getState().setViewMode("edit");
    expect(useTranscriptStore.getState().viewMode).toBe("edit");
  });

  it("reveals all messages on revealAllMessages", () => {
    useTranscriptStore.getState().revealAllMessages();
    const scenario = useTranscriptStore.getState().getActiveScenario();
    expect(useTranscriptStore.getState().revealedMessageIds.length).toBe(scenario.messages.length);
  });

  it("handles step-based fallback when keywords do not match directly", () => {
    useTranscriptStore.getState().processNodeStep("Custom Step A", "Unknown module", 1, 10);
    expect(useTranscriptStore.getState().revealedMessageIds.length).toBeGreaterThan(0);
  });

  it("allows custom script editing (update text, add message, delete message, update caller)", () => {
    const originalCount = useTranscriptStore.getState().getActiveScenario().messages.length;
    const firstMsgId = useTranscriptStore.getState().getActiveScenario().messages[0].id;

    // Update text
    useTranscriptStore.getState().updateMessageText(firstMsgId, "Customized Greeting Text");
    expect(useTranscriptStore.getState().getActiveScenario().messages[0].text).toBe("Customized Greeting Text");

    // Add message
    useTranscriptStore.getState().addMessage("bot", "New bot dialogue line");
    expect(useTranscriptStore.getState().getActiveScenario().messages.length).toBe(originalCount + 1);

    // Update caller
    useTranscriptStore.getState().updateCaller("Suresh Kumar", "+91 99999 88888", "VIP Tier");
    expect(useTranscriptStore.getState().getActiveScenario().caller.name).toBe("Suresh Kumar");

    // Delete message
    useTranscriptStore.getState().deleteMessage(firstMsgId);
    expect(useTranscriptStore.getState().getActiveScenario().messages.length).toBe(originalCount);

    // Reset to default
    useTranscriptStore.getState().resetScenarioToDefault();
    expect(useTranscriptStore.getState().getActiveScenario().caller.name).toBe("Rajesh Sharma");
  });
});
