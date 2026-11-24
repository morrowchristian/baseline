/**
 * Overview sections for the single-page dashboard — the visual language
 * from the hospital-operations reference: white cards with soft borders
 * and rounded corners, a teal accent, KPI cards with big numbers, a
 * donut with per-job dot-matrix bars, status pills, and a summary table.
 * All data is passed in as props; these components are purely
 * presentational. Money columns only ever appear when the caller says
 * showMoney (Owner / Project Manager).
 */

export type BudgetStatus = "Over Budget" | "At Risk" | "On Track";

export function budgetStatus(pct: number, overBudget: boolean): BudgetStatus {
  if (overBudget) return "Over Budget";
  if (pct >= 80) return "At Risk";
  return "On Track";
}

export function BudgetStatusPill({ status }: { status: BudgetStatus }) {
  const cls =
    status === "Over Budget"
      ? "bg-red-100 text-red-800"
      : status === "At Risk"
        ? "bg-amber-100 text-amber-800"
        : "bg-teal-100 text-teal-800";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

/** 20-dot progress bar — filled dots in proportion to pct, coloured by status. */
export function DotBar({
  pct,
  status,
}: {
  pct: number;
  status: BudgetStatus;
}) {
  const total = 20;
  const filled = Math.min(total, Math.max(0, Math.round((pct / 100) * total)));
  const color =
    status === "Over Budget"
      ? "bg-red-500"
      : status === "At Risk"
        ? "bg-amber-500"
        : "bg-teal-500";
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={`${pct.toFixed(0)}% of budget spent`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < filled ? color : "bg-slate-200"}`}
        />
      ))}
    </span>
  );
}

/** SVG donut: overall % of budget spent, with the % in the middle. */
export function BudgetDonut({ pct }: { pct: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const filled = (clamped / 100) * c;
  return (
    <svg
      viewBox="0 0 128 128"
      className="h-32 w-32 shrink-0"
      role="img"
      aria-label={`${pct.toFixed(0)}% of budget spent`}
    >
      <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="#0d9488"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="62" textAnchor="middle" fill="#0f172a" fontSize="24" fontWeight="700">
        {pct.toFixed(0)}%
      </text>
      <text x="64" y="80" textAnchor="middle" fill="#64748b" fontSize="11">
        of budget spent
      </text>
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  barPct,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  /** Optional mini progress bar (0–100). */
  barPct?: number;
  /** Red value for a bad number (e.g. jobs over budget). */
  tone?: "bad";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl font-bold leading-tight ${
          tone === "bad" ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
      {barPct !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}

export type JobOverviewRow = {
  id: number;
  name: string;
  client: string;
  pct: number;
  /** Formatted dollars, or null when the viewer may not see money. */
  spent: string | null;
  /** Formatted dollars, or null when the viewer may not see money. */
  budget: string | null;
  status: BudgetStatus;
  /** Latest activity on the job, formatted, or "—". */
  updated: string;
};

/** Donut + per-job dot-matrix bars, like the reference's Capacity card. */
export function BudgetByJobCard({
  overallPct,
  jobs,
  overBudgetCount,
}: {
  overallPct: number;
  jobs: JobOverviewRow[];
  overBudgetCount: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Budget by Job</h2>
        {overBudgetCount > 0 ? (
          <BudgetStatusPill status="Over Budget" />
        ) : (
          <BudgetStatusPill status="On Track" />
        )}
      </div>
      <div className="mt-4 flex items-center gap-5">
        <BudgetDonut pct={overallPct} />
        <div>
          <p className="text-sm font-medium text-slate-900">
            {overallPct.toFixed(0)}% of the total budget is spent
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {overBudgetCount === 0
              ? "Every job is within budget."
              : `${overBudgetCount} job${overBudgetCount === 1 ? "" : "s"} over budget.`}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        {jobs.map((j) => (
          <li
            key={j.id}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
          >
            {/* Mobile: name + pill on one line, dots + % below. sm+:
                wrappers dissolve (display:contents) so it is a single
                row: name | dots | % | pill. A single row cannot fit
                390px (20 dots alone are ~177px), so the two-line
                mobile layout is what keeps the page from overflowing. */}
            <div className="flex items-center justify-between gap-3 sm:contents">
              <span className="min-w-0 truncate text-sm font-medium text-slate-900 sm:w-40 sm:shrink-0">
                {j.name}
              </span>
              <span className="shrink-0 sm:order-4 sm:ml-auto">
                <BudgetStatusPill status={j.status} />
              </span>
            </div>
            <div className="flex items-center gap-2 sm:contents">
              <DotBar pct={j.pct} status={j.status} />
              <span className="w-10 shrink-0 text-right text-xs text-slate-500 sm:order-3">
                {j.pct.toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Summary table, like the reference's Active Queues card. */
export function JobsAtAGlanceCard({
  jobs,
  showMoney,
}: {
  jobs: JobOverviewRow[];
  showMoney: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-900">Jobs at a Glance</h2>
      </div>
      {jobs.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-slate-500">No jobs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Job</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Progress</th>
                {showMoney && (
                  <>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Spent</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Budget</th>
                  </>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <span className="font-medium text-slate-900">{j.name}</span>
                    <span className="block text-xs text-slate-500">{j.client}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                        <span
                          className={`block h-full rounded-full ${
                            j.status === "Over Budget" ? "bg-red-500" : "bg-teal-500"
                          }`}
                          style={{ width: `${Math.min(100, j.pct)}%` }}
                        />
                      </span>
                      <span className="w-8 text-xs text-slate-500">{j.pct.toFixed(0)}%</span>
                    </span>
                  </td>
                  {showMoney && (
                    <>
                      <td className={`px-4 py-2 text-right ${j.status === "Over Budget" ? "font-medium text-red-700" : ""}`}>
                        {j.spent}
                      </td>
                      <td className="px-4 py-2 text-right">{j.budget}</td>
                    </>
                  )}
                  <td className="px-4 py-2">
                    <BudgetStatusPill status={j.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">{j.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
