/**
 * Worxpertise AI Voice Platform - Customer Journey Call Scenarios
 * Realistic enterprise telecom call dialogs mapped to architecture nodes.
 */

export interface TranscriptMessage {
  id: string;
  sender: "customer" | "bot" | "agent" | "system";
  text: string;
  subtext?: string;
  timeOffset: string;
  triggerNodeKeywords: string[]; // Matches against node title/subtitle
  latencyMs?: number;
}

export interface CallScenario {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  description: string;
  caller: {
    name: string;
    phone: string;
    verified: boolean;
    tier: string;
  };
  messages: TranscriptMessage[];
}

export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: "inbound-support",
    name: "Enterprise Inbound AI Voice Assistant",
    shortLabel: "Inbound Support",
    icon: "🎧",
    description: "General enterprise voice inquiry resolved autonomously by Worxpertise AI Voice Agent with real-time CRM API lookup.",
    caller: {
      name: "Rajesh Sharma",
      phone: "+91 98201 43210",
      verified: true,
      tier: "Platinum Client",
    },
    messages: [
      {
        id: "m1",
        sender: "system",
        text: "SIP Session established via Asterisk Dialer. LiveKit media bridge ready.",
        timeOffset: "00:01",
        triggerNodeKeywords: ["call initiated", "dialer", "asterisk", "livekit", "sip invite", "media conversion"],
      },
      {
        id: "m2",
        sender: "bot",
        text: "Welcome to Worxpertise AI Voice Support. How can I help you today, Rajesh?",
        timeOffset: "00:02",
        triggerNodeKeywords: ["ai agent", "campaign configuration", "session ready", "customer context"],
      },
      {
        id: "m3",
        sender: "customer",
        text: "Hi, I am calling to check the status of my enterprise onboarding ticket #8841.",
        timeOffset: "00:04",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
        latencyMs: 110,
      },
      {
        id: "m4",
        sender: "system",
        text: "LLM parsed intent: TICKET_STATUS_LOOKUP (Ticket: #8841). Querying CRM PostgreSQL datastore.",
        subtext: "SELECT status, eta, owner FROM service_tickets WHERE ticket_id='8841'",
        timeOffset: "00:06",
        triggerNodeKeywords: ["llm request", "ai response generation", "database", "postgresql", "tool required"],
        latencyMs: 38,
      },
      {
        id: "m5",
        sender: "bot",
        text: "Your onboarding ticket #8841 is in progress with our technical team and is scheduled for completion today by 5:00 PM. Would you like me to send a status report to your email?",
        timeOffset: "00:08",
        triggerNodeKeywords: ["generated speech", "text-to-speech request", "pronunciation processing", "voice delivery", "live voice conversation"],
        latencyMs: 135,
      },
      {
        id: "m6",
        sender: "customer",
        text: "Yes please, that would be very helpful. Send it to my registered work email.",
        timeOffset: "00:11",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "tool required"],
      },
      {
        id: "m7",
        sender: "system",
        text: "Client API Webhook triggered: Email Summary Dispatched (Status: 200 OK).",
        subtext: "POST https://api.worxpertise.internal/v1/notifications/email",
        timeOffset: "00:13",
        triggerNodeKeywords: ["client api invocation", "tool invocation log", "api response", "asynchronous processing", "security & integration"],
        latencyMs: 82,
      },
      {
        id: "m8",
        sender: "bot",
        text: "The detailed summary has been sent to your email. Is there anything else I can assist you with today?",
        timeOffset: "00:15",
        triggerNodeKeywords: ["return conversational audio", "live voice conversation", "post-call analytics"],
      },
      {
        id: "m9",
        sender: "customer",
        text: "No, that was very quick and smooth. Thank you!",
        timeOffset: "00:17",
        triggerNodeKeywords: ["post-call", "analytics", "recording"],
      },
      {
        id: "m10",
        sender: "system",
        text: "Call ended gracefully. Audio recording & transcript archived to PostgreSQL. CSAT: 5/5.",
        timeOffset: "00:19",
        triggerNodeKeywords: ["call data storage", "structured analysis", "post-call webhook"],
      },
    ],
  },
  {
    id: "outbound-campaign",
    name: "Outbound AI Voice Campaign & Reminder",
    shortLabel: "Outbound Campaign",
    icon: "📞",
    description: "Worxpertise automated dialer initiates call to customer; AI agent interacts, confirms appointment, and triggers webhook.",
    caller: {
      name: "Vikram Malhotra",
      phone: "+91 97112 55819",
      verified: true,
      tier: "Enterprise Partner",
    },
    messages: [
      {
        id: "o1",
        sender: "system",
        text: "Outbound campaign dialer placed SIP call via Asterisk Server. LiveKit media bridge connected.",
        timeOffset: "00:01",
        triggerNodeKeywords: ["call initiated", "dialer", "asterisk", "sip invite", "campaign configuration"],
      },
      {
        id: "o2",
        sender: "customer",
        text: "Hello?",
        timeOffset: "00:02",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
      },
      {
        id: "o3",
        sender: "bot",
        text: "Hello Vikram! This is Worxpertise automated assistant calling regarding your scheduled architecture review meeting tomorrow at 11:00 AM. Are you available?",
        timeOffset: "00:04",
        triggerNodeKeywords: ["ai agent", "session ready", "text-to-speech request", "generated speech"],
      },
      {
        id: "o4",
        sender: "customer",
        text: "Yes, I will be attending the review meeting.",
        timeOffset: "00:07",
        triggerNodeKeywords: ["voice activity detection", "live transcription", "llm request"],
      },
      {
        id: "o5",
        sender: "system",
        text: "LLM confirmed intent: MEETING_CONFIRMED. Updating calendar webhook.",
        subtext: "POST https://api.worxpertise.internal/meetings/confirm",
        timeOffset: "00:09",
        triggerNodeKeywords: ["tool required", "client api invocation", "api response"],
        latencyMs: 74,
      },
      {
        id: "o6",
        sender: "bot",
        text: "Wonderful! Your attendance has been confirmed, and a calendar invite reminder will be sent 1 hour prior. Have a great day!",
        timeOffset: "00:11",
        triggerNodeKeywords: ["return conversational audio", "live voice conversation"],
      },
      {
        id: "o7",
        sender: "system",
        text: "Call completed. Campaign result logged as CONFIRMED in PostgreSQL analytics datastore.",
        timeOffset: "00:14",
        triggerNodeKeywords: ["call data storage", "structured analysis", "post-call webhook"],
      },
    ],
  },
  {
    id: "human-escalation",
    name: "Urgent Escalation & Warm Human Transfer",
    shortLabel: "Human Escalation",
    icon: "🚨",
    description: "Detects urgency or complex request; AI bot initiates warm SIP/IAX2 transfer to live support executive with full context.",
    caller: {
      name: "Amit Patel",
      phone: "+91 97430 11928",
      verified: true,
      tier: "Corporate VIP",
    },
    messages: [
      {
        id: "h1",
        sender: "system",
        text: "Inbound call detected. High-priority VIP route engaged.",
        timeOffset: "00:01",
        triggerNodeKeywords: ["call initiated", "iax2 handoff", "customer context"],
      },
      {
        id: "h2",
        sender: "bot",
        text: "Worxpertise Priority Desk. How may I help you, Amit?",
        timeOffset: "00:02",
        triggerNodeKeywords: ["ai agent", "session ready"],
      },
      {
        id: "h3",
        sender: "customer",
        text: "I am facing an urgent production API outage! I need to speak to a senior technical manager immediately!",
        timeOffset: "00:04",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
      },
      {
        id: "h4",
        sender: "system",
        text: "Urgent Sentiment detected: PRODUCTION_INCIDENT. Route condition met: HUMAN_ESCALATION required.",
        timeOffset: "00:06",
        triggerNodeKeywords: ["llm request", "ai response generation", "tool required"],
        latencyMs: 65,
      },
      {
        id: "h5",
        sender: "bot",
        text: "I completely understand, Amit. I am immediately transferring your call to Priya, our Senior Operations Manager, with full incident details.",
        timeOffset: "00:08",
        triggerNodeKeywords: ["text-to-speech request", "voice delivery", "human transfer"],
      },
      {
        id: "h6",
        sender: "system",
        text: "IAX2 warm transfer initiated to Asterisk Human Queue (Skill: INCIDENT_RESPONSE). Full context & audio forwarded.",
        timeOffset: "00:10",
        triggerNodeKeywords: ["transfer request", "iax2 transfer", "human escalation", "human agent"],
      },
      {
        id: "h7",
        sender: "agent",
        text: "Hello Amit, this is Priya from Senior Support. I have your server logs open on my screen right now. Let's resolve this immediately.",
        timeOffset: "00:12",
        triggerNodeKeywords: ["human agent", "live voice conversation"],
      },
      {
        id: "h8",
        sender: "customer",
        text: "Thank you Priya, the gateway started returning 504 gateway timeouts at 2:10 PM...",
        timeOffset: "00:15",
        triggerNodeKeywords: ["human agent", "call data storage", "structured analysis"],
      },
    ],
  },
  {
    id: "telecom-acd",
    name: "Intelligent Call Center ACD & Skill Routing",
    shortLabel: "ACD & Skill Routing",
    icon: "📞",
    description: "Enterprise telephony ACD flow with conversational IVR, VIP priority queue, and CRM softphone handoff.",
    caller: {
      name: "Sunita Verma",
      phone: "+91 98114 77201",
      verified: true,
      tier: "Diamond Partner",
    },
    messages: [
      {
        id: "acd_m1",
        sender: "system",
        text: "PSTN Call arrived on Toll-Free DID trunk. SIP INVITE accepted by Asterisk PBX.",
        timeOffset: "00:01",
        triggerNodeKeywords: ["customer dial-in", "did trunk", "sip", "dialer"],
      },
      {
        id: "acd_m2",
        sender: "bot",
        text: "Thank you for calling Worxpertise Global Support. Please state the reason for your call in a few words.",
        timeOffset: "00:03",
        triggerNodeKeywords: ["conversational ivr", "intent", "session ready"],
      },
      {
        id: "acd_m3",
        sender: "customer",
        text: "I need to discuss our enterprise contract renewal and upgrade our voice concurrency channels.",
        timeOffset: "00:06",
        triggerNodeKeywords: ["speech intent", "audio streaming", "live transcription"],
        latencyMs: 105,
      },
      {
        id: "acd_m4",
        sender: "system",
        text: "CRM Lookup matched phone +91 98114 77201: Sunita Verma (Diamond Partner, ARR: $250k). Priority routing rule engaged.",
        subtext: "Skill required: ENTERPRISE_ACCOUNTS | Queue: VIP_FASTLANE (<10s SLA)",
        timeOffset: "00:08",
        triggerNodeKeywords: ["crm customer lookup", "vip platinum tier", "priority vip queue"],
        latencyMs: 42,
      },
      {
        id: "acd_m5",
        sender: "bot",
        text: "Welcome back Sunita! As a Diamond Partner, I am connecting you directly with Vikram, your Dedicated Enterprise Account Director.",
        timeOffset: "00:10",
        triggerNodeKeywords: ["priority vip queue", "screen-pop", "softphone"],
        latencyMs: 95,
      },
      {
        id: "acd_m6",
        sender: "system",
        text: "Screen-Pop event pushed to Agent Softphone WebRTC interface with full contract history.",
        timeOffset: "00:12",
        triggerNodeKeywords: ["screen-pop", "softphone", "live agent"],
      },
      {
        id: "acd_m7",
        sender: "agent",
        text: "Hello Sunita, Vikram here. Great to hear from you! I see you are looking to expand voice concurrency. Let's get that setup for you right now.",
        timeOffset: "00:14",
        triggerNodeKeywords: ["live agent interaction", "agent transfer"],
      },
      {
        id: "acd_m8",
        sender: "customer",
        text: "Perfect, Vikram! We are launching our peak campaign next Monday and need 500 concurrent SIP channels.",
        timeOffset: "00:18",
        triggerNodeKeywords: ["live agent", "call data storage"],
      },
      {
        id: "acd_m9",
        sender: "system",
        text: "Call completed successfully. Automated post-call CSAT rating: 5/5 Stars. Call recording saved to S3/Postgres.",
        timeOffset: "00:22",
        triggerNodeKeywords: ["automated csat survey", "post-call", "storage"],
      },
    ],
  },
  {
    id: "fraud-verification",
    name: "FinTech Immediate Fraud Alert & Card Verification",
    shortLabel: "Fraud Verification",
    icon: "🛡️",
    description: "Automated real-time fraud alert call: bot detects high-risk anomaly, alerts cardholder, and takes immediate security action.",
    caller: {
      name: "Rohan Mehra",
      phone: "+91 99302 11984",
      verified: true,
      tier: "Corporate Platinum",
    },
    messages: [
      {
        id: "fr_m1",
        sender: "system",
        text: "Transaction Alert: ₹84,500 at Luxury Retail London, UK on Card ending in 4109. ML Risk Score: 92/100 (HIGH RISK).",
        subtext: "Triggering automated outbound customer voice verification via Worxpertise Telephony.",
        timeOffset: "00:01",
        triggerNodeKeywords: ["payment transaction", "fraud engine", "risk score"],
      },
      {
        id: "fr_m2",
        sender: "bot",
        text: "Hello Rohan, this is an urgent security alert from Worxpertise Fraud Prevention regarding your Corporate Platinum Card ending in 4109. Did you authorize a transaction of ₹84,500 in London just now?",
        timeOffset: "00:03",
        triggerNodeKeywords: ["step-up 2fa challenge", "ai agent", "voice delivery"],
      },
      {
        id: "fr_m3",
        sender: "customer",
        text: "No! I am currently in Mumbai, I did not make that transaction at all!",
        timeOffset: "00:07",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
        latencyMs: 90,
      },
      {
        id: "fr_m4",
        sender: "system",
        text: "Customer confirmed FRAUDULENT_ACTIVITY. SecOps API invoked: Card #4109 permanently frozen. Dispute case #FR-9942 opened.",
        timeOffset: "00:09",
        triggerNodeKeywords: ["account freeze alert", "ml fraud engine", "secops"],
        latencyMs: 35,
      },
      {
        id: "fr_m5",
        sender: "bot",
        text: "I have immediately blocked your card to prevent any further charges. A temporary virtual card has been issued in your mobile app, and a replacement physical card will be delivered in 2 business days. Is there anything else I can secure for you?",
        timeOffset: "00:12",
        triggerNodeKeywords: ["instant approval", "sms receipt", "resolution"],
        latencyMs: 110,
      },
      {
        id: "fr_m6",
        sender: "customer",
        text: "No, thank you so much for the quick catch and immediate block!",
        timeOffset: "00:16",
        triggerNodeKeywords: ["voice activity detection", "call data storage"],
      },
      {
        id: "fr_m7",
        sender: "system",
        text: "SecOps dispute case confirmed. Confirmation SMS & Email dispatched. First Contact Resolution (FCR): 100%.",
        timeOffset: "00:19",
        triggerNodeKeywords: ["sms receipt sent", "post-call", "storage"],
      },
    ],
  },
];
