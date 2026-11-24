import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeJobTotals, formatUSD, formatUSD0 } from "@/lib/money";
import { JobForm } from "@/components/forms";
import { OverBudgetBadge, StatusBadge } from "@/components/ui";

export default async function JobsPage() {
  await connection();

  const jobs = await prisma.job.findMany({
    include: {
      costEntries: true,
      timeLogs: { include: { crewMember: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = jobs.map((job) => ({
    job,
    totals: computeJobTotals(
      job.budget.toNumber(),
      job.costEntries.map((e) => ({ amount: e.amount.toNumber(), category: e.category })),
      job.timeLogs.map((t) => ({
        hours: t.hours.toNumber(),
        hourlyRate: t.crewMember.hourlyRate?.toNumber() ?? null,
      })),
    ),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every job, its budget, and what it has actually cost so far.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {rows.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              No jobs yet — create the first one.
            </p>
          )}
          {rows.map(({ job, totals }) => {
            const pct = totals.budget > 0 ? Math.min(100, (totals.totalSpent / totals.budget) * 100) : 0;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-500"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{job.name}</h2>
                    <p className="text-sm text-slate-600">
                      {job.client} — {job.jobSiteAddress}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget</p>
                    <p className="font-semibold">{formatUSD0(totals.budget)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Spent</p>
                    <p className={`font-semibold ${totals.overBudget ? "text-red-700" : ""}`}>
                      {formatUSD(totals.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
                    <p className={`font-semibold ${totals.remaining < 0 ? "text-red-700" : ""}`}>
                      {formatUSD(totals.remaining)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${totals.overBudget ? "bg-red-500" : "bg-amber-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {totals.overBudget && (
                  <div className="mt-3"><OverBudgetBadge /></div>
                )}
              </Link>
            );
          })}
        </div>
        <div>
          <JobForm />
        </div>
      </div>
    </div>
  );
}
