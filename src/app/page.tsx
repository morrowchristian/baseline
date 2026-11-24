import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, formatDayShort, startOfWeekMonday, toISODate } from "@/lib/dates";
import { computeJobTotals, formatUSD, formatUSD0 } from "@/lib/money";
import { OverBudgetBadge, StatusBadge } from "@/components/ui";

export default async function DashboardPage() {
  await connection();

  const jobs = await prisma.job.findMany({
    include: {
      costEntries: true,
      timeLogs: { include: { crewMember: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const weekStart = startOfWeekMonday(new Date());
  const weekEnd = addDays(weekStart, 7);
  const assignments = await prisma.scheduleAssignment.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
    include: { crewMember: true, job: true },
    orderBy: [{ date: "asc" }, { crewMember: { name: "asc" } }],
  });

  const rows = jobs.map((job) => {
    const totals = computeJobTotals(
      job.budget.toNumber(),
      job.costEntries.map((e) => ({ amount: e.amount.toNumber(), category: e.category })),
      job.timeLogs.map((t) => ({
        hours: t.hours.toNumber(),
        hourlyRate: t.crewMember.hourlyRate?.toNumber() ?? null,
      })),
    );
    return { job, totals };
  });

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const totalBudget = rows.reduce((s, r) => s + r.totals.budget, 0);
  const totalSpent = rows.reduce((s, r) => s + r.totals.totalSpent, 0);
  const overUnder = totalBudget - totalSpent;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const key = toISODate(a.date);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Budgets vs. actual spend across all jobs, and who&apos;s on site this week.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active jobs" value={String(activeJobs)} />
        <Stat label="Total budget" value={formatUSD0(totalBudget)} />
        <Stat label="Total spent" value={formatUSD0(totalSpent)} />
        <Stat
          label={overUnder >= 0 ? "Under budget overall" : "Over budget overall"}
          value={formatUSD0(Math.abs(overUnder))}
          tone={overUnder >= 0 ? "good" : "bad"}
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Budget vs. actual by job</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Job</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Budget</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Spent</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Remaining</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-600 md:table-cell">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map(({ job, totals }) => {
                const pct = totals.budget > 0 ? Math.min(100, (totals.totalSpent / totals.budget) * 100) : 0;
                return (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-amber-700 hover:underline">
                        {job.name}
                      </Link>
                      <div className="text-xs text-slate-500">{job.client} — {job.jobSiteAddress}</div>
                      {totals.overBudget && (
                        <div className="mt-1"><OverBudgetBadge /></div>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3 text-right">{formatUSD(totals.budget)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${totals.overBudget ? "text-red-700" : ""}`}>
                      {formatUSD(totals.totalSpent)}
                    </td>
                    <td className={`px-4 py-3 text-right ${totals.remaining < 0 ? "font-medium text-red-700" : ""}`}>
                      {formatUSD(totals.remaining)}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${totals.overBudget ? "bg-red-500" : "bg-amber-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{pct.toFixed(0)}% of budget</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            This week&apos;s schedule
          </h2>
          <Link href="/schedule" className="text-sm font-medium text-amber-700 hover:underline">
            Full schedule →
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const list = byDay.get(toISODate(day)) ?? [];
            return (
              <div key={toISODate(day)} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {formatDayShort(day)}
                </p>
                {list.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">No one scheduled</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {list.map((a) => (
                      <li key={a.id} className="text-xs">
                        <span className="font-medium text-slate-900">{a.crewMember.name}</span>
                        <span className="block text-slate-500">{a.job.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          tone === "good" ? "text-green-700" : tone === "bad" ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
