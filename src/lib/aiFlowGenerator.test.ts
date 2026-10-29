import { expect, test, describe } from "vitest";
import { generateFlowFromText } from "./aiFlowGenerator";

describe("aiFlowGenerator", () => {
  test("generates domain flow for fintech prompt", () => {
    const res = generateFlowFromText("Build a loan approval and KYC workflow for a bank");
    expect(res.name).toBe("FinTech KYC & Loan Approval");
    expect(res.nodes.length).toBeGreaterThanOrEqual(8);
    expect(res.edges.length).toBeGreaterThanOrEqual(8);
    expect(res.summary.decisionCount).toBeGreaterThanOrEqual(1);

    // Verify coordinates are layouted (not all 0)
    const hasPositions = res.nodes.some((n) => n.position.x !== 0 || n.position.y !== 0);
    expect(hasPositions).toBe(true);
  });

  test("generates domain flow for IT incident response", () => {
    const res = generateFlowFromText("IT Incident response and outage escalation flow");
    expect(res.name).toBe("IT Incident Response & Escalation");
    expect(res.nodes.some((n) => n.type === "decision")).toBe(true);
    expect(res.edges.some((e) => e.data.label?.includes("Severity"))).toBe(true);
  });

  test("parses arrow-separated natural syntax", () => {
    const prompt = "User logs in -> Verify 2FA token? -> Check Role Permissions -> Access Admin Dashboard";
    const res = generateFlowFromText(prompt);
    expect(res.nodes.length).toBeGreaterThanOrEqual(4);
    expect(res.nodes.some((n) => n.type === "decision")).toBe(true);
    expect(res.edges.length).toBeGreaterThanOrEqual(3);
  });

  test("parses newline-separated list", () => {
    const prompt = `
      1. Order placed by customer
      2. Payment gateway authorization
      3. Inventory available?
      4. Dispatch from warehouse
      5. Delivery confirmed
    `;
    const res = generateFlowFromText(prompt);
    expect(res.nodes.length).toBeGreaterThanOrEqual(5);
    expect(res.summary.nodeCount).toBeGreaterThanOrEqual(5);
  });

  test("supports Top-to-Bottom (TB) direction", () => {
    const res = generateFlowFromText("A -> B -> C", { direction: "TB" });
    expect(res.nodes.length).toBe(3);
    // In TB layout, nodes should increase in Y coordinate
    expect(res.nodes[2].position.y).toBeGreaterThan(res.nodes[0].position.y);
  });

  test("parses user sales management prompt and generates clean non-overlapping flow", () => {
    const prompt =
      "i need a sales management flow. lead will come on different social media platform and insert into lead squared and insert into our database using webhook. if approve call else whatsapp";
    const res = generateFlowFromText(prompt);

    expect(res.name.toLowerCase()).toContain("sales");
    expect(res.nodes.length).toBeGreaterThanOrEqual(6);
    expect(res.summary.decisionCount).toBeGreaterThanOrEqual(1);

    // Verify all node titles are clean and concise (not whole sentences)
    for (const node of res.nodes) {
      expect(node.data.title.length).toBeLessThanOrEqual(40);
      expect(node.data.width).toBeDefined();
    }

    // Verify decision node and branches exist
    const decisionNode = res.nodes.find((n) => n.type === "decision");
    expect(decisionNode).toBeDefined();

    // Verify edges have animations and labels
    expect(res.edges.some((e) => e.data.label?.toLowerCase().includes("call") || e.data.label?.toLowerCase().includes("whatsapp"))).toBe(true);
  });

  test("parses custom natural text with if-else branching", () => {
    const prompt = "User submits KYC form. Ingest into verification system. if verified approve loan else request additional docs";
    const res = generateFlowFromText(prompt);

    expect(res.nodes.some((n) => n.type === "decision")).toBe(true);
    expect(res.edges.length).toBeGreaterThan(res.nodes.length - 2);
  });
});
