import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  formatDayShort,
  startOfWeekMonday,
  toISODate,
  todayISO,
} from "@/lib/dates";
import { computeJobTotals, formatUSD, formatUSD0 } from "@/lib/money";
import { OverBudgetBadge, StatusBadge } from "@/components/ui";
import { CollapsibleSection } from "@/components/collapsible";

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
  const overBudgetCount = rows.filter((r) => r.totals.overBudget).length;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const key = toISODate(a.date);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }
  const todayKey = todayISO();
  const todayCount = (byDay.get(todayKey) ?? []).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          Budgets vs. actual spend across all jobs, and who&apos;s on site this
          week.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-sm lg:grid-cols-4">
        <Stat label="Active jobs" value={String(activeJobs)} />
        <Stat label="Total budget" value={formatUSD0(totalBudget)} />
        <Stat label="Total spent" value={formatUSD0(totalSpent)} />
        <Stat
          label={overUnder >= 0 ? "Under budget overall" : "Over budget overall"}
          value={formatUSD0(Math.abs(overUnder))}
          tone={overUnder >= 0 ? "good" : "bad"}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <CollapsibleSection
          title="Budget vs. actual by job"
          meta={`${rows.length} jobs${overBudgetCount ? ` · ${overBudgetCount} over budget` : ""}`}
          defaultOpen
          className="lg:col-span-3"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Job</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Budget</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Spent</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Remaining</th>
                  <th className="hidden px-3 py-2 text-left text-xs font-medium text-slate-500 md:table-cell">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map(({ job, totals }) => {
                  const pct =
                    totals.budget > 0
                      ? Math.min(100, (totals.totalSpent / totals.budget) * 100)
                      : 0;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <span className="flex flex-wrap items-center gap-x-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium text-amber-700 hover:underline"
                          >
                            {job.name}
                          </Link>
                          {totals.overBudget && <OverBudgetBadge />}
                        </span>
                        <div className="mt-0.5 max-w-56 truncate text-xs text-slate-500">
                          {job.client} — {job.jobSiteAddress}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-3 py-2 text-right">{formatUSD(totals.budget)}</td>
                      <td
                        className={`px-3 py-2 text-right font-medium ${
                          totals.overBudget ? "text-red-700" : ""
                        }`}
                      >
                        {formatUSD(totals.totalSpent)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right ${
                          totals.remaining < 0 ? "font-medium text-red-700" : ""
                        }`}
                      >
                        {formatUSD(totals.remaining)}
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                totals.overBudget ? "bg-red-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs text-slate-500">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="This week's schedule"
          meta={`${assignments.length} assignments${todayCount ? ` · ${todayCount} today` : ""}`}
          action={
            <Link
              href="/schedule"
              className="text-xs font-medium text-amber-700 hover:underline"
            >
              Full schedule →
            </Link>
          }
          defaultOpen
          className="lg:col-span-2"
        >
          <ul className="px-3 py-1.5">
            {days.map((day) => {
              const key = toISODate(day);
              const list = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              return (
                <li
                  key={key}
                  className={`flex gap-3 border-b border-slate-100 py-1.5 last:border-b-0 ${
                    isToday ? "-mx-3 bg-amber-50 px-3" : ""
                  }`}
                >
                  <span
                    className={`w-20 shrink-0 pt-px text-xs font-semibold ${
                      isToday ? "text-amber-800" : "text-slate-700"
                    }`}
                  >
                    {formatDayShort(day)}
                  </span>
                  <div className="min-w-0 flex-1">
                    {list.length === 0 ? (
                      <p className="text-xs italic leading-5 text-slate-400">
                        No one scheduled
                      </p>
                    ) : (
                      <ul>
                        {list.map((a) => (
                          <li
                            key={a.id}
                            className="truncate text-xs leading-5 text-slate-600"
                          >
                            <span className="font-medium text-slate-900">
                              {a.crewMember.name}
                            </span>
                            <span className="text-slate-400"> — </span>
                            {a.job.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="bg-white px-4 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-bold leading-tight ${
          tone === "good"
            ? "text-green-700"
            : tone === "bad"
              ? "text-red-700"
              : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
