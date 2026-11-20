import { describe, it, expect, beforeEach } from "vitest";
import { useTranscriptStore } from "./transcriptStore";

describe("transcriptStore", () => {
  beforeEach(() => {
    useTranscriptStore.setState({
      isOpen: false,
      isMinimized: false,
      selectedScenarioId: "balance-inquiry",
      revealedMessageIds: [],
      activeMessage: null,
    });
  });

  it("initializes with default scenario", () => {
    const scenario = useTranscriptStore.getState().getActiveScenario();
    expect(scenario.id).toBe("balance-inquiry");
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
});
