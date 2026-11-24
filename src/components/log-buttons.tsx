"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import {
  CostEntryForm,
  TimeLogForm,
  type CrewOption,
  type JobOption,
} from "@/components/forms";

const primaryBtnCls =
  "rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700";

/**
 * The two quick-entry buttons. Each opens a modal holding the existing
 * form — the form itself is unchanged, so the fields, validation, and
 * server actions are the same as the old inline forms. On a successful
 * save the modal closes; the server action revalidates the page, so the
 * new row is already there when the modal closes.
 */
export function LogCostButton({ jobId }: { jobId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={primaryBtnCls}>
        Log a cost
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log a cost">
        <CostEntryForm jobId={jobId} bare onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

/**
 * Header "Log a cost" — not tied to one job, so the form shows a job
 * picker. Owner / Project Manager only.
 */
export function LogCostPickerButton({ jobs }: { jobs: JobOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={primaryBtnCls}>
        Log a cost
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log a cost">
        <CostEntryForm jobs={jobs} bare onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function LogHoursButton({
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={primaryBtnCls}>
        Log hours
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log hours">
        <TimeLogForm
          jobs={jobs}
          crew={crew}
          fixedCrewMember={fixedCrewMember}
          bare
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
