import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  formatDate,
  formatDayShort,
  parseDateInput,
  startOfWeekMonday,
  toISODate,
} from "@/lib/dates";
import { formatUSD } from "@/lib/money";
import { AssignmentForm, CrewMemberForm } from "@/components/forms";
import { requireUser } from "@/lib/authz";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await connection();
  const me = await requireUser();
  const { week } = await searchParams;

  const canManage = me.role === "OWNER" || me.role === "PROJECT_MANAGER";
  const canSeeRates = me.role === "OWNER";
  const isCrew = me.role === "CREW";

  const requested = week ? parseDateInput(week) : null;
  const monday = startOfWeekMonday(requested ?? new Date());
  const weekEnd = addDays(monday, 7);
  const prevWeek = toISODate(addDays(monday, -7));
  const nextWeek = toISODate(addDays(monday, 7));
  const thisWeek = toISODate(startOfWeekMonday(new Date()));

  // Crew only ever sees their own assignments.
  const crewFilter =
    isCrew && me.crewMemberId !== null ? { crewMemberId: me.crewMemberId } : undefined;

  const [assignments, jobs] = await Promise.all([
    prisma.scheduleAssignment.findMany({
      where: { date: { gte: monday, lt: weekEnd }, ...(crewFilter ?? {}) },
      include: { crewMember: true, job: true },
      orderBy: [{ date: "asc" }, { crewMember: { name: "asc" } }],
    }),
    prisma.job.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Crew sees no crew roster at all; Viewer sees names/roles but no rates.
  const crew = isCrew
    ? []
    : await prisma.crewMember.findMany({ orderBy: { name: "asc" } });

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const byDay = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const key = toISODate(a.date);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isCrew ? "My schedule" : "Crew schedule"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Week of {formatDate(monday)} – {formatDate(addDays(monday, 6))}. One job per
            person per day.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/schedule?week=${prevWeek}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Previous week
          </Link>
          {toISODate(monday) !== thisWeek && (
            <Link
              href="/schedule"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              This week
            </Link>
          )}
          <Link
            href={`/schedule?week=${nextWeek}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Next week →
          </Link>
        </div>
      </div>

      {isCrew && me.crewMemberId === null && (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Your account isn&apos;t linked to a crew member yet, so there&apos;s no
          schedule to show. Ask the Owner to link your account to your crew
          record on the Users page.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => {
          const list = byDay.get(toISODate(day)) ?? [];
          const isToday = toISODate(day) === toISODate(new Date());
          return (
            <div
              key={toISODate(day)}
              className={`rounded-lg border bg-white p-3 shadow-sm ${
                isToday ? "border-amber-500 ring-1 ring-amber-500" : "border-slate-200"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {formatDayShort(day)}
                {isToday && <span className="ml-1 text-amber-600">• Today</span>}
              </p>
              {list.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No one scheduled</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {list.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-md bg-slate-100 px-2 py-1.5 text-xs"
                    >
                      <span className="block font-semibold text-slate-900">
                        {a.crewMember.name}
                      </span>
                      <span className="block text-slate-600">{a.crewMember.role}</span>
                      <Link
                        href={`/jobs/${a.job.id}`}
                        className="block font-medium text-amber-700 hover:underline"
                      >
                        {a.job.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AssignmentForm
            jobs={jobs.map((j) => ({ id: j.id, name: j.name }))}
            crew={crew.map((c) => ({ id: c.id, name: c.name, role: c.role }))}
          />
          <div className="space-y-6">
            {me.role === "OWNER" && <CrewMemberForm />}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Crew</h2>
              {crew.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No crew members yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-200 text-sm">
                  {crew.map((c) => (
                    <li key={c.id} className="flex items-baseline justify-between py-2">
                      <span>
                        <span className="font-medium text-slate-900">{c.name}</span>
                        <span className="text-slate-500"> — {c.role}</span>
                      </span>
                      <span className="text-slate-600">
                        {!canSeeRates
                          ? ""
                          : c.hourlyRate === null
                            ? "No rate set"
                            : `${formatUSD(c.hourlyRate.toNumber())}/hr`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {!canManage && !isCrew && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Crew</h2>
          {crew.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No crew members yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 text-sm">
              {crew.map((c) => (
                <li key={c.id} className="py-2">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  <span className="text-slate-500"> — {c.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
