"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createAssignment,
  createCostEntry,
  createCrewMember,
  createJob,
  createTimeLog,
  type ActionState,
} from "@/lib/actions";
import { todayISO } from "@/lib/dates";

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600";
const labelCls = "block text-sm font-medium text-slate-700";
const btnCls =
  "rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50";
const cardCls = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";

export type JobOption = { id: number; name: string };
export type CrewOption = { id: number; name: string; role: string };

function FormError({ state }: { state: ActionState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.error}
    </p>
  );
}

function useResetOnSuccess(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export function JobForm() {
  const [state, action, pending] = useActionState(createJob, null);
  return (
    <form action={action} className={`${cardCls} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900">New job</h2>
      <FormError state={state} />
      <div>
        <label htmlFor="job-name" className={labelCls}>Job name</label>
        <input id="job-name" name="name" required className={inputCls} placeholder="e.g. Maple Street Kitchen Remodel" />
      </div>
      <div>
        <label htmlFor="job-client" className={labelCls}>Client (name)</label>
        <input id="job-client" name="client" required className={inputCls} placeholder="e.g. Harper Family" />
      </div>
      <div>
        <label htmlFor="job-address" className={labelCls}>Job site address</label>
        <input id="job-address" name="jobSiteAddress" required className={inputCls} placeholder="e.g. 1847 Maple St, Cleveland, TN" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="job-status" className={labelCls}>Status</label>
          <select id="job-status" name="status" className={inputCls} defaultValue="active">
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div>
          <label htmlFor="job-budget" className={labelCls}>Budget ($)</label>
          <input id="job-budget" name="budget" type="number" min="0.01" step="0.01" required className={inputCls} placeholder="48000" />
        </div>
      </div>
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}

export function CostEntryForm({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState(createCostEntry, null);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className={`${cardCls} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900">Log a cost</h2>
      <FormError state={state} />
      {state?.ok && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Cost logged.</p>
      )}
      <input type="hidden" name="jobId" value={jobId} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cost-category" className={labelCls}>Category</label>
          <select id="cost-category" name="category" className={inputCls} defaultValue="Materials">
            <option value="Labor">Labor</option>
            <option value="Materials">Materials</option>
            <option value="Equipment">Equipment</option>
            <option value="Subcontractor">Subcontractor</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="cost-amount" className={labelCls}>Amount ($)</label>
          <input id="cost-amount" name="amount" type="number" min="0.01" step="0.01" required className={inputCls} placeholder="0.00" />
        </div>
      </div>
      <div>
        <label htmlFor="cost-date" className={labelCls}>Date</label>
        <input id="cost-date" name="date" type="date" required defaultValue={todayISO()} className={inputCls} />
      </div>
      <div>
        <label htmlFor="cost-description" className={labelCls}>Description</label>
        <input id="cost-description" name="description" required className={inputCls} placeholder="e.g. Cabinet order — deposit" />
      </div>
      <div>
        <label htmlFor="cost-vendor" className={labelCls}>Vendor (optional)</label>
        <input id="cost-vendor" name="vendor" className={inputCls} placeholder="e.g. Cleveland Lumber Co." />
      </div>
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Saving…" : "Log cost"}
      </button>
    </form>
  );
}

export function TimeLogForm({
  jobs,
  crew,
  fixedCrewMember,
}: {
  jobs: JobOption[];
  crew: CrewOption[];
  /** When set, the crew member is fixed (e.g. a Crew user logging their own
   * hours) — shown as text with a hidden input instead of a picker. */
  fixedCrewMember?: { id: number; name: string };
}) {
  const [state, action, pending] = useActionState(createTimeLog, null);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className={`${cardCls} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900">Log hours</h2>
      <FormError state={state} />
      {state?.ok && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Hours logged.</p>
      )}
      {fixedCrewMember ? (
        <div>
          <span className={labelCls}>Crew member</span>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {fixedCrewMember.name}
          </p>
          <input type="hidden" name="crewMemberId" value={fixedCrewMember.id} />
        </div>
      ) : (
        <div>
          <label htmlFor="log-crew" className={labelCls}>Crew member</label>
          <select id="log-crew" name="crewMemberId" required className={inputCls} defaultValue="">
            <option value="" disabled>Pick a crew member</option>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="log-job" className={labelCls}>Job</label>
        <select id="log-job" name="jobId" required className={inputCls} defaultValue="">
          <option value="" disabled>Pick a job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="log-date" className={labelCls}>Date</label>
          <input id="log-date" name="date" type="date" required defaultValue={todayISO()} className={inputCls} />
        </div>
        <div>
          <label htmlFor="log-hours" className={labelCls}>Hours</label>
          <input id="log-hours" name="hours" type="number" min="0.25" max="24" step="0.25" required className={inputCls} placeholder="8" />
        </div>
      </div>
      <div>
        <label htmlFor="log-task" className={labelCls}>Task / note</label>
        <input id="log-task" name="task" required className={inputCls} placeholder="e.g. Framing — kitchen walls" />
      </div>
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Saving…" : "Log hours"}
      </button>
    </form>
  );
}

export function AssignmentForm({ jobs, crew }: { jobs: JobOption[]; crew: CrewOption[] }) {
  const [state, action, pending] = useActionState(createAssignment, null);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className={`${cardCls} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900">Add an assignment</h2>
      <FormError state={state} />
      {state?.ok && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Assignment added.</p>
      )}
      <div>
        <label htmlFor="assign-crew" className={labelCls}>Crew member</label>
        <select id="assign-crew" name="crewMemberId" required className={inputCls} defaultValue="">
          <option value="" disabled>Pick a crew member</option>
          {crew.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="assign-job" className={labelCls}>Job</label>
        <select id="assign-job" name="jobId" required className={inputCls} defaultValue="">
          <option value="" disabled>Pick a job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="assign-date" className={labelCls}>Date</label>
        <input id="assign-date" name="date" type="date" required defaultValue={todayISO()} className={inputCls} />
      </div>
      <p className="text-xs text-slate-500">One job per person per day — if they&apos;re already booked that day, pick another date.</p>
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Saving…" : "Add assignment"}
      </button>
    </form>
  );
}

export function CrewMemberForm() {
  const [state, action, pending] = useActionState(createCrewMember, null);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className={`${cardCls} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900">Add a crew member</h2>
      <FormError state={state} />
      {state?.ok && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Crew member added.</p>
      )}
      <div>
        <label htmlFor="crew-name" className={labelCls}>Name</label>
        <input id="crew-name" name="name" required className={inputCls} placeholder="e.g. Jordan Lee" />
      </div>
      <div>
        <label htmlFor="crew-role" className={labelCls}>Role</label>
        <input id="crew-role" name="role" required className={inputCls} placeholder="e.g. Carpenter" />
      </div>
      <div>
        <label htmlFor="crew-rate" className={labelCls}>Hourly rate ($) — optional</label>
        <input id="crew-rate" name="hourlyRate" type="number" min="0.01" step="0.01" className={inputCls} placeholder="Leave blank if not set" />
        <p className="mt-1 text-xs text-slate-500">Used to show labor cost from time logs. Blank means their logged hours show $0 labor cost.</p>
      </div>
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Saving…" : "Add crew member"}
      </button>
    </form>
  );
}
