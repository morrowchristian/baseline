"use client";

import { useCallback, useState } from "react";
import {
  getJournalData,
  type JournalData,
} from "@/lib/journal";
import { Modal } from "@/components/modal";
import { OverBudgetBadge, StatusBadge } from "@/components/ui";

type TabId = "jobs" | "costs" | "timeLogs" | "crew" | "schedule";

const TAB_ORDER: TabId[] = ["jobs", "costs", "timeLogs", "crew", "schedule"];

const TAB_LABELS: Record<TabId, string> = {
  jobs: "Jobs",
  costs: "Costs",
  timeLogs: "Time Logs",
  crew: "Crew",
  schedule: "Schedule",
};

const thCls = "px-2 py-2 text-left text-xs font-medium text-slate-500";
const thRightCls = "px-2 py-2 text-right text-xs font-medium text-slate-500";
const tdCls = "px-2 py-2";
const tdRightCls = "px-2 py-2 text-right";

/** One tab per model, lined across the top of a single modal — the same
 * idea as the component explorer. Data is fetched server-side (role-scoped)
 * when the modal opens, so a tab a role can't see simply doesn't exist. */
export function JournalExplorer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JournalData | null>(null);
  const [tab, setTab] = useState<TabId>("jobs");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getJournalData();
    if ("error" in result) {
      setError(result.error);
      setData(null);
    } else {
      setData(result);
      const first = TAB_ORDER.find((t) => tabData(result, t) !== null);
      if (first) setTab(first);
    }
    setLoading(false);
  }, []);

  const openExplorer = () => {
    setOpen(true);
    void load();
  };

  const tabs: { id: TabId; label: string; count: number }[] = data
    ? TAB_ORDER.flatMap((id) => {
        const list = tabData(data, id);
        return list === null
          ? []
          : [{ id, label: TAB_LABELS[id], count: list.length }];
      })
    : [];

  return (
    <>
      <button
        type="button"
        onClick={openExplorer}
        className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500"
      >
        Journal
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Journal" wide>
        {loading && !data && (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {data && (
          <>
            <div
              role="tablist"
              aria-label="Models"
              className="-mx-5 -mt-5 flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-5 pt-3"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium ${
                    tab === t.id
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

            <div className="pt-4" role="tabpanel">
              {tab === "jobs" && <JobsTable data={data} />}
              {tab === "costs" && data.costs && <CostsTable costs={data.costs} />}
              {tab === "timeLogs" && data.timeLogs && (
                <TimeLogsTable logs={data.timeLogs} showMoney={data.canSeeMoney} />
              )}
              {tab === "crew" && data.crew && (
                <CrewTable crew={data.crew} showRate={data.isOwner} />
              )}
              {tab === "schedule" && <ScheduleTable schedule={data.schedule} />}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function tabData(
  data: JournalData,
  tab: TabId,
): unknown[] | null {
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

function JobsTable({ data }: { data: JournalData }) {
  if (data.jobs.length === 0) return <Empty>No jobs to show.</Empty>;
  return (
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
              <span className="font-medium text-slate-900">{job.name}</span>
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
                <td className={`${tdRightCls} font-medium ${job.overBudget ? "text-red-700" : ""}`}>
                  {job.spent}
                </td>
                <td className={tdRightCls}>{job.remaining}</td>
              </>
            )}
            <td className={tdCls}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className={`block h-full rounded-full ${job.overBudget ? "bg-red-500" : "bg-amber-500"}`}
                    style={{ width: `${job.pct}%` }}
                  />
                </span>
                <span className="w-8 text-xs text-slate-500">{job.pct.toFixed(0)}%</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
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

function CrewTable({
  crew,
  showRate,
}: {
  crew: NonNullable<JournalData["crew"]>;
  showRate: boolean;
}) {
  if (crew.length === 0) return <Empty>No crew members yet.</Empty>;
  return (
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
  );
}

function ScheduleTable({
  schedule,
}: {
  schedule: JournalData["schedule"];
}) {
  if (schedule.length === 0)
    return <Empty>No one scheduled this week.</Empty>;
  return (
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
            <td className={`${tdCls} whitespace-nowrap font-medium`}>{a.dayLabel}</td>
            <td className={tdCls}>
              {a.crewName}
              <span className="block text-xs text-slate-500">{a.crewRole}</span>
            </td>
            <td className={tdCls}>{a.jobName}</td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
