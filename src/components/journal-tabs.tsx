"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getJobDetail,
  type JobDetail,
  type JournalData,
} from "@/lib/journal";
import { Modal } from "@/components/modal";
import { OverBudgetBadge, StatusBadge } from "@/components/ui";
import { LogCostButton, LogHoursButton } from "@/components/log-buttons";
import {
  AssignmentForm,
  CrewMemberForm,
  JobForm,
} from "@/components/forms";
import { UserRowForm } from "@/components/user-forms";
import type { UserRole } from "@prisma/client";

type TabId = "jobs" | "costs" | "timeLogs" | "crew" | "schedule" | "users";

const TAB_ORDER: TabId[] = [
  "jobs",
  "costs",
  "timeLogs",
  "crew",
  "schedule",
  "users",
];

const TAB_LABELS: Record<TabId, string> = {
  jobs: "Jobs",
  costs: "Costs",
  timeLogs: "Time Logs",
  crew: "Crew",
  schedule: "Schedule",
  users: "Users",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  PROJECT_MANAGER: "Project Manager",
  CREW: "Crew Member",
  VIEWER: "Viewer",
};

const thCls = "px-2 py-2 text-left text-xs font-medium text-slate-500";
const thRightCls = "px-2 py-2 text-right text-xs font-medium text-slate-500";
const tdCls = "px-2 py-2";
const tdRightCls = "px-2 py-2 text-right";

/**
 * The journal IS the dashboard now: the tabbed explorer lives inline on
 * the home page instead of in a modal. One tab per model, lined across
 * the top of a card; a tab a role can't see simply doesn't exist (the
 * server only sends non-null lists for visible models). Clicking a job
 * opens its detail as a panel right here — the URL stays on `/`.
 */
export function JournalTabs({
  data,
  meId,
}: {
  data: JournalData;
  /** The signed-in user's id — their own row can't change its own role. */
  meId: number;
}) {
  const [tab, setTab] = useState<TabId>("jobs");
  const [detailJobId, setDetailJobId] = useState<number | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createKind, setCreateKind] = useState<
    "job" | "assignment" | "crew" | null
  >(null);

  const openJob = useCallback(async (jobId: number) => {
    setDetailJobId(jobId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    const result = await getJobDetail(jobId);
    if ("error" in result) {
      setDetailError(result.error);
      setDetail(null);
    } else {
      setDetail(result);
    }
    setDetailLoading(false);
  }, []);

  const closeDetail = () => {
    setDetailJobId(null);
    setDetail(null);
    setDetailError(null);
  };

  // The over-budget banner's "View details" opens a job panel from
  // outside this component: it dispatches `baseline:open-job`, and this
  // switches to the Jobs tab and opens that job's panel.
  useEffect(() => {
    const onOpenJob = (e: Event) => {
      const jobId = (e as CustomEvent<{ jobId: number }>).detail?.jobId;
      if (typeof jobId === "number") {
        setTab("jobs");
        void openJob(jobId);
      }
    };
    window.addEventListener("baseline:open-job", onOpenJob);
    return () => window.removeEventListener("baseline:open-job", onOpenJob);
  }, [openJob]);

  const tabs: { id: TabId; label: string; count: number }[] =
    TAB_ORDER.flatMap((id) => {
      const list = tabData(data, id);
      return list === null
        ? []
        : [{ id, label: TAB_LABELS[id], count: list.length }];
    });

  // The active tab is always a visible one — jobs is first and always
  // present, so the default never points at a hidden tab.
  const activeTab = tabs.some((t) => t.id === tab) ? tab : "jobs";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        role="tablist"
        aria-label="Models"
        className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-3 pt-3"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium ${
              activeTab === t.id
                ? "border-slate-200 bg-white text-slate-900"
                : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5" role="tabpanel">
        {activeTab === "jobs" && (
          <JobsPanel
            data={data}
            onSelectJob={openJob}
            onNewJob={
              data.canSeeMoney ? () => setCreateKind("job") : undefined
            }
          />
        )}
        {activeTab === "costs" && data.costs && (
          <CostsTable costs={data.costs} />
        )}
        {activeTab === "timeLogs" && data.timeLogs && (
          <TimeLogsTable logs={data.timeLogs} showMoney={data.canSeeMoney} />
        )}
        {activeTab === "crew" && data.crew && (
          <CrewPanel
            crew={data.crew}
            showRate={data.isOwner}
            onAddCrew={
              data.isOwner ? () => setCreateKind("crew") : undefined
            }
          />
        )}
        {activeTab === "schedule" && (
          <SchedulePanel
            schedule={data.schedule}
            onAddAssignment={
              data.canSeeMoney ? () => setCreateKind("assignment") : undefined
            }
          />
        )}
        {activeTab === "users" && data.users && data.usersCrew && (
          <UsersPanel users={data.users} crew={data.usersCrew} meId={meId} />
        )}
      </div>

      <Modal
        open={detailJobId !== null}
        onClose={closeDetail}
        title={detail ? detail.job.name : "Job"}
        wide
      >
        {detailLoading && !detail && (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        )}
        {detailError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {detailError}
          </p>
        )}
        {detail && <JobDetailPanel detail={detail} />}
      </Modal>

      <Modal
        open={createKind === "job"}
        onClose={() => setCreateKind(null)}
        title="New job"
      >
        <JobForm bare />
      </Modal>
      <Modal
        open={createKind === "assignment"}
        onClose={() => setCreateKind(null)}
        title="Add an assignment"
      >
        <AssignmentForm
          jobs={data.jobs.map((j) => ({ id: j.id, name: j.name }))}
          crew={(data.crew ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
          }))}
          bare
          onSuccess={() => setCreateKind(null)}
        />
      </Modal>
      <Modal
        open={createKind === "crew"}
        onClose={() => setCreateKind(null)}
        title="Add a crew member"
      >
        <CrewMemberForm bare onSuccess={() => setCreateKind(null)} />
      </Modal>
    </div>
  );
}

function tabData(data: JournalData, tab: TabId): unknown[] | null {
  switch (tab) {
    case "jobs":
      return data.jobs;
    case "costs":
      return data.costs;
    case "timeLogs":
      return data.timeLogs;
    case "crew":
      return data.crew;
    case "schedule":
      return data.schedule;
    case "users":
      return data.users;
  }
}

function Empty({ children }: { children: string }) {
  return <p className="py-6 text-center text-sm text-slate-500">{children}</p>;
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {children}
      </table>
    </div>
  );
}

function PanelAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
    >
      {children}
    </button>
  );
}

function JobsPanel({
  data,
  onSelectJob,
  onNewJob,
}: {
  data: JournalData;
  onSelectJob: (jobId: number) => void;
  onNewJob?: () => void;
}) {
  return (
    <div className="space-y-3">
      {onNewJob && (
        <div className="flex justify-end">
          <PanelAction onClick={onNewJob}>New job</PanelAction>
        </div>
      )}
      {data.jobs.length === 0 ? (
        <Empty>No jobs to show.</Empty>
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Job</th>
              <th className={thCls}>Status</th>
              {data.canSeeMoney && (
                <>
                  <th className={thRightCls}>Budget</th>
                  <th className={thRightCls}>Spent</th>
                  <th className={thRightCls}>Remaining</th>
                </>
              )}
              <th className={thCls}>Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className={tdCls}>
                  <button
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className="text-left font-medium text-amber-700 hover:underline"
                  >
                    {job.name}
                  </button>
                  {job.overBudget && (
                    <span className="ml-2">
                      <OverBudgetBadge />
                    </span>
                  )}
                  <span className="block text-xs text-slate-500">
                    {job.client} — {job.jobSiteAddress}
                  </span>
                </td>
                <td className={tdCls}>
                  <StatusBadge status={job.status} />
                </td>
                {data.canSeeMoney && (
                  <>
                    <td className={tdRightCls}>{job.budget}</td>
                    <td
                      className={`${tdRightCls} font-medium ${
                        job.overBudget ? "text-red-700" : ""
                      }`}
                    >
                      {job.spent}
                    </td>
                    <td className={tdRightCls}>{job.remaining}</td>
                  </>
                )}
                <td className={tdCls}>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                      <span
                        className={`block h-full rounded-full ${
                          job.overBudget ? "bg-red-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${job.pct}%` }}
                      />
                    </span>
                    <span className="w-8 text-xs text-slate-500">
                      {job.pct.toFixed(0)}%
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

function CostsTable({ costs }: { costs: NonNullable<JournalData["costs"]> }) {
  if (costs.length === 0) return <Empty>No costs logged yet.</Empty>;
  return (
    <TableWrap>
      <thead className="bg-slate-50">
        <tr>
          <th className={thCls}>Date</th>
          <th className={thCls}>Job</th>
          <th className={thCls}>Category</th>
          <th className={thCls}>Description</th>
          <th className={thCls}>Vendor</th>
          <th className={thRightCls}>Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {costs.map((c) => (
          <tr key={c.id} className="hover:bg-slate-50">
            <td className={`${tdCls} whitespace-nowrap`}>{c.date}</td>
            <td className={tdCls}>{c.jobName}</td>
            <td className={tdCls}>{c.category}</td>
            <td className={tdCls}>{c.description}</td>
            <td className={tdCls}>{c.vendor}</td>
            <td className={`${tdRightCls} font-medium`}>{c.amount}</td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function TimeLogsTable({
  logs,
  showMoney,
}: {
  logs: NonNullable<JournalData["timeLogs"]>;
  showMoney: boolean;
}) {
  if (logs.length === 0) return <Empty>No hours logged yet.</Empty>;
  return (
    <TableWrap>
      <thead className="bg-slate-50">
        <tr>
          <th className={thCls}>Date</th>
          <th className={thCls}>Crew member</th>
          <th className={thCls}>Job</th>
          <th className={thCls}>Task</th>
          <th className={thRightCls}>Hours</th>
          {showMoney && <th className={thRightCls}>Labor cost</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {logs.map((t) => (
          <tr key={t.id} className="hover:bg-slate-50">
            <td className={`${tdCls} whitespace-nowrap`}>{t.date}</td>
            <td className={tdCls}>
              {t.crewName}
              <span className="block text-xs text-slate-500">
                {t.crewRole}
                {showMoney && t.rate ? ` — ${t.rate}` : ""}
              </span>
            </td>
            <td className={tdCls}>{t.jobName}</td>
            <td className={tdCls}>{t.task}</td>
            <td className={tdRightCls}>{t.hours}</td>
            {showMoney && <td className={tdRightCls}>{t.laborCost}</td>}
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function CrewPanel({
  crew,
  showRate,
  onAddCrew,
}: {
  crew: NonNullable<JournalData["crew"]>;
  showRate: boolean;
  onAddCrew?: () => void;
}) {
  return (
    <div className="space-y-3">
      {onAddCrew && (
        <div className="flex justify-end">
          <PanelAction onClick={onAddCrew}>Add crew member</PanelAction>
        </div>
      )}
      {crew.length === 0 ? (
        <Empty>No crew members yet.</Empty>
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Role</th>
              {showRate && <th className={thRightCls}>Hourly rate</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {crew.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className={`${tdCls} font-medium`}>{c.name}</td>
                <td className={tdCls}>{c.role}</td>
                {showRate && <td className={tdRightCls}>{c.rate}</td>}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

function SchedulePanel({
  schedule,
  onAddAssignment,
}: {
  schedule: JournalData["schedule"];
  onAddAssignment?: () => void;
}) {
  return (
    <div className="space-y-3">
      {onAddAssignment && (
        <div className="flex justify-end">
          <PanelAction onClick={onAddAssignment}>Add assignment</PanelAction>
        </div>
      )}
      {schedule.length === 0 ? (
        <Empty>No one scheduled this week.</Empty>
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Day</th>
              <th className={thCls}>Crew member</th>
              <th className={thCls}>Job</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {schedule.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className={`${tdCls} whitespace-nowrap font-medium`}>
                  {a.dayLabel}
                </td>
                <td className={tdCls}>
                  {a.crewName}
                  <span className="block text-xs text-slate-500">{a.crewRole}</span>
                </td>
                <td className={tdCls}>{a.jobName}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

function UsersPanel({
  users,
  crew,
  meId,
}: {
  users: NonNullable<JournalData["users"]>;
  crew: NonNullable<JournalData["usersCrew"]>;
  meId: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Who can sign in, what they can see, and which crew member each
        account is linked to. Only the Owner can change roles — a role
        change takes effect the next time that person signs in.
      </p>
      {users.length === 0 ? (
        <Empty>No users yet.</Empty>
      ) : (
        users.map((u) => (
          <div
            key={u.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {u.name}
                {u.id === meId && (
                  <span className="ml-2 text-xs font-medium text-slate-500">
                    (you)
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-600">{u.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                Role: {ROLE_LABELS[u.role] ?? u.role}
                {u.crewMemberName
                  ? ` · Linked to ${u.crewMemberName}`
                  : " · Not linked to a crew member"}
                {" · "}Joined {u.joined}
              </p>
            </div>
            <div className="mt-4">
              <UserRowForm
                user={{
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role as UserRole,
                  crewMemberId: u.crewMemberId,
                }}
                crew={crew}
                isSelf={u.id === meId}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * One job's full detail, in a panel on the dashboard — the same content
 * the old /jobs/[id] page showed. The URL stays on `/`.
 */
function JobDetailPanel({ detail }: { detail: JobDetail }) {
  const { job } = detail;
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">{job.name}</h2>
          <StatusBadge status={job.status} />
          {detail.overBudget && <OverBudgetBadge />}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {job.client} — {job.jobSiteAddress}
        </p>
      </div>

      {detail.stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DetailStat label="Budget" value={detail.stats.budget} />
            <DetailStat label="Direct costs" value={detail.stats.directCosts} />
            <DetailStat
              label="Labor cost (from time logs)"
              value={detail.stats.laborCost}
              hint={`${detail.stats.totalHours} hrs logged`}
            />
            <DetailStat
              label="Total spent"
              value={detail.stats.totalSpent}
              tone={detail.overBudget ? "bad" : undefined}
              hint={`${detail.pct.toFixed(0)}% of budget`}
            />
          </div>
          <div
            className={`rounded-lg border p-5 ${
              detail.overBudget
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                {detail.overBudget ? "Over budget by" : "Remaining budget"}
              </p>
              <p
                className={`text-xl font-bold ${
                  detail.overBudget ? "text-red-700" : "text-green-700"
                }`}
              >
                {detail.stats.remaining}
              </p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  detail.overBudget ? "bg-red-500" : "bg-amber-500"
                }`}
                style={{ width: `${detail.pct}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Progress</p>
            <p className="text-xl font-bold text-slate-900">
              {detail.pct.toFixed(0)}%
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                detail.overBudget ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{ width: `${detail.pct}%` }}
            />
          </div>
          {detail.isCrew && detail.myHours !== null && (
            <p className="mt-3 text-sm text-slate-600">
              Your hours on this job:{" "}
              <span className="font-semibold text-slate-900">
                {detail.myHours.toFixed(1)} hrs
              </span>
            </p>
          )}
        </div>
      )}

      {detail.byCategory && (
        <section>
          <h3 className="text-lg font-semibold text-slate-900">
            Cost breakdown by category
          </h3>
          {detail.byCategory.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
              No costs logged yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">
                      Share of direct costs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {detail.byCategory.map((row) => (
                    <tr key={row.category}>
                      <td className="px-4 py-3 font-medium">{row.category}</td>
                      <td className="px-4 py-3 text-right">{row.amount}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.share}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {detail.canSeeMoney ? (
        <div className="flex flex-wrap gap-3">
          <LogCostButton jobId={job.id} />
          <LogHoursButton
            jobs={[{ id: job.id, name: job.name }]}
            crew={detail.crew}
          />
        </div>
      ) : detail.isCrew && detail.fixedCrewMember ? (
        <div className="flex flex-wrap gap-3">
          <LogHoursButton
            jobs={[{ id: job.id, name: job.name }]}
            crew={[]}
            fixedCrewMember={detail.fixedCrewMember}
          />
        </div>
      ) : null}

      {detail.costEntries && (
        <section>
          <h3 className="text-lg font-semibold text-slate-900">Cost entries</h3>
          {detail.costEntries.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
              No costs logged for this job yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
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
                  {detail.costEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-4 py-3">{e.date}</td>
                      <td className="px-4 py-3">{e.category}</td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 text-slate-600">{e.vendor}</td>
                      <td className="px-4 py-3 text-right font-medium">{e.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {detail.timeLogs && (
        <section>
          <h3 className="text-lg font-semibold text-slate-900">
            {detail.isCrew ? "My time logs" : "Time logs"}
          </h3>
          {detail.timeLogs.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
              No hours logged for this job yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Crew member</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Task</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Hours</th>
                    {detail.canSeeMoney && (
                      <th className="px-4 py-3 text-right font-medium text-slate-600">
                        Labor cost
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {detail.timeLogs.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap px-4 py-3">{t.date}</td>
                      <td className="px-4 py-3">
                        {t.crewName}
                        <span className="block text-xs text-slate-500">
                          {t.crewRole}
                          {detail.canSeeMoney && t.rate ? ` — ${t.rate}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">{t.task}</td>
                      <td className="px-4 py-3 text-right">{t.hours}</td>
                      {detail.canSeeMoney && (
                        <td className="px-4 py-3 text-right">{t.laborCost}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function DetailStat({
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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          tone === "bad" ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
