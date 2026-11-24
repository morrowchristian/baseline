"use server";

import { prisma } from "@/lib/prisma";
import {
  addDays,
  formatDate,
  formatDayShort,
  startOfWeekMonday,
  toISODate,
} from "@/lib/dates";
import { computeJobTotals, formatUSD, formatUSD0 } from "@/lib/money";
import { getSessionUser } from "@/lib/authz";

// Plain, display-ready data for the journal explorer. Money is formatted
// server-side and Decimals are converted to numbers/strings here, so no
// Decimal ever crosses into a client component. A tab's list is `null`
// when the signed-in role may not see that model at all — the client only
// renders tabs for non-null lists, so a forbidden tab never exists.

export type JournalJob = {
  id: number;
  name: string;
  client: string;
  jobSiteAddress: string;
  status: string;
  budget: string | null;
  spent: string | null;
  remaining: string | null;
  pct: number;
  overBudget: boolean;
};

export type JournalCost = {
  id: number;
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: string;
  jobName: string;
};

export type JournalTimeLog = {
  id: number;
  date: string;
  crewName: string;
  crewRole: string;
  rate: string | null;
  task: string;
  hours: string;
  laborCost: string | null;
  jobName: string;
};

export type JournalCrew = {
  id: number;
  name: string;
  role: string;
  rate: string | null;
};

export type JournalAssignment = {
  id: number;
  date: string;
  dayLabel: string;
  crewName: string;
  crewRole: string;
  jobName: string;
};

export type JournalData = {
  /** Owner/PM only see money columns; Crew/Viewer get budget/spent null. */
  canSeeMoney: boolean;
  /** Only the Owner sees hourly rates in the Crew tab. */
  isOwner: boolean;
  jobs: JournalJob[];
  /** Owner/PM only. */
  costs: JournalCost[] | null;
  /** Owner/PM all logs; Crew own logs only; Viewer gets no tab. */
  timeLogs: JournalTimeLog[] | null;
  /** Owner/PM only. */
  crew: JournalCrew[] | null;
  /** This week's assignments; Crew sees only their own. */
  schedule: JournalAssignment[];
};

export async function getJournalData(): Promise<JournalData | { error: string }> {
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in." };

  const canSeeMoney = me.role === "OWNER" || me.role === "PROJECT_MANAGER";
  const isOwner = me.role === "OWNER";
  const isCrew = me.role === "CREW";

  // Crew only ever sees the jobs they are assigned to. An unlinked Crew
  // account (no crewMemberId) has no assignments, so it sees none.
  let assignedJobIds: number[] | null = null;
  if (isCrew) {
    assignedJobIds =
      me.crewMemberId !== null
        ? (
            await prisma.scheduleAssignment.findMany({
              where: { crewMemberId: me.crewMemberId },
              select: { jobId: true },
              distinct: ["jobId"],
            })
          ).map((a) => a.jobId)
        : [];
  }

  const jobs = await prisma.job.findMany({
    where: assignedJobIds !== null ? { id: { in: assignedJobIds } } : undefined,
    include: {
      costEntries: true,
      timeLogs: { include: { crewMember: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const journalJobs: JournalJob[] = jobs.map((job) => {
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
        ? Math.min(100, (totals.totalSpent / totals.budget) * 100)
        : 0;
    return {
      id: job.id,
      name: job.name,
      client: job.client,
      jobSiteAddress: job.jobSiteAddress,
      status: job.status,
      budget: canSeeMoney ? formatUSD0(totals.budget) : null,
      spent: canSeeMoney ? formatUSD(totals.totalSpent) : null,
      remaining: canSeeMoney ? formatUSD(totals.remaining) : null,
      pct,
      overBudget: totals.overBudget,
    };
  });

  // Costs are Owner / Project Manager only.
  const costEntries = canSeeMoney
    ? await prisma.costEntry.findMany({
        include: { job: true },
        orderBy: { date: "desc" },
      })
    : null;
  const journalCosts: JournalCost[] | null = costEntries
    ? costEntries.map((e) => ({
        id: e.id,
        date: formatDate(e.date),
        category: e.category,
        description: e.description,
        vendor: e.vendor ?? "—",
        amount: formatUSD(e.amount.toNumber()),
        jobName: e.job.name,
      }))
    : null;

  // Time logs: Owner/PM see all, Crew sees only their own, Viewer none.
  // An unlinked Crew account sees none.
  const timeLogRows =
    me.role === "VIEWER"
      ? null
      : await prisma.timeLog.findMany({
          where: isCrew ? { crewMemberId: me.crewMemberId ?? -1 } : undefined,
          include: { crewMember: true, job: true },
          orderBy: { date: "desc" },
        });
  const journalTimeLogs: JournalTimeLog[] | null = timeLogRows
    ? timeLogRows.map((t) => {
        const rate = t.crewMember.hourlyRate?.toNumber() ?? null;
        const cost = rate === null ? null : t.hours.toNumber() * rate;
        return {
          id: t.id,
          date: formatDate(t.date),
          crewName: t.crewMember.name,
          crewRole: t.crewMember.role,
          rate: canSeeMoney
            ? rate === null
              ? "No rate"
              : `${formatUSD(rate)}/hr`
            : null,
          task: t.task,
          hours: t.hours.toNumber().toFixed(2),
          laborCost: canSeeMoney ? (cost === null ? "—" : formatUSD(cost)) : null,
          jobName: t.job.name,
        };
      })
    : null;

  // Crew roster is Owner / Project Manager only. Rates are Owner only,
  // matching the schedule page.
  const crewRows = canSeeMoney
    ? await prisma.crewMember.findMany({ orderBy: { name: "asc" } })
    : null;
  const journalCrew: JournalCrew[] | null = crewRows
    ? crewRows.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        rate:
          isOwner && c.hourlyRate !== null
            ? `${formatUSD(c.hourlyRate.toNumber())}/hr`
            : isOwner
              ? "No rate set"
              : null,
      }))
    : null;

  // This week's schedule. Crew sees only their own assignments; an
  // unlinked Crew account sees none.
  const weekStart = startOfWeekMonday(new Date());
  const weekEnd = addDays(weekStart, 7);
  const assignments = await prisma.scheduleAssignment.findMany({
    where: {
      date: { gte: weekStart, lt: weekEnd },
      ...(isCrew ? { crewMemberId: me.crewMemberId ?? -1 } : {}),
    },
    include: { crewMember: true, job: true },
    orderBy: [{ date: "asc" }, { crewMember: { name: "asc" } }],
  });
  const journalSchedule: JournalAssignment[] = assignments.map((a) => ({
    id: a.id,
    date: toISODate(a.date),
    dayLabel: formatDayShort(a.date),
    crewName: a.crewMember.name,
    crewRole: a.crewMember.role,
    jobName: a.job.name,
  }));

  return {
    canSeeMoney,
    isOwner,
    jobs: journalJobs,
    costs: journalCosts,
    timeLogs: journalTimeLogs,
    crew: journalCrew,
    schedule: journalSchedule,
  };
}
