import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight text-ink", className)}>
      <span className="relative grid size-8 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_6px_16px_-6px_rgb(168_85_247/0.8)]">
        <svg viewBox="0 0 24 24" className="size-[18px] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 4c-3.5 0-6 2.4-6 5.4 0 1.7.8 3 2 4v3.1c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5v-3.1c1.2-1 2-2.3 2-4C18 6.4 15.5 4 12 4Z" />
          <path d="M10 21h4M12 8v4M10 10h4" />
        </svg>
      </span>
      <span className="text-[17px]">Mindclone</span>
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
