"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reusable modal shell: fixed overlay, centered panel, Escape to close,
 * click-outside (backdrop) to close, focus moved into the panel on open,
 * and body scroll locked while open.
 */
export function Modal({
  open,
  onClose,
  title,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`my-4 w-full rounded-lg bg-white shadow-xl outline-none sm:my-8 ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          {title ? (
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
