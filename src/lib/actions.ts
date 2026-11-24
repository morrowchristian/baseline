"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CostCategory, JobStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/dates";
import { requireRole, requireUser } from "@/lib/authz";

export type ActionState = { error?: string; ok?: boolean } | null;

function fail(message: string): ActionState {
  return { error: message };
}

function required(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function positiveNumber(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function intId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function createJob(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Only Owner and Project Manager can create jobs.
  await requireRole(UserRole.OWNER, UserRole.PROJECT_MANAGER);

  const name = required(formData, "name");
  const client = required(formData, "client");
  const jobSiteAddress = required(formData, "jobSiteAddress");
  const statusRaw = required(formData, "status");
  const budget = positiveNumber(required(formData, "budget"));

  if (!name) return fail("Job name is required.");
  if (!client) return fail("Client name is required.");
  if (!jobSiteAddress) return fail("Job site address is required.");
  if (!statusRaw || !(Object.values(JobStatus) as string[]).includes(statusRaw)) {
    return fail("Pick a valid status.");
  }
  if (budget === null) return fail("Budget must be a positive dollar amount.");

  await prisma.job.create({
    data: {
      name,
      client,
      jobSiteAddress,
      status: statusRaw as JobStatus,
      budget,
    },
  });
  revalidatePath("/");
  redirect(`/`);
}

export async function createCostEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Costs are Owner / Project Manager only — hidden from Crew and Viewer.
  await requireRole(UserRole.OWNER, UserRole.PROJECT_MANAGER);

  const jobId = intId(formData.get("jobId"));
  const categoryRaw = required(formData, "category");
  const amount = positiveNumber(required(formData, "amount"));
  const dateRaw = required(formData, "date");
  const description = required(formData, "description");
  const vendor = required(formData, "vendor");

  if (jobId === null) return fail("Pick a job.");
  if (!categoryRaw || !(Object.values(CostCategory) as string[]).includes(categoryRaw)) {
    return fail("Pick a valid category.");
  }
  if (amount === null) return fail("Amount must be a positive dollar amount.");
  const date = dateRaw ? parseDateInput(dateRaw) : null;
  if (!date) return fail("Pick a valid date.");
  if (!description) return fail("Description is required.");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return fail("That job no longer exists.");

  await prisma.costEntry.create({
    data: {
      jobId,
      category: categoryRaw as CostCategory,
      amount,
      date,
      description,
      vendor: vendor ?? undefined,
    },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function createTimeLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const me = await requireUser();

  const crewMemberId = intId(formData.get("crewMemberId"));
  const jobId = intId(formData.get("jobId"));
  const dateRaw = required(formData, "date");
  const hours = positiveNumber(required(formData, "hours"));
  const task = required(formData, "task");

  if (crewMemberId === null) return fail("Pick a crew member.");
  if (jobId === null) return fail("Pick a job.");
  const date = dateRaw ? parseDateInput(dateRaw) : null;
  if (!date) return fail("Pick a valid date.");
  if (hours === null) return fail("Hours must be a positive number.");
  if (hours > 24) return fail("Hours can't be more than 24 in a day.");
  if (!task) return fail("Task / note is required.");

  // Crew members can only log their own time, and only on jobs they are
  // assigned to. Viewers cannot log time at all.
  if (me.role === UserRole.VIEWER) {
    return fail("Viewers can't log hours.");
  }
  if (me.role === UserRole.CREW) {
    if (me.crewMemberId === null || crewMemberId !== me.crewMemberId) {
      return fail("You can only log your own hours.");
    }
    const assigned = await prisma.scheduleAssignment.findFirst({
      where: { crewMemberId, jobId },
    });
    if (!assigned) {
      return fail("You can only log hours on jobs you are assigned to.");
    }
  }

  const [member, job] = await Promise.all([
    prisma.crewMember.findUnique({ where: { id: crewMemberId } }),
    prisma.job.findUnique({ where: { id: jobId } }),
  ]);
  if (!member) return fail("That crew member no longer exists.");
  if (!job) return fail("That job no longer exists.");

  await prisma.timeLog.create({
    data: { crewMemberId, jobId, date, hours, task },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function createAssignment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Only Owner and Project Manager manage the schedule.
  await requireRole(UserRole.OWNER, UserRole.PROJECT_MANAGER);

  const crewMemberId = intId(formData.get("crewMemberId"));
  const jobId = intId(formData.get("jobId"));
  const dateRaw = required(formData, "date");

  if (crewMemberId === null) return fail("Pick a crew member.");
  if (jobId === null) return fail("Pick a job.");
  const date = dateRaw ? parseDateInput(dateRaw) : null;
  if (!date) return fail("Pick a valid date.");

  const [member, job] = await Promise.all([
    prisma.crewMember.findUnique({ where: { id: crewMemberId } }),
    prisma.job.findUnique({ where: { id: jobId } }),
  ]);
  if (!member) return fail("That crew member no longer exists.");
  if (!job) return fail("That job no longer exists.");

  const existing = await prisma.scheduleAssignment.findUnique({
    where: { crewMemberId_date: { crewMemberId, date } },
    include: { job: true },
  });
  if (existing) {
    return fail(
      `${member.name} is already assigned to ${existing.job.name} on that date. One job per person per day.`,
    );
  }

  await prisma.scheduleAssignment.create({
    data: { crewMemberId, jobId, date },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function createCrewMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Managing the crew roster (including hourly rates) is Owner-only.
  await requireRole(UserRole.OWNER);

  const name = required(formData, "name");
  const role = required(formData, "role");
  const rateRaw = required(formData, "hourlyRate");
  const hourlyRate = rateRaw === null ? null : positiveNumber(rateRaw);

  if (!name) return fail("Name is required.");
  if (!role) return fail("Role is required.");
  if (rateRaw !== null && hourlyRate === null) {
    return fail("Hourly rate must be a positive dollar amount (or leave it blank).");
  }

  await prisma.crewMember.create({
    data: { name, role, hourlyRate: hourlyRate ?? undefined },
  });
  revalidatePath("/");
  return { ok: true };
}
