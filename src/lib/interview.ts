export const INTERVIEW_QUESTIONS = [
  { id: "who", q: "Who do you help, and what change do you help them make?", hint: "e.g. “Burnt-out founders who want to keep their company without losing their health.”" },
  { id: "story", q: "What's your story? How did you end up doing this work?", hint: "The moments that shaped you. Clients connect with this." },
  { id: "beliefs", q: "What do you believe that most people in your field don't?", hint: "Your strong opinions and principles." },
  { id: "method", q: "Walk me through your signature method or framework, step by step.", hint: "Names, steps, exercises — the more specific, the better." },
  { id: "problems", q: "What are the 3–5 things clients come to you with most, and how do you usually respond?", hint: "Real examples of what you'd say." },
  { id: "voice", q: "How do you talk? Words you use, how direct or gentle you are, any humour?", hint: "Paste a typical message you'd send a client if you like." },
  { id: "never", q: "What should your AI never do or say? Anything it should hand back to you?", hint: "Topics to avoid, things to always refer to you." },
  { id: "offer", q: "How can people work with you more deeply? (Offer and link, optional)", hint: "e.g. “12-week 1:1 program — calendly.com/you”" },
] as const;

export type InterviewAnswers = Partial<Record<(typeof INTERVIEW_QUESTIONS)[number]["id"], string>>;
