"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A collapsible card section. The header row (chevron + title + meta) is the
 * toggle; `action` (e.g. a link) sits outside the toggle button so it stays
 * clickable. Children are server-rendered and passed in as React nodes.
 */
export function CollapsibleSection({
  title,
  meta,
  action,
  defaultOpen = true,
  className = "",
  children,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section
      className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            aria-hidden
            className={`shrink-0 text-base leading-none text-slate-400 transition-transform duration-150 ${
              open ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
          <span className="truncate text-sm font-semibold text-slate-900">
            {title}
          </span>
          {meta ? (
            <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">
              {meta}
            </span>
          ) : null}
        </button>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {open ? (
        <div id={bodyId} className="border-t border-slate-100">
          {children}
        </div>
      ) : null}
    </section>
  );
}
