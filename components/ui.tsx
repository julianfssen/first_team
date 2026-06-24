"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  full?: boolean;
};

export function Button({ variant = "primary", full, className, children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const variants: Record<string, string> = {
    primary: "bg-[var(--accent)] text-[#06281b] hover:brightness-105 shadow-lg shadow-emerald-500/10",
    ghost: "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]",
    subtle: "bg-[var(--surface-2)] text-[var(--text)] hover:brightness-110",
    danger: "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/25",
  };
  return (
    <button className={cx(base, variants[variant], full && "w-full", className)} {...rest}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
        onClick && "cursor-pointer transition hover:border-[var(--accent)]/50 active:scale-[0.99]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        className,
      )}
      style={color ? { color, backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` } : undefined}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
      {children}
    </h2>
  );
}

/** Sticky bottom action bar inside the phone frame. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto border-t border-[var(--border)] bg-[var(--bg)]/90 p-4 backdrop-blur">
      {children}
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-4 pt-5 pb-3">
      <div>
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
