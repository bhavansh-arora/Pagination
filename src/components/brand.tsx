import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="sagely-gold" x1="6" y1="6" x2="26" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0d9ad" />
          <stop offset="1" stopColor="#c0965a" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#13100d" />
      <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="#d6b57f" strokeOpacity=".28" />
      <path
        d="M9 9.5h14a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-4 3.5v-3.5H9a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z"
        fill="none"
        stroke="url(#sagely-gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 11.6c.4 3 1.4 4 4.4 4.4-3 .4-4 1.4-4.4 4.4-.4-3-1.4-4-4.4-4.4 3-.4 4-1.4 4.4-4.4Z" fill="url(#sagely-gold)" />
    </svg>
  );
}

export function Logo({ className, href = "/", tone = "light" }: { className?: string; href?: string; tone?: "light" | "dark" }) {
  return (
    <Link
      href={href}
      aria-label="Sagely home"
      className={cn("inline-flex items-center gap-2.5 font-display font-semibold tracking-[-0.03em]", tone === "dark" ? "text-cream" : "text-ink", className)}
    >
      <LogoMark />
      <span className="text-[19px] leading-none">
        Sagely
        <span className={cn("ml-1.5 font-serif text-[16px] font-normal tracking-normal italic", tone === "dark" ? "text-cream/45" : "text-muted")}>ai minds</span>
      </span>
    </Link>
  );
}

export function BotAvatar({
  emoji,
  image,
  color,
  size = 40,
  className,
}: {
  emoji: string;
  image?: string | null;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-black/5", className)}
      style={{
        width: size,
        height: size,
        background: image ? undefined : `linear-gradient(140deg, color-mix(in srgb, ${color} 22%, white), color-mix(in srgb, ${color} 45%, white))`,
        fontSize: size * 0.5,
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        <span className="leading-none">{emoji}</span>
      )}
    </span>
  );
}
