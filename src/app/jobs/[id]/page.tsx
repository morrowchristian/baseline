import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { computeJobTotals, formatUSD, formatUSD0 } from "@/lib/money";
import { CostEntryForm, TimeLogForm } from "@/components/forms";
import { OverBudgetBadge, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/authz";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const me = await requireUser();
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId)) notFound();

  const canSeeMoney = me.role === "OWNER" || me.role === "PROJECT_MANAGER";

  // Crew can only open jobs they are assigned to.
  if (me.role === "CREW") {
    if (me.crewMemberId === null) redirect("/jobs");
    const assigned = await prisma.scheduleAssignment.findFirst({
      where: { crewMemberId: me.crewMemberId, jobId },
    });
    if (!assigned) redirect("/jobs");
  }

  const [job, crew] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      include: {
        costEntries: { orderBy: { date: "desc" } },
        timeLogs: {
          include: { crewMember: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    prisma.crewMember.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!job) notFound();

  const totals = computeJobTotals(
    job.budget.toNumber(),
    job.costEntries.map((e) => ({ amount: e.amount.toNumber(), category: e.category })),
    job.timeLogs.map((t) => ({
      hours: t.hours.toNumber(),
      hourlyRate: t.crewMember.hourlyRate?.toNumber() ?? null,
    })),
  );
  const totalHours = job.timeLogs.reduce((s, t) => s + t.hours.toNumber(), 0);
  const pct = totals.budget > 0 ? Math.min(100, (totals.totalSpent / totals.budget) * 100) : 0;

  // Crew sees only their own time logs on this job.
  const myLogs =
    me.role === "CREW"
      ? job.timeLogs.filter((t) => t.crewMemberId === me.crewMemberId)
      : job.timeLogs;
  const myHours = myLogs.reduce((s, t) => s + t.hours.toNumber(), 0);
  const myCrewMember =
    me.role === "CREW"
      ? crew.find((c) => c.id === me.crewMemberId) ?? null
      : null;
  const myJobs = [{ id: job.id, name: job.name }];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/jobs" className="text-sm font-medium text-amber-700 hover:underline">
          ← All jobs
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{job.name}</h1>
          <StatusBadge status={job.status} />
          {(canSeeMoney || me.role === "VIEWER") && totals.overBudget && <OverBudgetBadge />}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {job.client} — {job.jobSiteAddress}
        </p>
      </div>

      {canSeeMoney ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Budget" value={formatUSD0(totals.budget)} />
            <Stat label="Direct costs" value={formatUSD(totals.directCosts)} />
            <Stat
              label="Labor cost (from time logs)"
              value={formatUSD(totals.laborCost)}
              hint={`${totalHours.toFixed(1)} hrs logged`}
            />
            <Stat
              label="Total spent"
              value={formatUSD(totals.totalSpent)}
              tone={totals.overBudget ? "bad" : undefined}
              hint={`${pct.toFixed(0)}% of budget`}
            />
          </div>

          <div
            className={`rounded-lg border p-5 shadow-sm ${
              totals.overBudget ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                {totals.overBudget ? "Over budget by" : "Remaining budget"}
              </p>
              <p className={`text-xl font-bold ${totals.overBudget ? "text-red-700" : "text-green-700"}`}>
                {formatUSD(Math.abs(totals.remaining))}
              </p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${totals.overBudget ? "bg-red-500" : "bg-amber-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Progress</p>
            <p className="text-xl font-bold text-slate-900">{pct.toFixed(0)}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${totals.overBudget ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {me.role === "CREW" && (
            <p className="mt-3 text-sm text-slate-600">
              Your hours on this job: <span className="font-semibold text-slate-900">{myHours.toFixed(1)} hrs</span>
            </p>
          )}
        </div>
      )}

      {canSeeMoney && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cost breakdown by category</h2>
          {totals.byCategory.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              No costs logged yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Share of direct costs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {totals.byCategory.map((row) => (
                    <tr key={row.category}>
                      <td className="px-4 py-3 font-medium">{row.category}</td>
                      <td className="px-4 py-3 text-right">{formatUSD(row.amount)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {totals.directCosts > 0
                          ? `${((row.amount / totals.directCosts) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3">Total direct costs</td>
                    <td className="px-4 py-3 text-right">{formatUSD(totals.directCosts)}</td>
                    <td className="px-4 py-3" />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {canSeeMoney ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <CostEntryForm jobId={job.id} />
          <TimeLogForm
            jobs={[{ id: job.id, name: job.name }]}
            crew={crew.map((c) => ({ id: c.id, name: c.name, role: c.role }))}
          />
        </div>
      ) : me.role === "CREW" && myCrewMember ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <TimeLogForm
            jobs={myJobs}
            crew={[]}
            fixedCrewMember={{ id: myCrewMember.id, name: myCrewMember.name }}
          />
        </div>
      ) : null}

      {canSeeMoney && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cost entries</h2>
          {job.costEntries.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              No costs logged for this job yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Vendor</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {job.costEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">{e.category}</td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 text-slate-600">{e.vendor ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatUSD(e.amount.toNumber())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {(canSeeMoney || me.role === "CREW") && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            {me.role === "CREW" ? "My time logs" : "Time logs"}
          </h2>
          {myLogs.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              No hours logged for this job yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Crew member</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Task</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Hours</th>
                    {canSeeMoney && (
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Labor cost</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myLogs.map((t) => {
                    const rate = t.crewMember.hourlyRate?.toNumber() ?? null;
                    const cost = rate === null ? null : t.hours.toNumber() * rate;
                    return (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(t.date)}</td>
                        <td className="px-4 py-3">
                          {t.crewMember.name}
                          <span className="block text-xs text-slate-500">
                            {t.crewMember.role}
                            {canSeeMoney &&
                              (rate === null ? " — no rate set" : ` — ${formatUSD(rate)}/hr`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{t.task}</td>
                        <td className="px-4 py-3 text-right">{t.hours.toNumber().toFixed(2)}</td>
                        {canSeeMoney && (
                          <td className="px-4 py-3 text-right">
                            {cost === null ? "—" : formatUSD(cost)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "bad";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "bad" ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
