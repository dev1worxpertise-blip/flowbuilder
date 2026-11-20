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
    id: "balance-inquiry",
    name: "Account Balance & Auto-Pay (Happy Path)",
    shortLabel: "Balance Inquiry",
    icon: "💳",
    description: "End-to-end self-service inquiry resolved entirely by the AI Bot with instant DB lookup.",
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
        triggerNodeKeywords: ["call initiated", "dialer", "asterisk", "livekit", "sip invite"],
      },
      {
        id: "m2",
        sender: "bot",
        text: "Welcome to Worxpertise Banking. How can I help you today, Rajesh?",
        timeOffset: "00:02",
        triggerNodeKeywords: ["ai agent", "campaign configuration", "session ready"],
      },
      {
        id: "m3",
        sender: "customer",
        text: "Hi, could you please tell me my current savings account balance and any pending bills?",
        timeOffset: "00:04",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
        latencyMs: 120,
      },
      {
        id: "m4",
        sender: "system",
        text: "LLM parsed intent: BALANCE_INQUIRY + PENDING_BILLS. Querying PostgreSQL datastore.",
        subtext: "SELECT balance, pending_bill FROM accounts WHERE cust_id='CUST-98201'",
        timeOffset: "00:06",
        triggerNodeKeywords: ["llm request", "ai response generation", "database", "postgresql"],
        latencyMs: 38,
      },
      {
        id: "m5",
        sender: "bot",
        text: "Your savings balance is ₹48,250. You also have 1 electricity bill of ₹1,420 due on 25th November. Would you like me to process that payment now?",
        timeOffset: "00:08",
        triggerNodeKeywords: ["generated speech", "text-to-speech", "pronunciation processing", "voice delivery", "live voice conversation"],
        latencyMs: 140,
      },
      {
        id: "m6",
        sender: "customer",
        text: "Yes please, pay the electricity bill from my savings account.",
        timeOffset: "00:11",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "tool required"],
      },
      {
        id: "m7",
        sender: "system",
        text: "Payment Gateway webhook triggered: Status SUCCESS (Txn: #WX-884920). Receipt SMS dispatched.",
        subtext: "POST https://api.worxpertise.internal/payments/v1/settle",
        timeOffset: "00:13",
        triggerNodeKeywords: ["client api invocation", "tool invocation log", "api response", "asynchronous processing", "integration & security"],
        latencyMs: 95,
      },
      {
        id: "m8",
        sender: "bot",
        text: "Payment of ₹1,420 was successful! Confirmation reference is WX-884920. Is there anything else I can do for you?",
        timeOffset: "00:15",
        triggerNodeKeywords: ["return conversational audio", "live voice conversation", "post-call analytics"],
      },
      {
        id: "m9",
        sender: "customer",
        text: "That was super fast! No, that's all. Thank you!",
        timeOffset: "00:17",
        triggerNodeKeywords: ["post-call", "analytics", "recording"],
      },
      {
        id: "m10",
        sender: "system",
        text: "Call ended gracefully. Audio recording & transcript archived to PostgreSQL. CSAT: 5/5.",
        timeOffset: "00:19",
        triggerNodeKeywords: ["post-call processing", "webhook", "archive"],
      },
    ],
  },
  {
    id: "tool-api-lookup",
    name: "Enterprise CRM & Live Order Tracking",
    shortLabel: "Order Status API",
    icon: "📦",
    description: "Customer inquires about an e-commerce order; AI bot invokes external REST API webhook in real-time.",
    caller: {
      name: "Pooja Verma",
      phone: "+91 91102 78394",
      verified: true,
      tier: "Gold Member",
    },
    messages: [
      {
        id: "o1",
        sender: "system",
        text: "Call routed from Asterisk IVR to LiveKit AI pipeline. Caller ID verified.",
        timeOffset: "00:01",
        triggerNodeKeywords: ["call initiated", "asterisk", "livekit", "sip invite"],
      },
      {
        id: "o2",
        sender: "bot",
        text: "Hello Pooja! Thanks for calling. How can I assist you today?",
        timeOffset: "00:02",
        triggerNodeKeywords: ["ai agent", "campaign configuration", "session ready"],
      },
      {
        id: "o3",
        sender: "customer",
        text: "Where is my courier order #9021? It was supposed to be delivered yesterday.",
        timeOffset: "00:04",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
      },
      {
        id: "o4",
        sender: "system",
        text: "Tool condition triggered: external REST API invocation required.",
        subtext: "GET https://logistics.worxpertise.com/v2/shipments/9021",
        timeOffset: "00:06",
        triggerNodeKeywords: ["tool required", "tool invocation log", "client api invocation"],
        latencyMs: 78,
      },
      {
        id: "o5",
        sender: "bot",
        text: "Let me check that for you right away. Order 9021 is out for delivery with courier rider Sunil and should reach you by 2:30 PM today.",
        timeOffset: "00:08",
        triggerNodeKeywords: ["api response", "generated speech", "text-to-speech request", "voice delivery"],
        latencyMs: 160,
      },
      {
        id: "o6",
        sender: "customer",
        text: "Can you send the delivery OTP and live tracking link to my WhatsApp?",
        timeOffset: "00:11",
        triggerNodeKeywords: ["live voice conversation", "voice activity detection"],
      },
      {
        id: "o7",
        sender: "system",
        text: "Async webhook triggered: WhatsApp Notification API sent.",
        subtext: "POST https://api.worxpertise.internal/notifications/whatsapp",
        timeOffset: "00:13",
        triggerNodeKeywords: ["asynchronous processing", "client webhook", "security & integration"],
      },
      {
        id: "o8",
        sender: "bot",
        text: "I have just sent the OTP and rider live tracking link to your registered mobile number on WhatsApp. Anything else?",
        timeOffset: "00:15",
        triggerNodeKeywords: ["return conversational audio", "live voice conversation"],
      },
      {
        id: "o9",
        sender: "customer",
        text: "Got it on my phone! Thanks a lot.",
        timeOffset: "00:17",
        triggerNodeKeywords: ["post-call", "analytics"],
      },
    ],
  },
  {
    id: "human-escalation",
    name: "Urgent Card Fraud & Human Agent Escalation",
    shortLabel: "Human Escalation",
    icon: "🚨",
    description: "Detects urgency & high-risk card security intent, instantly executing a warm SIP/IAX2 transfer to an executive.",
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
        text: "I just got an unauthorized transaction alert on my credit card! I need to block it immediately and speak to an executive!",
        timeOffset: "00:04",
        triggerNodeKeywords: ["voice activity detection", "audio streaming", "live transcription"],
      },
      {
        id: "h4",
        sender: "system",
        text: "High Urgency Sentiment detected: FRAUD_ALERT. Locking card temporarily via Core API.",
        subtext: "POST /cards/temp-lock { card: '****4491', reason: 'FRAUD_REPORTED' }",
        timeOffset: "00:06",
        triggerNodeKeywords: ["llm request", "ai response generation", "tool required"],
        latencyMs: 65,
      },
      {
        id: "h5",
        sender: "bot",
        text: "I understand, Amit. I have immediately placed a security lock on your card ending in 4491. I am transferring you to our Senior Fraud Officer right away.",
        timeOffset: "00:08",
        triggerNodeKeywords: ["text-to-speech request", "voice delivery", "human transfer"],
      },
      {
        id: "h6",
        sender: "system",
        text: "IAX2 warm transfer initiated to Asterisk Human Queue (Skill: FRAUD_DISPUTE). Full context & transcript forwarded to agent console.",
        timeOffset: "00:10",
        triggerNodeKeywords: ["transfer request", "iax2 transfer", "human escalation", "human agent"],
      },
      {
        id: "h7",
        sender: "agent",
        text: "Hello Amit, this is Priya from Fraud Prevention. I see the card is locked and I have your full details here. Let's review the suspicious charges together.",
        timeOffset: "00:12",
        triggerNodeKeywords: ["human agent", "live voice conversation"],
      },
      {
        id: "h8",
        sender: "customer",
        text: "Thank goodness you have all the context. The charge was for ₹85,000 at 2:14 PM...",
        timeOffset: "00:15",
        triggerNodeKeywords: ["human agent", "post-call analytics"],
      },
    ],
  },
];
