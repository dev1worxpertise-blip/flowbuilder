import { applyAutoLayout, type LayoutDirection } from "./autoLayout";
import type { FlowNode, FlowEdge, NodeKind, Accent } from "../types";

export interface GeneratedFlowResult {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  summary: {
    nodeCount: number;
    edgeCount: number;
    decisionCount: number;
  };
}

export interface GenerateFlowOptions {
  direction?: LayoutDirection;
  colorTheme?: "worx" | "multi";
}

interface StepNodeDef {
  id: string;
  title: string;
  subtitle: string;
  kind: NodeKind;
  accent: Accent;
  isDecision?: boolean;
}

/** Pre-built intelligent domain blueprints for prompt topics */
const DOMAIN_BLUEPRINTS: Record<
  string,
  {
    name: string;
    steps: StepNodeDef[];
    edges: { from: number; to: number; label?: string; color?: string }[];
  }
> = {
  sales: {
    name: "Sales & Omnichannel Lead Routing",
    steps: [
      { id: "ai_1", title: "1. Social Media Lead Ingest", subtitle: "Facebook, LinkedIn, Ads capture", kind: "pill", accent: "blue" },
      { id: "ai_2", title: "2. Ingest to LeadSquared CRM", subtitle: "Lead profile & attributes enrichment", kind: "card", accent: "neutral" },
      { id: "ai_3", title: "3. Webhook Database Sync", subtitle: "Database insert via webhook trigger", kind: "predefined", accent: "blue" },
      { id: "ai_4", title: "Lead Approved?", subtitle: "Qualification & triage score check", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_5a", title: "4A. Direct Voice Call", subtitle: "Agent dialer outbound callout", kind: "card", accent: "green" },
      { id: "ai_5b", title: "4B. WhatsApp Outreach", subtitle: "Automated WhatsApp sequence", kind: "card", accent: "crimson" },
      { id: "ai_6", title: "5. Lead Routing Logged", subtitle: "CRM status & activity confirmed", kind: "pill", accent: "green" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4, label: "Approved (Call)", color: "#34d399" },
      { from: 3, to: 5, label: "Else (WhatsApp)", color: "#c00000" },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
    ],
  },
  fintech: {
    name: "FinTech KYC & Loan Approval",
    steps: [
      { id: "ai_1", title: "1. Customer Application", subtitle: "Mobile app submission", kind: "pill", accent: "blue" },
      { id: "ai_2", title: "2. Document OCR Scan", subtitle: "National ID & selfie match", kind: "process", accent: "neutral" },
      { id: "ai_3", title: "Identity Verified?", subtitle: "Automated fraud score check", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_4a", title: "3A. Credit Bureau API", subtitle: "CIBIL / Experian pull", kind: "predefined", accent: "blue" },
      { id: "ai_4b", title: "3B. Flag Fraud Risk", subtitle: "AML watch-list match", kind: "card", accent: "crimson" },
      { id: "ai_5", title: "Credit Score > 750?", subtitle: "Risk underwriting check", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_6a", title: "4A. Instant Disbursement", subtitle: "IMPS / UPI instant transfer", kind: "process", accent: "green" },
      { id: "ai_6b", title: "4B. Manual Underwriter Review", subtitle: "Risk officer desk triage", kind: "manualop", accent: "neutral" },
      { id: "ai_7", title: "5. Loan Account Created", subtitle: "Agreement PDF & Repayment schedule", kind: "document", accent: "green" },
      { id: "ai_8", title: "6. Application Rejected", subtitle: "Notice SMS & reason email", kind: "pill", accent: "crimson" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "Verified (Yes)", color: "#34d399" },
      { from: 2, to: 4, label: "Mismatch (No)", color: "#c00000" },
      { from: 3, to: 5 },
      { from: 5, to: 6, label: "Score >= 750 (Auto)", color: "#34d399" },
      { from: 5, to: 7, label: "Score < 750 (Review)", color: "#fbbf24" },
      { from: 6, to: 8 },
      { from: 7, to: 8, label: "Approved", color: "#34d399" },
      { from: 7, to: 9, label: "Declined", color: "#c00000" },
      { from: 4, to: 9 },
    ],
  },
  incident: {
    name: "IT Incident Response & Escalation",
    steps: [
      { id: "ai_1", title: "1. Alert Fired", subtitle: "Prometheus / Datadog monitor", kind: "pill", accent: "crimson" },
      { id: "ai_2", title: "2. Automated Health Check", subtitle: "Synthetic endpoint probe", kind: "process", accent: "neutral" },
      { id: "ai_3", title: "P1 / Critical Outage?", subtitle: "Severity classification", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_4a", title: "3A. Page On-Call Lead", subtitle: "PagerDuty urgent callout", kind: "card", accent: "crimson" },
      { id: "ai_4b", title: "3B. Standard JIRA Ticket", subtitle: "Level 1 queue triage", kind: "card", accent: "blue" },
      { id: "ai_5", title: "4. War Room & Incident Triage", subtitle: "Eng + DevOps bridge", kind: "manualop", accent: "neutral" },
      { id: "ai_6", title: "Service Restored?", subtitle: "Traffic verification", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_7", title: "5. Rollback or Patch", subtitle: "Revert canary / restart pod", kind: "process", accent: "crimson" },
      { id: "ai_8", title: "6. Post-Mortem & RCA", subtitle: "Incident report & action items", kind: "document", accent: "green" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "Severity P1", color: "#c00000" },
      { from: 2, to: 4, label: "Severity P2/P3", color: "#60a5fa" },
      { from: 3, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 8, label: "Resolved (Yes)", color: "#34d399" },
      { from: 6, to: 7, label: "Still Failing (No)", color: "#c00000" },
      { from: 7, to: 5 },
      { from: 4, to: 8 },
    ],
  },
  ecommerce: {
    name: "E-Commerce Return & Refund Flow",
    steps: [
      { id: "ai_1", title: "1. Return Requested", subtitle: "Customer order portal", kind: "pill", accent: "blue" },
      { id: "ai_2", title: "2. Verify Return Window", subtitle: "Within 30-day return policy?", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_3", title: "3. Generate Return Waybill", subtitle: "Courier pickup label", kind: "document", accent: "neutral" },
      { id: "ai_4", title: "4. Warehouse QA Inspection", subtitle: "Barcoded item condition check", kind: "manualop", accent: "blue" },
      { id: "ai_5", title: "Item in Good Condition?", subtitle: "Tags intact & undamaged", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_6a", title: "5A. Initiate Bank Refund", subtitle: "Payment gateway reversal", kind: "process", accent: "green" },
      { id: "ai_6b", title: "5B. Return to Customer", subtitle: "Failed QA inspection", kind: "card", accent: "crimson" },
      { id: "ai_7", title: "6. Restock Inventory", subtitle: "Database inventory count updated", kind: "database", accent: "green" },
      { id: "ai_8", title: "7. Return Denied", subtitle: "Exceeded policy window", kind: "pill", accent: "crimson" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2, label: "Within 30 Days", color: "#34d399" },
      { from: 1, to: 7, label: "Overdue", color: "#c00000" },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5, label: "Passed QA", color: "#34d399" },
      { from: 4, to: 6, label: "Damaged / Rejected", color: "#c00000" },
      { from: 5, to: 7 },
    ],
  },
  hr: {
    name: "Employee Leave & Vacation Approval",
    steps: [
      { id: "ai_1", title: "1. Submit Leave Request", subtitle: "HR portal dates & reason", kind: "pill", accent: "blue" },
      { id: "ai_2", title: "2. Check Leave Balance", subtitle: "Database quota calculation", kind: "database", accent: "neutral" },
      { id: "ai_3", title: "Quota Available?", subtitle: "Sufficient PTO balance", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_4", title: "3. Manager Approval", subtitle: "Department lead notification", kind: "card", accent: "blue" },
      { id: "ai_5", title: "Manager Approved?", subtitle: "Team coverage review", kind: "decision", accent: "amber", isDecision: true },
      { id: "ai_6", title: "4. Calendar Block & Payroll Update", subtitle: "Sync Slack, Calendar & Salary", kind: "process", accent: "green" },
      { id: "ai_7", title: "5. Leave Request Approved", subtitle: "Confirmation notification", kind: "pill", accent: "green" },
      { id: "ai_8", title: "6. Request Rejected", subtitle: "Manager note & balance status", kind: "pill", accent: "crimson" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "Quota OK", color: "#34d399" },
      { from: 2, to: 7, label: "Insufficient Balance", color: "#c00000" },
      { from: 3, to: 4 },
      { from: 4, to: 5, label: "Approved", color: "#34d399" },
      { from: 4, to: 7, label: "Declined", color: "#c00000" },
      { from: 5, to: 6 },
    ],
  },
};

/** Match words in prompt to detect domain topics */
function detectDomainMatch(prompt: string): string | null {
  const p = prompt.toLowerCase();
  if (
    p.includes("leadsquared") ||
    (p.includes("lead") && (p.includes("social media") || p.includes("whatsapp") || p.includes("webhook") || p.includes("sales"))) ||
    (p.includes("sales management") && p.includes("lead"))
  ) {
    return "sales";
  }
  if (p.includes("loan") || p.includes("kyc") || p.includes("bank") || p.includes("credit") || p.includes("fintech")) {
    return "fintech";
  }
  if (p.includes("incident") || p.includes("outage") || p.includes("alert") || p.includes("pager") || p.includes("rca") || p.includes("escalat")) {
    return "incident";
  }
  if (p.includes("return") || p.includes("refund") || p.includes("ecommerce") || p.includes("e-commerce") || p.includes("order") || p.includes("shipping")) {
    return "ecommerce";
  }
  if (p.includes("leave") || p.includes("vacation") || p.includes("hr") || p.includes("pto") || p.includes("onboard")) {
    return "hr";
  }
  return null;
}

/** Detect node kind from step description */
function detectKind(text: string): NodeKind {
  const t = text.toLowerCase();
  if (t.includes("?") || t.includes("check") || t.includes("verify") || t.includes("if ") || t.includes("decision") || t.includes("valid") || t.includes("critical") || t.includes("approve")) {
    return "decision";
  }
  if (t.includes("start") || t.includes("begin") || t.includes("end") || t.includes("done") || t.includes("finish") || t.includes("submit") || t.includes("capture")) {
    return "pill";
  }
  if (t.includes("db") || t.includes("database") || t.includes("record") || t.includes("sql") || t.includes("store") || t.includes("save")) {
    return "database";
  }
  if (t.includes("document") || t.includes("pdf") || t.includes("report") || t.includes("invoice") || t.includes("agreement") || t.includes("form")) {
    return "document";
  }
  if (t.includes("api") || t.includes("webhook") || t.includes("service") || t.includes("cloud") || t.includes("subroutine") || t.includes("leadsquared") || t.includes("crm")) {
    return "predefined";
  }
  if (t.includes("manual") || t.includes("input") || t.includes("user enter") || t.includes("type")) {
    return "manualinput";
  }
  if (t.includes("wait") || t.includes("delay") || t.includes("timer") || t.includes("sleep")) {
    return "delay";
  }
  return "card";
}

/** Summarize long sentence into clean short title and subtitle */
function formatStepTitleAndSubtitle(rawText: string, stepNum?: number): { title: string; subtitle: string } {
  let cleaned = rawText
    .replace(/^\s*(?:step\s*)?\d+[\s.:-]+/i, "")
    .replace(/^(?:i need a|create a|generate a|build a|please|then|next|after that)\s+/i, "")
    .trim();

  // If text is short, use it directly
  if (cleaned.length <= 26 && !cleaned.includes(".")) {
    const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return {
      title: stepNum ? `${stepNum}. ${formatted}` : formatted,
      subtitle: "Automated workflow step",
    };
  }

  // Keywords to extract concise titles
  const lower = cleaned.toLowerCase();
  let title = "";
  let subtitle = cleaned;

  if (lower.includes("social media") || lower.includes("lead will come") || lower.includes("lead come")) {
    title = "Social Media Lead Capture";
    subtitle = "Inbound leads from social media ads & channels";
  } else if (lower.includes("leadsquared") || lower.includes("crm")) {
    title = "Ingest into CRM";
    subtitle = "LeadSquared capture & attribute sync";
  } else if (lower.includes("webhook") && lower.includes("database")) {
    title = "Webhook Database Sync";
    subtitle = "Database insert via webhook event";
  } else if (lower.includes("database") || lower.includes("insert into database")) {
    title = "Database Record Insert";
    subtitle = "Store records in central database";
  } else if (lower.includes("if approve") || lower.includes("approved")) {
    title = "Lead Approved?";
    subtitle = "Qualification check & approval filter";
  } else if (lower.includes("whatsapp")) {
    title = "WhatsApp Outreach";
    subtitle = "Automated WhatsApp sequence dispatch";
  } else if (lower.includes("call")) {
    title = "Initiate Voice Call";
    subtitle = "Direct agent dialer outbound callout";
  } else if (lower.includes("email")) {
    title = "Send Email Notice";
    subtitle = "Automated email confirmation";
  } else if (lower.includes("payment") || lower.includes("pay")) {
    title = "Process Payment";
    subtitle = "Payment gateway transaction";
  } else {
    // Truncate to first 4 words
    const words = cleaned.split(/\s+/);
    title = words.slice(0, 4).join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    subtitle = words.slice(4).join(" ") || "Operational workflow process";
  }

  if (subtitle.length > 55) {
    subtitle = subtitle.slice(0, 52) + "...";
  }

  return {
    title: stepNum ? `${stepNum}. ${title}` : title,
    subtitle,
  };
}

/** Parse free-form user prompt into structured flowchart nodes and edges */
export function generateFlowFromText(prompt: string, options: GenerateFlowOptions = {}): GeneratedFlowResult {
  const direction = options.direction || "LR";
  const colorTheme = options.colorTheme || "worx";
  const trimmed = prompt.trim();

  // 1. Check if matches pre-built domain blueprint
  const domainKey = detectDomainMatch(trimmed);
  if (domainKey && DOMAIN_BLUEPRINTS[domainKey]) {
    const blueprint = DOMAIN_BLUEPRINTS[domainKey];
    const nodes: FlowNode[] = blueprint.steps.map((s) => ({
      id: s.id,
      type: s.kind,
      position: { x: 0, y: 0 },
      data: {
        title: s.title,
        subtitle: s.subtitle,
        accent:
          colorTheme === "worx"
            ? s.accent === "crimson"
              ? "crimson"
              : s.accent === "green"
              ? "green"
              : s.accent === "amber"
              ? "amber"
              : "neutral"
            : s.accent,
        width: s.kind === "decision" ? 140 : s.kind === "pill" ? 180 : 220,
        height: s.kind === "decision" ? 140 : s.kind === "pill" ? 56 : 84,
        glow: true,
      },
    }));

    const edges: FlowEdge[] = blueprint.edges.map((e, idx) => ({
      id: `ai_edge_${idx + 1}`,
      source: blueprint.steps[e.from].id,
      target: blueprint.steps[e.to].id,
      type: "animated",
      data: {
        animation: "dots",
        color: e.color || (colorTheme === "worx" ? "#c00000" : "#60a5fa"),
        speed: 3,
        lineStyle: "solid",
        path: "smoothstep",
        label: e.label,
      },
    }));

    const layout = applyAutoLayout(nodes, edges, direction);
    return {
      name: blueprint.name,
      nodes: layout.nodes,
      edges: layout.edges,
      summary: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        decisionCount: nodes.filter((n) => n.type === "decision").length,
      },
    };
  }

  // 2. Intelligent NLP Clause Splitting
  // Extract flow name from meta-intents like "i need a sales management flow."
  let flowName = "Custom Automated Workflow";
  let content = trimmed;
  const metaMatch = content.match(/^(?:i need (?:a|an)|create (?:a|an)|generate (?:a|an)|build (?:a|an))\s+([^.]+?)(?:flow|process|workflow|diagram)?\s*[.:]/i);
  if (metaMatch) {
    flowName = metaMatch[1].trim() + " Flow";
    flowName = flowName.charAt(0).toUpperCase() + flowName.slice(1);
    content = content.replace(metaMatch[0], "").trim();
  }

  // Check for inline if/else pattern e.g. "if approve call else whatsapp"
  let conditionalBranch: { condition: string; trueAction: string; falseAction: string } | null = null;
  const ifElseMatch = content.match(/\bif\s+([^,]+?)\s+(?:then\s+)?([^,]+?)\s+else\s+([^.]+)/i);
  if (ifElseMatch) {
    conditionalBranch = {
      condition: ifElseMatch[1].trim(),
      trueAction: ifElseMatch[2].trim(),
      falseAction: ifElseMatch[3].trim(),
    };
    content = content.replace(ifElseMatch[0], "").trim();
  }

  // Split on arrows, newlines, periods, or conjunctions
  let rawClauses: string[] = [];
  if (content.includes("->") || content.includes("-->")) {
    rawClauses = content.split(/--?>/).map((s) => s.trim()).filter(Boolean);
  } else if (content.includes("\n")) {
    rawClauses = content.split("\n").map((s) => s.replace(/^\s*[-*•\d.]+\s*/, "").trim()).filter((s) => s.length > 2);
  } else {
    // Split sentences and major action connectors
    rawClauses = content
      .split(/(?:\.\s+|\s+(?:and\s+)?then\s+|\s+and\s+insert\s+into\s+|\s+and\s+send\s+to\s+)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
  }

  if (rawClauses.length === 0) {
    rawClauses = ["Initialize Request", "Process Action", "Complete Operation"];
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let stepIdx = 1;

  // Build sequential steps from clauses
  rawClauses.forEach((clause, idx) => {
    const id = `ai_node_${stepIdx}`;
    const kind = detectKind(clause);
    const isFirst = idx === 0;
    const nodeKind: NodeKind = isFirst ? "pill" : kind;
    const { title, subtitle } = formatStepTitleAndSubtitle(clause, stepIdx);

    const accent: Accent =
      nodeKind === "decision"
        ? "amber"
        : colorTheme === "worx"
        ? stepIdx % 2 === 0
          ? "crimson"
          : "neutral"
        : "blue";

    nodes.push({
      id,
      type: nodeKind,
      position: { x: 0, y: 0 },
      data: {
        title,
        subtitle,
        accent,
        width: nodeKind === "decision" ? 140 : nodeKind === "pill" ? 180 : 220,
        height: nodeKind === "decision" ? 140 : nodeKind === "pill" ? 56 : 84,
        glow: true,
      },
    });

    if (nodes.length > 1) {
      const prev = nodes[nodes.length - 2];
      edges.push({
        id: `ai_edge_${stepIdx}`,
        source: prev.id,
        target: id,
        type: "animated",
        data: {
          animation: "dots",
          color: colorTheme === "worx" ? "#c00000" : "#60a5fa",
          speed: 3,
          lineStyle: "solid",
          path: "smoothstep",
        },
      });
    }

    stepIdx++;
  });

  // If an "if ... else ..." conditional was found, append decision diamond + 2 branches
  if (conditionalBranch) {
    const lastSequentialNode = nodes[nodes.length - 1];
    const decisionId = `ai_decision_${stepIdx}`;
    const condText = conditionalBranch.condition.charAt(0).toUpperCase() + conditionalBranch.condition.slice(1);
    const decisionTitle = condText.endsWith("?") ? condText : `${condText}?`;

    // Decision Diamond Node
    nodes.push({
      id: decisionId,
      type: "decision",
      position: { x: 0, y: 0 },
      data: {
        title: decisionTitle,
        subtitle: "Conditional branch check",
        accent: "amber",
        width: 140,
        height: 140,
        glow: true,
      },
    });

    edges.push({
      id: `ai_edge_to_dec_${stepIdx}`,
      source: lastSequentialNode.id,
      target: decisionId,
      type: "animated",
      data: {
        animation: "dots",
        color: colorTheme === "worx" ? "#c00000" : "#60a5fa",
        speed: 3,
        lineStyle: "solid",
        path: "smoothstep",
      },
    });
    stepIdx++;

    // True Branch Node
    const trueId = `ai_branch_true_${stepIdx}`;
    const trueDetails = formatStepTitleAndSubtitle(conditionalBranch.trueAction);
    nodes.push({
      id: trueId,
      type: "card",
      position: { x: 0, y: 0 },
      data: {
        title: trueDetails.title,
        subtitle: trueDetails.subtitle,
        accent: "green",
        width: 210,
        height: 84,
        glow: true,
      },
    });

    edges.push({
      id: `ai_edge_true_${stepIdx}`,
      source: decisionId,
      target: trueId,
      type: "animated",
      data: {
        animation: "dots",
        color: "#34d399",
        speed: 3,
        lineStyle: "solid",
        path: "smoothstep",
        label: "Yes / " + conditionalBranch.condition,
      },
    });
    stepIdx++;

    // False / Else Branch Node
    const falseId = `ai_branch_false_${stepIdx}`;
    const falseDetails = formatStepTitleAndSubtitle(conditionalBranch.falseAction);
    nodes.push({
      id: falseId,
      type: "card",
      position: { x: 0, y: 0 },
      data: {
        title: falseDetails.title,
        subtitle: falseDetails.subtitle,
        accent: "crimson",
        width: 210,
        height: 84,
        glow: true,
      },
    });

    edges.push({
      id: `ai_edge_false_${stepIdx}`,
      source: decisionId,
      target: falseId,
      type: "animated",
      data: {
        animation: "dots",
        color: "#c00000",
        speed: 3,
        lineStyle: "solid",
        path: "smoothstep",
        label: "Else / " + conditionalBranch.falseAction.split(" ")[0],
      },
    });
    stepIdx++;

    // Completion Node
    const endId = `ai_node_end_${stepIdx}`;
    nodes.push({
      id: endId,
      type: "pill",
      position: { x: 0, y: 0 },
      data: {
        title: `${stepIdx}. Flow Completed`,
        subtitle: "Execution finished successfully",
        accent: "green",
        width: 180,
        height: 56,
        glow: true,
      },
    });

    edges.push({
      id: `ai_edge_end_true_${stepIdx}`,
      source: trueId,
      target: endId,
      type: "animated",
      data: {
        animation: "dots",
        color: "#34d399",
        speed: 3,
        lineStyle: "solid",
        path: "smoothstep",
      },
    });

    edges.push({
      id: `ai_edge_end_false_${stepIdx}`,
      source: falseId,
      target: endId,
      type: "animated",
      data: {
        animation: "dots",
        color: "#c00000",
        speed: 3,
        lineStyle: "solid",
        path: "smoothstep",
      },
    });
  }

  const layout = applyAutoLayout(nodes, edges, direction);
  return {
    name: flowName,
    nodes: layout.nodes,
    edges: layout.edges,
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      decisionCount: nodes.filter((n) => n.type === "decision").length,
    },
  };
}
