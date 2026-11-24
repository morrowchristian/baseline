const STATUS_STYLES: Record<string, string> = {
  planned: "bg-slate-100 text-slate-700 ring-slate-300",
  active: "bg-green-100 text-green-800 ring-green-300",
  complete: "bg-sky-100 text-sky-800 ring-sky-300",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.planned;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

export function OverBudgetBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-300">
      Over budget
    </span>
  );
}
