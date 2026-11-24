import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  role: UserRole;
  crewMemberId: number | null;
};

/** The signed-in user from the JWT session, or null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    crewMemberId: session.user.crewMemberId ?? null,
  };
}

/** Redirect to /signin when nobody is signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

/**
 * Redirect to /signin when signed out, or to the dashboard when the
 * signed-in user does not hold one of the given roles. Use this at the top
 * of every page and server action that is role-restricted — it is the
 * server-side enforcement, not just UI hiding.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export const canSeeMoney = (role: UserRole): boolean =>
  role === "OWNER" || role === "PROJECT_MANAGER";

export const canManageJobs = (role: UserRole): boolean =>
  role === "OWNER" || role === "PROJECT_MANAGER";
