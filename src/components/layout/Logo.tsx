import { cn } from "@/utils/cn";

/** Horizon360 wordmark. The sun-arc glyph nods to an African horizon. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-secondary">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
          <circle cx="16" cy="17" r="6" fill="#C9A24B" />
          <path
            d="M4 22 Q16 12 28 22"
            stroke="#C65D3B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <line x1="4" y1="25.5" x2="28" y2="25.5" stroke="#F7F3EC" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[1.15rem] font-bold tracking-tight text-foreground">
          Horizon<span className="text-primary">360</span>
        </span>
      )}
    </span>
  );
}
