import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type Tone =
  | "warm"
  | "direct"
  | "playful"
  | "calm"
  | "motivational"
  | "analytical"
  | "spiritual"
  | "no-nonsense";

export type ResponseLength = "concise" | "balanced" | "detailed";
export type Depth = "fast" | "balanced" | "deep";
export type Visibility = "public" | "code";

export type Role = "admin" | "coach";
export type AccountStatus = "active" | "suspended";

export interface Coach {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
  planId?: string;
  planSubscriptionId?: string;
  planStatus?: string;
  planRenewsAt?: string;
  planCancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeAccountId?: string;
  payoutsReady?: boolean;
  payoutsDetailsSubmitted?: boolean;
}

/** A plan coaches pay the platform for. Commission applies to what their clients pay them. */
export interface Plan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  commissionPct: number;
  maxMinds: number;
  canCharge: boolean;
  highlight: boolean;
  features: string[];
}

export type PricingMode = "free" | "paid";

export interface Pack {
  id: string;
  messages: number;
  price: number;
}

/** What a mind's clients pay. Amounts are in the currency's minor unit (cents). */
export interface Pricing {
  mode: PricingMode;
  currency: string;
  freeMessages: number;
  monthly: number | null;
  yearly: number | null;
  packs: Pack[];
}

export const DEFAULT_PRICING: Pricing = { mode: "free", currency: "usd", freeMessages: 5, monthly: null, yearly: null, packs: [] };

export interface Client {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  stripeCustomerId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ClientSession {
  tokenHash: string;
  clientId: string;
  expiresAt: string;
}

export interface Membership {
  id: string;
  clientId: string;
  botId: string;
  coachId: string;
  stripeSubscriptionId: string;
  status: string;
  interval: "month" | "year";
  amount: number;
  currency: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface CreditBalance {
  clientId: string;
  botId: string;
  remaining: number;
}

export type PaymentKind = "client_subscription" | "client_pack" | "coach_plan";

export interface Payment {
  id: string;
  at: string;
  kind: PaymentKind;
  coachId: string;
  botId?: string;
  clientId?: string;
  amount: number;
  currency: string;
  platformFee: number;
  stripeRef: string;
  description: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  niche: string;
  audience: string;
  website: string;
  message: string;
  status: "new" | "approved" | "rejected";
  createdAt: string;
  inviteId?: string;
}

export interface Invite {
  id: string;
  token: string;
  email: string;
  note: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
}

export interface Settings {
  signupMode: "open" | "invite" | "closed";
  visitorMessagesPer10Min: number;
  plans: Plan[];
  defaultPlanId: string;
  platformCurrency: string;
  demoSlug: string;
  /** Monthly AI spend budget in USD cents; 0 = no budget. */
  aiMonthlyBudget: number;
}

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Launch your first AI mind",
    priceMonthly: 0,
    commissionPct: 15,
    maxMinds: 1,
    canCharge: true,
    highlight: false,
    features: ["1 AI mind", "Unlimited knowledge uploads", "Charge clients (15% platform fee)", "Conversation insights"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For coaches growing a paid community",
    priceMonthly: 2900,
    commissionPct: 8,
    maxMinds: 5,
    canCharge: true,
    highlight: true,
    features: ["5 AI minds", "Everything in Starter", "Lower 8% platform fee", "Private access codes", "Priority support"],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For established coaching businesses",
    priceMonthly: 9900,
    commissionPct: 3,
    maxMinds: 0,
    canCharge: true,
    highlight: false,
    features: ["Unlimited AI minds", "Everything in Pro", "Lowest 3% platform fee", "Website embed for every mind"],
  },
];

export const DEFAULT_SETTINGS: Settings = {
  signupMode: "invite",
  visitorMessagesPer10Min: 40,
  plans: DEFAULT_PLANS,
  defaultPlanId: "starter",
  platformCurrency: "usd",
  demoSlug: "",
  aiMonthlyBudget: 0,
};

/** Token usage aggregated per day, mind and model. */
export interface UsageRow {
  day: string;
  botId: string;
  coachId: string;
  model: string;
  messages: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** Coach/admin test-chat usage, as opposed to real clients. */
  preview?: boolean;
  /** Cost computed per request at list prices, in millionths of a USD. */
  costMicros?: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorEmail: string;
  action: string;
  target: string;
}

export interface Session {
  tokenHash: string;
  coachId: string;
  expiresAt: string;
}

export interface Bot {
  id: string;
  coachId: string;
  slug: string;
  name: string;
  coachName: string;
  tagline: string;
  avatarEmoji: string;
  avatarImage: string | null;
  brandColor: string;
  bio: string;
  philosophy: string;
  instructions: string;
  tones: Tone[];
  responseLength: ResponseLength;
  boundaries: string;
  welcomeMessage: string;
  starters: string[];
  ctaLabel: string;
  ctaUrl: string;
  model: string;
  depth: Depth;
  visibility: Visibility;
  accessCode: string;
  published: boolean;
  pricing: Pricing;
  createdAt: string;
  updatedAt: string;
}

export type SourceKind = "file" | "url" | "text";

export interface Source {
  id: string;
  botId: string;
  kind: SourceKind;
  title: string;
  origin: string;
  chars: number;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface Conversation {
  id: string;
  botId: string;
  visitorId: string;
  title: string;
  preview: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Data {
  coaches: Coach[];
  sessions: Session[];
  bots: Bot[];
  sources: Source[];
  conversations: Conversation[];
  invites: Invite[];
  settings: Settings;
  usage: UsageRow[];
  audit: AuditEntry[];
  clients: Client[];
  clientSessions: ClientSession[];
  memberships: Membership[];
  credits: CreditBalance[];
  payments: Payment[];
  applications: Application[];
  processedEvents: string[];
}

export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? "./data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SOURCES_DIR = path.join(DATA_DIR, "sources");

const empty = (): Data => ({
  coaches: [],
  sessions: [],
  bots: [],
  sources: [],
  conversations: [],
  invites: [],
  settings: { ...DEFAULT_SETTINGS },
  usage: [],
  audit: [],
  clients: [],
  clientSessions: [],
  memberships: [],
  credits: [],
  payments: [],
  applications: [],
  processedEvents: [],
});

async function load(): Promise<Data> {
  try {
    const raw = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Partial<Data>;
    const data = { ...empty(), ...raw };
    data.settings = { ...DEFAULT_SETTINGS, ...raw.settings };
    if (!data.settings.plans?.length) data.settings.plans = DEFAULT_PLANS;
    for (const c of data.coaches) {
      c.role ??= "coach";
      c.status ??= "active";
    }
    for (const b of data.bots) b.pricing = { ...DEFAULT_PRICING, ...b.pricing };
    return data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw err;
  }
}

async function save(data: Data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(tmp, DB_FILE);
}

// Serialize every read-modify-write so concurrent requests can't clobber each other.
const g = globalThis as unknown as { __dbQueue?: Promise<unknown> };

export type { Data };

export function read(): Promise<Data> {
  return load();
}

export function mutate<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
  const run = (g.__dbQueue ?? Promise.resolve()).then(async () => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  });
  g.__dbQueue = run.catch(() => undefined);
  return run;
}

function sourcePath(id: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("Invalid source id");
  return path.join(SOURCES_DIR, `${id}.txt`);
}

export async function writeSourceText(id: string, text: string) {
  await fs.mkdir(SOURCES_DIR, { recursive: true });
  await fs.writeFile(sourcePath(id), text);
}

export async function readSourceText(id: string): Promise<string> {
  try {
    return await fs.readFile(sourcePath(id), "utf8");
  } catch {
    return "";
  }
}

export async function deleteSourceText(id: string) {
  await fs.rm(sourcePath(id), { force: true });
}
