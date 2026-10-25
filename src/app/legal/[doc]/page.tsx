import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand";
import { read } from "@/lib/db";

type Props = { params: Promise<{ doc: string }> };

const TITLES = { terms: "Terms of Service", privacy: "Privacy Policy", refunds: "Refund Policy" } as const;
type Doc = keyof typeof TITLES;

export async function generateMetadata({ params }: Props) {
  const { doc } = await params;
  return { title: TITLES[doc as Doc] ?? "Legal" };
}

function sections(doc: Doc, company: string, email: string): [string, string[]][] {
  const contact = email ? `email us at ${email}` : "contact us through the website";
  if (doc === "terms") {
    return [
      ["The service", [`${company} lets coaches ("Coaches") create AI assistants ("Minds") trained on their own material, and lets their clients ("Clients") talk to them. By using the service you agree to these terms.`]],
      [
        "AI responses",
        [
          "Minds are powered by artificial intelligence. Responses can be inaccurate or incomplete and are not a substitute for professional medical, mental-health, legal, financial or other professional advice.",
          "If you are in crisis or danger, contact your local emergency services immediately.",
        ],
      ],
      [
        "Coaches",
        [
          "Coaches are responsible for the material they upload, the instructions they give their Minds, and the prices they set. Coaches must have the right to use everything they upload.",
          "Coaches are the sellers of their memberships and message packs. Payments are processed by Stripe and paid out to the Coach's connected Stripe account; the platform keeps the fee shown on the Coach's plan.",
        ],
      ],
      [
        "Clients",
        [
          "Memberships renew automatically until cancelled. You can cancel at any time from your account; access continues until the end of the paid period.",
          "Message packs give a number of AI replies for the specific Mind they were bought for and do not expire.",
        ],
      ],
      ["Acceptable use", ["Don't use the service to break the law, harm others, attempt to extract other users' data, or overload or reverse-engineer the service. We may suspend accounts that do."]],
      ["Liability", [`The service is provided "as is". To the extent the law allows, ${company} is not liable for indirect or consequential losses, or for decisions made based on AI responses.`]],
      ["Changes", [`We may update these terms; we'll show the new date at the top. Questions? Please ${contact}.`]],
    ];
  }
  if (doc === "privacy") {
    return [
      [
        "What we collect",
        [
          "Account details: name, email address and a securely hashed password.",
          "Conversations with Minds, ratings you give to replies, and — when the Coach has enabled it — short notes the Mind keeps about your goals and context so it can remember you between conversations.",
          "Content Coaches upload to train their Minds.",
          "Payment records (amounts, dates, status). Card details are handled by Stripe and never reach our servers.",
          "Technical data: a salted, one-way hash of your IP address (used to prevent abuse of free trials and rate limits) and essential cookies that keep you signed in.",
        ],
      ],
      [
        "How it's used",
        [
          "To run the service: generate AI replies, keep your conversation history, process payments and prevent abuse.",
          "The Coach whose Mind you talk to can read your conversations with that Mind, to improve it and to support you.",
        ],
      ],
      [
        "Who processes it",
        [
          "Anthropic (AI model provider) processes conversation content to generate replies.",
          "Stripe processes payments. An email provider may be used to send account emails such as password resets.",
          "We don't sell your personal data or use it for advertising.",
        ],
      ],
      [
        "Your choices",
        [
          "Clients can download all their data or delete their account at any time from their account page. Deleting your account removes your conversations and memory notes; payment records are kept where required for accounting.",
          `For anything else, please ${contact}.`,
        ],
      ],
    ];
  }
  return [
    ["Memberships", ["You can cancel a membership at any time from your account page. Cancelling stops future renewals; you keep access until the end of the period you've paid for. We don't provide prorated refunds for partial periods unless required by law."]],
    ["Message packs", ["Message packs are generally non-refundable once any of the messages have been used. If something went wrong, contact us and we'll look at it — refunds for packs remove the matching unused messages."]],
    ["Coach plans", ["Coach plans renew monthly and can be changed or cancelled at any time; downgrades take effect at the end of the current billing period."]],
    ["How to ask for a refund", [`Please ${contact} with the email on your account and the date of the payment. Approved refunds go back to the original payment method, usually within 5–10 business days.`]],
  ];
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  if (!(doc in TITLES)) notFound();
  const s = (await read()).settings;
  const company = s.companyName || "Sagely";
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-white/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Logo />
          <nav className="flex gap-4 text-sm text-muted">
            {(Object.keys(TITLES) as Doc[]).map((k) => (
              <Link key={k} href={`/legal/${k}`} className={k === doc ? "font-semibold text-ink" : "hover:text-ink"}>
                {TITLES[k].replace(" Policy", "").replace(" of Service", "")}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{TITLES[doc as Doc]}</h1>
        <p className="mt-2 text-sm text-muted">{company}</p>
        <div className="mt-10 space-y-9">
          {sections(doc as Doc, company, s.contactEmail).map(([h, ps]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold">{h}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-700">
                {ps.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
