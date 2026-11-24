import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  formatDate,
  formatDayShort,
  startOfWeekMonday,
  toISODate,
  todayISO,
} from "@/lib/dates";
import { computeJobTotals, formatUSD, formatUSD0 } from "@/lib/money";
import { getJournalData, type JournalData } from "@/lib/journal";
import { JournalTabs } from "@/components/journal-tabs";
import { OverBudgetBanner } from "@/components/over-budget-banner";
import {
  BudgetByJobCard,
  JobsAtAGlanceCard,
  KpiCard,
  budgetStatus,
  type JobOverviewRow,
} from "@/components/overview";
import { requireUser } from "@/lib/authz";

/**
 * The single page. Overview on top — alert banner, KPI cards, budget
 * donut + jobs-at-a-glance table — and the journal IS the dashboard
 * below it: the tabbed explorer (Jobs | Costs | Time Logs | Crew |
 * Schedule | Users) inline on the home page. There are no other pages —
 * job detail opens as a panel on this page, and the header holds the
 * Log Cost / Log Hours buttons.
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

  if (me.role === "CREW") return <CrewDashboard me={me} journal={journal} />;
  if (me.role === "VIEWER") return <ViewerDashboard me={me} journal={journal} />;

  // Owner and Project Manager get the full money overview.
  const jobs = await prisma.job.findMany({
    include: {
      costEntries: true,
      timeLogs: { include: { crewMember: true } },
    },
    orderBy: { createdAt: "asc" },
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
  const plannedJobs = jobs.filter((j) => j.status === "planned").length;
  const completeJobs = jobs.filter((j) => j.status === "complete").length;
  const totalBudget = rows.reduce((s, r) => s + r.totals.budget, 0);
  const totalSpent = rows.reduce((s, r) => s + r.totals.totalSpent, 0);
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetRows = rows.filter((r) => r.totals.overBudget);

  const overviewRows: JobOverviewRow[] = rows.map(({ job, totals }) => {
    const pct =
      totals.budget > 0
        ? Math.min(200, (totals.totalSpent / totals.budget) * 100)
        : 0;
    const lastActivity = latestActivity(job.costEntries, job.timeLogs);
    return {
      id: job.id,
      name: job.name,
      client: job.client,
      pct,
      spent: formatUSD(totals.totalSpent),
      budget: formatUSD0(totals.budget),
      status: budgetStatus(pct, totals.overBudget),
      updated: lastActivity ? formatDate(lastActivity) : "—",
    };
  });

  const bannerJobs = overBudgetRows
    .map(({ job, totals }) => ({
      id: job.id,
      name: job.name,
      overBy: formatUSD(Math.abs(totals.remaining)),
      overAmount: Math.abs(totals.remaining),
    }))
    .sort((a, b) => b.overAmount - a.overAmount)
    .map(({ id, name, overBy }) => ({ id, name, overBy }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          Budgets vs. actual spend across all jobs, and who&apos;s on site this
          week.
        </p>
      </div>

      <OverBudgetBanner jobs={bannerJobs} />

      <div className="grid gap-4 lg:grid-cols-3">
        <KpiCard
          label="Active jobs"
          value={String(activeJobs)}
          sub={`${jobs.length} jobs total · ${plannedJobs} planned · ${completeJobs} complete`}
        />
        <KpiCard
          label="Spent vs budget"
          value={formatUSD0(totalSpent)}
          sub={`of ${formatUSD0(totalBudget)} budget`}
          barPct={overallPct}
        />
        <KpiCard
          label="Jobs over budget"
          value={String(overBudgetRows.length)}
          sub={
            overBudgetRows.length === 0
              ? "Every job is within budget."
              : overBudgetRows
                  .map((r) => `${r.job.name} — ${formatUSD(Math.abs(r.totals.remaining))} over`)
                  .join("; ")
          }
          tone={overBudgetRows.length > 0 ? "bad" : undefined}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">
          <BudgetByJobCard
            overallPct={overallPct}
            jobs={overviewRows}
            overBudgetCount={overBudgetRows.length}
          />
        </div>
        <div className="min-w-0 lg:col-span-3">
          <JobsAtAGlanceCard jobs={overviewRows} showMoney />
        </div>
      </div>

      <JournalTabs data={journal} meId={Number(me.id)} />
    </div>
  );
}

/** Latest activity on a job: the newest cost entry or time log date. */
function latestActivity(
  costs: { date: Date }[],
  logs: { date: Date }[],
): Date | null {
  let latest: Date | null = null;
  for (const d of [...costs, ...logs]) {
    if (latest === null || d.date > latest) latest = d.date;
  }
  return latest;
}

/**
 * Crew personal dashboard — only their own week, their own hours, and the
 * jobs they are assigned to. No budgets, no costs, no other crew members'
 * pay rates, no money anywhere.
 */
async function CrewDashboard({
  me,
  journal,
}: {
  me: { id: string; name: string | null | undefined; crewMemberId: number | null };
  journal: JournalData;
}) {
  const weekStart = startOfWeekMonday(new Date());
  const weekEnd = addDays(weekStart, 7);
  const todayKey = todayISO();

  if (me.crewMemberId === null) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h1 className="text-lg font-bold text-slate-900">My dashboard</h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Your week, your hours, your jobs.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Assignments this week" value="0" sub="No assignments" />
          <KpiCard label="Hours this week" value="0.0" sub="No hours logged" />
          <KpiCard label="Today" value="Off" sub={formatDayShort(new Date())} />
          <KpiCard label="My jobs" value="0" sub="No assigned jobs" />
        </div>
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Your account isn&apos;t linked to a crew member yet, so there&apos;s
          no schedule or hours to show. Ask the Owner to link your account to
          your crew record on the Users tab.
        </p>
        <JournalTabs data={journal} meId={Number(me.id)} />
      </div>
    );
  }

  const crewMemberId = me.crewMemberId;
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
  const todayAssignments = myAssignments.filter(
    (a) => toISODate(a.date) === todayKey,
  );
  const distinctWeekJobs = new Set(myLogs.map((t) => t.jobId)).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 className="text-lg font-bold text-slate-900">My dashboard</h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          {member ? `${member.name} — ${member.role}` : ""} · Your week, your
          hours, your jobs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Assignments this week"
          value={String(myAssignments.length)}
          sub={
            todayAssignments.length > 0
              ? `${todayAssignments.length} today`
              : "Nothing today"
          }
        />
        <KpiCard
          label="Hours this week"
          value={weekHours.toFixed(1)}
          sub={
            distinctWeekJobs === 0
              ? "No hours logged"
              : `across ${distinctWeekJobs} job${distinctWeekJobs === 1 ? "" : "s"}`
          }
        />
        <KpiCard
          label="Today"
          value={
            todayAssignments.length > 0
              ? `${todayAssignments.length} assignment${todayAssignments.length === 1 ? "" : "s"}`
              : "Off"
          }
          sub={formatDayShort(new Date())}
        />
        <KpiCard
          label="My jobs"
          value={String(myJobs.length)}
          sub="assigned to you"
        />
      </div>

      <JournalTabs data={journal} meId={Number(me.id)} />
    </div>
  );
}

/**
 * Viewer dashboard — job status and progress only, plus who is on site
 * this week. No budgets, no costs, no rates, no editing, no money figures.
 * Progress % is computed server-side from totals but only the % is shown.
 */
async function ViewerDashboard({
  me,
  journal,
}: {
  me: { id: string };
  journal: JournalData;
}) {
  const weekStart = startOfWeekMonday(new Date());
  const weekEnd = addDays(weekStart, 7);

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

  const overviewRows: JobOverviewRow[] = jobs.map((job) => {
    const totals = computeJobTotals(
      job.budget.toNumber(),
      job.costEntries.map((e) => ({ amount: e.amount.toNumber(), category: e.category })),
      job.timeLogs.map((t) => ({
        hours: t.hours.toNumber(),
        hourlyRate: t.crewMember.hourlyRate?.toNumber() ?? null,
      })),
    );
    const pct =
      totals.budget > 0
        ? Math.min(200, (totals.totalSpent / totals.budget) * 100)
        : 0;
    const lastActivity = latestActivity(job.costEntries, job.timeLogs);
    return {
      id: job.id,
      name: job.name,
      client: job.client,
      pct,
      spent: null,
      budget: null,
      status: budgetStatus(pct, totals.overBudget),
      updated: lastActivity ? formatDate(lastActivity) : "—",
    };
  });

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const overBudgetCount = overviewRows.filter(
    (r) => r.status === "Over Budget",
  ).length;
  const overBudgetNames = overviewRows
    .filter((r) => r.status === "Over Budget")
    .map((r) => r.name);

  // The Users tab never renders for Viewers, but JournalTabs still
  // takes the signed-in id for the Owner's own-row check.
  const meId = Number(me.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          Job status and progress, and who&apos;s on site this week.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active jobs"
          value={String(activeJobs)}
          sub={`${jobs.length} jobs total`}
        />
        <KpiCard
          label="Total jobs"
          value={String(jobs.length)}
          sub={`${activeJobs} active right now`}
        />
        <KpiCard
          label="Assignments this week"
          value={String(assignments.length)}
          sub="across the crew"
        />
        <KpiCard
          label="Over budget"
          value={String(overBudgetCount)}
          sub={
            overBudgetCount === 0
              ? "Every job is within budget."
              : overBudgetNames.join("; ")
          }
          tone={overBudgetCount > 0 ? "bad" : undefined}
        />
      </div>

      <JobsAtAGlanceCard jobs={overviewRows} showMoney={false} />

      <JournalTabs data={journal} meId={meId} />
    </div>
  );
}
