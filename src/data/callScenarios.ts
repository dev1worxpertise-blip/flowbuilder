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
];
