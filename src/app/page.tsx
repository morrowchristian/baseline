import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  startOfWeekMonday,
  toISODate,
  todayISO,
} from "@/lib/dates";
import { computeJobTotals, formatUSD0 } from "@/lib/money";
import { getJournalData } from "@/lib/journal";
import { JournalTabs } from "@/components/journal-tabs";
import { requireUser } from "@/lib/authz";

/**
 * The single page. The journal IS the dashboard: the stat strip is the
 * overview on top, and the tabbed journal (Jobs | Costs | Time Logs |
 * Crew | Schedule | Users) is the content below it. There are no other
 * pages — job detail opens as a panel on this page, and the header holds
 * the Log Cost / Log Hours buttons.
 */
export default async function DashboardPage() {
  await connection();
  const me = await requireUser();

  const journal = await getJournalData();
  if ("error" in journal) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {journal.error}
        </p>
      </div>
    );
  }

  const weekStart = startOfWeekMonday(new Date());
  const weekEnd = addDays(weekStart, 7);
  const todayKey = todayISO();

  // Stat strip, per role — the same figures the old dashboards showed.
  let stats: { label: string; value: string; tone?: "good" | "bad" }[];
  let subtitle: string;
  let unlinkedCrew = false;

  if (me.role === "CREW") {
    const crewMemberId = me.crewMemberId;
    if (crewMemberId === null) {
      unlinkedCrew = true;
      stats = [
        { label: "Assignments this week", value: "0" },
        { label: "Hours this week", value: "0.0" },
        { label: "Today", value: "Off" },
        { label: "My jobs", value: "0" },
      ];
      subtitle = "Your week, your hours, your jobs.";
    } else {
      const [member, myAssignments, myLogs, myJobs] = await Promise.all([
        prisma.crewMember.findUnique({ where: { id: crewMemberId } }),
        prisma.scheduleAssignment.findMany({
          where: { crewMemberId, date: { gte: weekStart, lt: weekEnd } },
          include: { job: true },
          orderBy: { date: "asc" },
        }),
        prisma.timeLog.findMany({
          where: { crewMemberId, date: { gte: weekStart, lt: weekEnd } },
          include: { job: true },
          orderBy: { date: "desc" },
        }),
        prisma.job.findMany({
          where: { assignments: { some: { crewMemberId } } },
          orderBy: { name: "asc" },
        }),
      ]);
      const weekHours = myLogs.reduce((s, t) => s + t.hours.toNumber(), 0);
      const todayCount = myAssignments.filter(
        (a) => toISODate(a.date) === todayKey,
      ).length;
      stats = [
        { label: "Assignments this week", value: String(myAssignments.length) },
        { label: "Hours this week", value: weekHours.toFixed(1) },
        {
          label: "Today",
          value:
            todayCount > 0
              ? `${todayCount} assignment${todayCount === 1 ? "" : "s"}`
              : "Off",
        },
        { label: "My jobs", value: String(myJobs.length) },
      ];
      subtitle = `${member ? `${member.name} — ${member.role}` : ""} · Your week, your hours, your jobs.`;
    }
  } else if (me.role === "VIEWER") {
    const jobs = await prisma.job.findMany({
      include: {
        costEntries: true,
        timeLogs: { include: { crewMember: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const assignments = await prisma.scheduleAssignment.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
      include: { crewMember: true, job: true },
      orderBy: [{ date: "asc" }, { crewMember: { name: "asc" } }],
    });
    const overBudgetCount = jobs.filter((job) => {
      const totals = computeJobTotals(
        job.budget.toNumber(),
        job.costEntries.map((e) => ({ amount: e.amount.toNumber(), category: e.category })),
        job.timeLogs.map((t) => ({
          hours: t.hours.toNumber(),
          hourlyRate: t.crewMember.hourlyRate?.toNumber() ?? null,
        })),
      );
      return totals.overBudget;
    }).length;
    stats = [
      {
        label: "Active jobs",
        value: String(jobs.filter((j) => j.status === "active").length),
      },
      { label: "Total jobs", value: String(jobs.length) },
      { label: "Assignments this week", value: String(assignments.length) },
      { label: "Over budget", value: String(overBudgetCount) },
    ];
    subtitle = "Job status and progress, and who's on site this week.";
  } else {
    // Owner and Project Manager get the full money overview.
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
    const activeJobs = jobs.filter((j) => j.status === "active").length;
    const totalBudget = rows.reduce((s, r) => s + r.totals.budget, 0);
    const totalSpent = rows.reduce((s, r) => s + r.totals.totalSpent, 0);
    const overUnder = totalBudget - totalSpent;
    stats = [
      { label: "Active jobs", value: String(activeJobs) },
      { label: "Total budget", value: formatUSD0(totalBudget) },
      { label: "Total spent", value: formatUSD0(totalSpent) },
      {
        label: overUnder >= 0 ? "Under budget overall" : "Over budget overall",
        value: formatUSD0(Math.abs(overUnder)),
        tone: overUnder >= 0 ? "good" : "bad",
      },
    ];
    subtitle =
      "Budgets vs. actual spend across all jobs, and who's on site this week.";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 className="text-lg font-bold text-slate-900">
          {me.role === "CREW" ? "My dashboard" : "Dashboard"}
        </h1>
        <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-sm lg:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      {unlinkedCrew && (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Your account isn&apos;t linked to a crew member yet, so there&apos;s
          no schedule or hours to show. Ask the Owner to link your account to
          your crew record on the Users tab.
        </p>
      )}

      <JournalTabs data={journal} meId={Number(me.id)} />
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
