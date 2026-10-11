import type { ChatMessage } from "./anthropic";

/** One piece of information the agent should try to collect from a caller during the conversation. */
export interface DataField {
  /** Machine-friendly key, e.g. "customer_name" - used as the key in a call's collected data. */
  name: string;
  /** Plain-language description of what to collect, e.g. "the caller's full name". */
  description: string;
}

/**
 * Telephony vendor configuration, kept as a discriminated union so adding a
 * new vendor later (Vobiz, Exotel, ...) means adding one more variant here
 * plus one generator in telephony.ts - nothing in CallSession, the DB
 * schema, or the admin routes needs to change. Only "plivo" exists today.
 */
export type TelephonyVendorConfig = {
  vendor: "plivo";
  authId: string;
  authToken: string;
  phoneNumber: string;
  sipTrunkName: string;
  /** The trunk's "Termination SIP Domain" from the Plivo console - account-specific, not something to guess. */
  sipDomain: string;
};

export type AgentStatus = "draft" | "active";

export interface AgentConfig {
  id: string;
  /** Internal/admin-facing name for this agent - not spoken to callers. */
  name: string;
  /** The opening line the agent speaks first on every call. */
  introLine: string;
  /** How the agent should describe itself/the business if a caller asks who they're talking to. */
  introDescription: string;
  /** What to try to collect from callers during the conversation. */
  dataFields: DataField[];
  /** Piper voice id used for Hindi speech, e.g. "hi_IN-pratham-medium". */
  voiceHi: string;
  /** MeloTTS speaker id used for English speech, e.g. "EN_INDIA". */
  voiceEn: string;
  vendor: TelephonyVendorConfig | null;
  status: AgentStatus;
  /** The setup chatbot's conversation history, persisted so it can be resumed. */
  setupChatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_INTRO_LINE = "Hey, thanks for calling! What can I help you with?";
