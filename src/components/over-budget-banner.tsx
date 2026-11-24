"use client";

/**
 * Yellow alert banner for jobs over budget. "View details" opens that
 * job's detail panel on the dashboard — it dispatches a
 * `baseline:open-job` event that the journal listens for, so the panel
 * opens without leaving the page.
 */
export function OverBudgetBanner({
  jobs,
}: {
  /** Over-budget jobs, worst first: { id, name, overBy } with overBy formatted. */
  jobs: { id: number; name: string; overBy: string }[];
}) {
  if (jobs.length === 0) return null;
  const worst = jobs[0];
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm"
    >
      <span className="text-lg leading-none" aria-hidden="true">
        ⚠
      </span>
      <p className="flex-1 text-sm text-amber-900">
        <span className="font-semibold">{worst.name}</span> is over budget by{" "}
        <span className="font-semibold">{worst.overBy}</span>
        {jobs.length > 1 && (
          <>
            {" "}
            — {jobs.length - 1} other job{jobs.length - 1 === 1 ? "" : "s"} over
            budget too.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("baseline:open-job", {
              detail: { jobId: worst.id },
            }),
          );
        }}
        className="text-sm font-semibold text-amber-800 underline hover:text-amber-900"
      >
        View details
      </button>
    </div>
  );
}
