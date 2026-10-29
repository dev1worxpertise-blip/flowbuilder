import type { Diagram, FlowNode, FlowEdge, Accent } from "../types";
import { buildHdlTemplate } from "./hdl";

export interface TemplateMeta {
  id: string;
  name: string;
  category: "DevOps" | "Product & Auth" | "Operations" | "Support & IT" | "Hardware & CRM";
  description: string;
  icon: string;
  nodeCount: number;
  build: () => Diagram;
}

function cardNode(
  id: string,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  accent: Accent = "neutral",
  icon?: string
): FlowNode {
  return {
    id,
    type: "card",
    position: { x, y },
    data: {
      title,
      subtitle,
      accent,
      width: 220,
      height: 88,
      glow: true,
      icon,
    },
  };
}

function decisionNode(
  id: string,
  title: string,
  x: number,
  y: number,
  accent: Accent = "amber"
): FlowNode {
  return {
    id,
    type: "decision",
    position: { x, y },
    data: {
      title,
      subtitle: "",
      accent,
      width: 140,
      height: 140,
      glow: true,
    },
  };
}

function shapeNode(
  id: string,
  type: any,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  accent: Accent = "blue",
  width = 180,
  height = 80
): FlowNode {
  return {
    id,
    type,
    position: { x, y },
    data: {
      title,
      subtitle,
      accent,
      width,
      height,
      glow: true,
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  color: string,
  animation: "dots" | "gradient" = "dots",
  label?: string
): FlowEdge {
  return {
    id,
    source,
    target,
    type: "animated",
    data: {
      animation,
      color,
      speed: 3,
      lineStyle: "solid",
      path: "smoothstep",
      label,
    },
  };
}

// 1. CI/CD Pipeline Template
export function buildCicdTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    cardNode("ci1", "1. Code Commit", "Git push / PR merge trigger", 50, 220, "blue", "🚀"),
    cardNode("ci2", "2. Lint & Unit Tests", "Jest, Vitest & ESLint checks", 330, 220, "neutral", "🧪"),
    cardNode("ci3", "3. Build Docker Image", "Multi-stage artifact build", 610, 220, "neutral", "📦"),
    cardNode("ci4", "4. Deploy to Staging", "K8s cluster automated deploy", 890, 220, "blue", "☸️"),
    decisionNode("ci5", "Smoke Tests Pass?", 1170, 200, "amber"),
    cardNode("ci6a", "5A. Deploy to Production", "Zero-downtime Blue/Green rollout", 1450, 110, "green", "🟢"),
    cardNode("ci7a", "6A. Team Notifications", "Slack release announcement & logs", 1730, 110, "green", "📢"),
    cardNode("ci6b", "5B. Rollback Staging", "Auto-revert bad commit & isolate", 1450, 330, "pink", "🔴"),
    cardNode("ci7b", "6B. Alert On-Call", "PagerDuty emergency escalation", 1730, 330, "pink", "🚨"),
  ];

  const edges: FlowEdge[] = [
    edge("e_ci1", "ci1", "ci2", "#60a5fa"),
    edge("e_ci2", "ci2", "ci3", "#60a5fa"),
    edge("e_ci3", "ci3", "ci4", "#60a5fa"),
    edge("e_ci4", "ci4", "ci5", "#fbbf24"),
    edge("e_ci5_yes", "ci5", "ci6a", "#10b981", "dots", "Yes (Passed)"),
    edge("e_ci6_yes", "ci6a", "ci7a", "#10b981", "dots"),
    edge("e_ci5_no", "ci5", "ci6b", "#f43f5e", "dots", "No (Failed)"),
    edge("e_ci6_no", "ci6b", "ci7b", "#f43f5e", "dots"),
  ];

  return {
    id: `cicd-${now}`,
    name: "CI/CD Cloud Deployment Pipeline",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// 2. User Authentication & 2FA Flow
export function buildAuthTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    cardNode("auth1", "1. User Visits App", "Browser or mobile app login screen", 50, 220, "neutral", "👤"),
    cardNode("auth2", "2. Submit Credentials", "Hash check: email & password", 330, 220, "blue", "🔑"),
    decisionNode("auth3", "Valid Password?", 610, 200, "amber"),
    cardNode("auth3_fail", "Account Lock / Error", "Rate limit & record failed attempt", 610, 420, "pink", "🚫"),
    decisionNode("auth4", "2FA Enabled?", 890, 200, "amber"),
    cardNode("auth5_otp", "Send OTP Code", "SMS or Authenticator push token", 1170, 110, "blue", "📱"),
    cardNode("auth6_verify", "Verify OTP", "Check 6-digit cryptographic hash", 1450, 110, "blue", "🔐"),
    cardNode("auth7_jwt", "Issue JWT Session", "Generate signed access token", 1450, 290, "green", "🎟️"),
    cardNode("auth8_dash", "Welcome to Dashboard", "Grant authorized resource access", 1730, 290, "green", "🎉"),
  ];

  const edges: FlowEdge[] = [
    edge("e_auth1", "auth1", "auth2", "#60a5fa"),
    edge("e_auth2", "auth2", "auth3", "#60a5fa"),
    edge("e_auth3_no", "auth3", "auth3_fail", "#f43f5e", "dots", "No (Invalid)"),
    edge("e_auth3_yes", "auth3", "auth4", "#10b981", "dots", "Yes (Valid)"),
    edge("e_auth4_yes", "auth4", "auth5_otp", "#60a5fa", "dots", "Yes (2FA on)"),
    edge("e_auth5", "auth5_otp", "auth6_verify", "#60a5fa"),
    edge("e_auth6", "auth6_verify", "auth7_jwt", "#10b981", "dots", "Verified"),
    edge("e_auth4_no", "auth4", "auth7_jwt", "#10b981", "dots", "No (Direct login)"),
    edge("e_auth7", "auth7_jwt", "auth8_dash", "#10b981"),
  ];

  return {
    id: `auth-${now}`,
    name: "User Authentication & 2FA Flow",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// 3. E-Commerce Order Fulfillment
export function buildEcommerceTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    cardNode("ec1", "1. Place Order", "Customer checkout & payment intent", 50, 220, "blue", "🛒"),
    cardNode("ec2", "2. Payment Gateway", "Stripe / PayPal authorization", 330, 220, "neutral", "💳"),
    decisionNode("ec3", "Payment Success?", 610, 200, "amber"),
    cardNode("ec3_fail", "Payment Declined", "Prompt customer to retry card", 610, 420, "pink", "❌"),
    cardNode("ec4_inv", "3. Inventory Reserve", "ERP warehouse allocation check", 890, 220, "blue", "🏬"),
    cardNode("ec5_pack", "4. Pick & Pack Order", "Automated packing & parcel labeling", 1170, 220, "green", "📦"),
    cardNode("ec6_ship", "5. Courier Dispatch", "FedEx / DHL tracking number generated", 1450, 220, "green", "🚚"),
    cardNode("ec7_done", "6. Order Delivered", "SMS confirmation & review request", 1730, 220, "green", "⭐"),
  ];

  const edges: FlowEdge[] = [
    edge("e_ec1", "ec1", "ec2", "#60a5fa"),
    edge("e_ec2", "ec2", "ec3", "#60a5fa"),
    edge("e_ec3_no", "ec3", "ec3_fail", "#f43f5e", "dots", "No (Declined)"),
    edge("e_ec3_yes", "ec3", "ec4_inv", "#10b981", "dots", "Yes (Approved)"),
    edge("e_ec4", "ec4_inv", "ec5_pack", "#10b981"),
    edge("e_ec5", "ec5_pack", "ec6_ship", "#34d399"),
    edge("e_ec6", "ec6_ship", "ec7_done", "#34d399"),
  ];

  return {
    id: `ecommerce-${now}`,
    name: "E-Commerce Order Fulfillment",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// 4. Incident & Bug Escalation Matrix
export function buildIncidentTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    cardNode("inc1", "1. Incident Detected", "Datadog synthetic alert / Sentry error", 50, 220, "neutral", "⚠️"),
    cardNode("inc2", "2. Initial Triage", "Assess revenue & user blast radius", 330, 220, "blue", "🔍"),
    decisionNode("inc3", "Is P1 Critical?", 610, 200, "amber"),
    cardNode("inc4_p1", "3A. Page Commander", "Instant war room & stakeholder notice", 890, 110, "pink", "🚨"),
    cardNode("inc5_fix", "4A. Emergency Hotfix", "Rollout canary patch with telemetry", 1170, 110, "pink", "🩹"),
    cardNode("inc6_rca", "5A. Blameless Post-Mortem", "Document root cause & prevent repeat", 1450, 110, "green", "📋"),
    cardNode("inc4_p2", "3B. Create Jira Ticket", "Assign standard priority to squad", 890, 330, "blue", "🎫"),
    cardNode("inc5_sched", "4B. Next Sprint Schedule", "Prioritize within sprint backlog", 1170, 330, "neutral", "🗓️"),
  ];

  const edges: FlowEdge[] = [
    edge("e_inc1", "inc1", "inc2", "#60a5fa"),
    edge("e_inc2", "inc2", "inc3", "#60a5fa"),
    edge("e_inc3_yes", "inc3", "inc4_p1", "#f43f5e", "dots", "Yes (P1 Critical)"),
    edge("e_inc4_p1", "inc4_p1", "inc5_fix", "#f43f5e"),
    edge("e_inc5_fix", "inc5_fix", "inc6_rca", "#10b981", "dots", "Resolved"),
    edge("e_inc3_no", "inc3", "inc4_p2", "#60a5fa", "dots", "No (P2/P3)"),
    edge("e_inc4_p2", "inc4_p2", "inc5_sched", "#60a5fa"),
  ];

  return {
    id: `incident-${now}`,
    name: "Incident & Bug Escalation Matrix",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// 5. FinTech Banking KYC & Loan Approval Engine
export function buildBankingTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    shapeNode("bk1", "pill", "1. Loan Request", "Customer Web Portal", 40, 220, "blue", 160, 56),
    shapeNode("bk2", "manualinput", "2. KYC & Income Form", "User submits documents", 260, 215, "neutral", 190, 75),
    shapeNode("bk3", "predefined", "3. Credit Bureau API", "CIBIL / Experian Check", 500, 215, "neutral", 190, 75),
    shapeNode("bk4", "database", "4. Core Banking Ledger", "Credit History & Fraud DB", 740, 210, "blue", 180, 85),
    decisionNode("bk5", "Score >= 750?", 980, 190, "amber"),
    shapeNode("bk6a", "document", "5A. Sanction Letter", "Approved terms & interest", 1220, 100, "green", 185, 80),
    shapeNode("bk7a", "delay", "6A. Cooling Buffer", "Mandatory 24h wait", 1460, 100, "amber", 175, 75),
    shapeNode("bk8a", "pill", "7A. Funds Disbursed", "NEFT / RTGS transfer", 1690, 110, "green", 160, 56),
    shapeNode("bk6b", "document", "5B. Adverse Notice", "Credit rejection reason", 1220, 310, "pink", 185, 80),
    shapeNode("bk7b", "pill", "6B. File Closed", "Logged in Compliance DB", 1460, 320, "pink", 160, 56),
  ];

  const edges: FlowEdge[] = [
    edge("e_bk1", "bk1", "bk2", "#60a5fa"),
    edge("e_bk2", "bk2", "bk3", "#60a5fa"),
    edge("e_bk3", "bk3", "bk4", "#60a5fa"),
    edge("e_bk4", "bk4", "bk5", "#fbbf24"),
    edge("e_bk5_yes", "bk5", "bk6a", "#10b981", "dots", "Yes (>= 750)"),
    edge("e_bk6a", "bk6a", "bk7a", "#10b981"),
    edge("e_bk7a", "bk7a", "bk8a", "#34d399", "dots"),
    edge("e_bk5_no", "bk5", "bk6b", "#f43f5e", "dots", "No (< 750)"),
    edge("e_bk6b", "bk6b", "bk7b", "#f43f5e"),
  ];

  return {
    id: `banking-${now}`,
    name: "FinTech Banking KYC & Loan Engine",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// 6. Real-time Big Data & Event Stream ETL Pipeline
export function buildEtlTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    shapeNode("etl1", "io", "1. IoT Sensor Stream", "MQTT / HTTP Webhooks", 40, 220, "blue", 185, 75),
    shapeNode("etl2", "multidoc", "2. Kafka Log Partitions", "Distributed event broker", 280, 210, "neutral", 185, 85),
    shapeNode("etl3", "delay", "3. Micro-batch Queue", "5-second sliding buffer", 520, 220, "amber", 180, 75),
    shapeNode("etl4", "process", "4. Spark Transformations", "Deduplicate & parse schema", 750, 220, "blue", 195, 75),
    shapeNode("etl5", "database", "5. Snowflake Data Lake", "Partitioned columnar store", 995, 210, "green", 185, 85),
    cardNode("etl6", "6. Live BI Dashboard", "Grafana real-time KPIs", 1235, 215, "green", "📊"),
  ];

  const edges: FlowEdge[] = [
    edge("e_etl1", "etl1", "etl2", "#60a5fa"),
    edge("e_etl2", "etl2", "etl3", "#60a5fa"),
    edge("e_etl3", "etl3", "etl4", "#fbbf24"),
    edge("e_etl4", "etl4", "etl5", "#10b981", "dots"),
    edge("e_etl5", "etl5", "etl6", "#34d399", "dots"),
  ];

  return {
    id: `etl-${now}`,
    name: "Real-Time Big Data ETL Pipeline",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// 7. Hospital Emergency Triage & Patient Admission
export function buildHospitalTemplate(): Diagram {
  const now = Date.now();
  const nodes: FlowNode[] = [
    shapeNode("hosp1", "pill", "1. Patient Arrival", "Emergency Dept Entry", 40, 220, "blue", 160, 56),
    shapeNode("hosp2", "manualop", "2. Nurse Triage Check", "BP, SpO2 & GCS Pulse", 255, 215, "neutral", 185, 75),
    decisionNode("hosp3", "Critical / Trauma?", 495, 190, "amber"),
    shapeNode("hosp4a", "preparation", "3A. Prep Trauma Unit", "Oxygen, Defib & Surgeon", 735, 100, "pink", 195, 75),
    shapeNode("hosp5a", "process", "4A. Emergency ICU Admit", "Continuous bedside monitor", 985, 100, "pink", 190, 75),
    shapeNode("hosp4b", "database", "3B. EHR Records Search", "Allergies & past medical history", 735, 310, "blue", 185, 85),
    shapeNode("hosp5b", "document", "4B. Prescription / Advice", "Medication sheet & OPD advice", 985, 315, "green", 185, 80),
    shapeNode("hosp6", "pill", "5. Treatment Done", "Discharge / Ward transfer", 1240, 220, "green", 160, 56),
  ];

  const edges: FlowEdge[] = [
    edge("e_h1", "hosp1", "hosp2", "#60a5fa"),
    edge("e_h2", "hosp2", "hosp3", "#60a5fa"),
    edge("e_h3_crit", "hosp3", "hosp4a", "#f43f5e", "dots", "Critical (Red)"),
    edge("e_h4a", "hosp4a", "hosp5a", "#f43f5e"),
    edge("e_h5a", "hosp5a", "hosp6", "#f43f5e"),
    edge("e_h3_non", "hosp3", "hosp4b", "#60a5fa", "dots", "Stable (Green)"),
    edge("e_h4b", "hosp4b", "hosp5b", "#60a5fa"),
    edge("e_h5b", "hosp5b", "hosp6", "#10b981"),
  ];

  return {
    id: `hospital-${now}`,
    name: "Hospital Emergency Triage System",
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
    theme: "dark",
  };
}

// Master Template Catalog
export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    id: "template-banking",
    name: "FinTech Banking KYC & Loan Engine",
    category: "Operations",
    description: "Uses Manual Input, Subroutine API, Database, Delay buffer, and Document shapes for credit scoring and loan disbursement.",
    icon: "🏦",
    nodeCount: 10,
    build: buildBankingTemplate,
  },
  {
    id: "template-etl",
    name: "Real-Time Big Data ETL Pipeline",
    category: "DevOps",
    description: "Uses I/O Parallelogram, Multi-Document Kafka logs, Delay Window, Spark Process, Database Lake, and Live KPI Card.",
    icon: "📡",
    nodeCount: 6,
    build: buildEtlTemplate,
  },
  {
    id: "template-hospital",
    name: "Hospital Emergency Triage System",
    category: "Support & IT",
    description: "Uses Manual Operation (Vitals), Hexagonal Preparation, EHR Database, Document Prescription, and Decision branches.",
    icon: "🏥",
    nodeCount: 8,
    build: buildHospitalTemplate,
  },
  {
    id: "template-cicd",
    name: "CI/CD Cloud Deployment Pipeline",
    category: "DevOps",
    description: "Automated test, docker build, staging deployment, smoke checks, and zero-downtime production rollout.",
    icon: "🚀",
    nodeCount: 9,
    build: buildCicdTemplate,
  },
  {
    id: "template-auth",
    name: "User Authentication & 2FA Flow",
    category: "Product & Auth",
    description: "Sign-in credential validation, rate limiting, two-factor SMS/OTP verification, and JWT session generation.",
    icon: "🔐",
    nodeCount: 9,
    build: buildAuthTemplate,
  },
  {
    id: "template-ecommerce",
    name: "E-Commerce Order Fulfillment",
    category: "Operations",
    description: "Shopping cart checkout, payment gateway approval, inventory check, automated packing, and courier delivery tracking.",
    icon: "🛒",
    nodeCount: 8,
    build: buildEcommerceTemplate,
  },
  {
    id: "template-incident",
    name: "Incident & Bug Escalation Matrix",
    category: "Support & IT",
    description: "Monitoring alert triage, P1 war room dispatch, emergency hotfix canary deployment, and post-mortem RCA.",
    icon: "🚨",
    nodeCount: 8,
    build: buildIncidentTemplate,
  },
  {
    id: "template-hdl",
    name: "HDL Customer Lifecycle Flow",
    category: "Hardware & CRM",
    description: "Multi-touchpoint customer engagement, lead prioritization, CRM scrub, and experience metric tracking.",
    icon: "⚡",
    nodeCount: 8,
    build: buildHdlTemplate,
  },
];
