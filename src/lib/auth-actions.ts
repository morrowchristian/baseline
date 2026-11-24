"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { UserRole } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export type AuthState = { error?: string; ok?: boolean } | null;

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sign-up. The form never lets the user pick a role: the FIRST account
 * ever created becomes Owner, and every later sign-up is Crew. The Owner
 * upgrades roles from the Users page.
 */
export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const crewMemberIdRaw = formData.get("crewMemberId") as string | null;
  const crewMemberId = crewMemberIdRaw ? Number(crewMemberIdRaw) : null;

  if (!name) return { error: "Name is required." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (
    crewMemberId !== null &&
    (!Number.isInteger(crewMemberId) || crewMemberId <= 0)
  ) {
    return { error: "Pick a valid crew member (or leave it blank)." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "An account with that email already exists. Try signing in.",
    };
  }

  if (crewMemberId !== null) {
    const member = await prisma.crewMember.findUnique({
      where: { id: crewMemberId },
    });
    if (!member) return { error: "That crew member no longer exists." };
    const linked = await prisma.user.findUnique({ where: { crewMemberId } });
    if (linked) {
      return { error: "That crew member is already linked to an account." };
    }
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? UserRole.OWNER : UserRole.CREW;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      crewMemberId: crewMemberId ?? undefined,
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    // signIn redirects on success (a NEXT_REDIRECT throw) — re-throw it.
    // Only a real AuthError means the sign-in itself failed.
    if (e instanceof AuthError) {
      return {
        error: "Account created, but sign-in failed. Try signing in.",
      };
    }
    throw e;
  }
  return null;
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  if (!email || !password) return { error: "Enter your email and password." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Sign-in failed. Try again." };
    }
    throw e;
  }
  return null;
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/signin" });
}

/**
 * Owner-only: change a user's role and/or link them to a crew member.
 * The Owner cannot change their own role (prevents locking themselves out).
 */
export async function updateUserRole(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const me = await requireRole(UserRole.OWNER);

  const userId = Number(formData.get("userId"));
  const roleRaw = formData.get("role") as string | null;
  const crewMemberIdRaw = formData.get("crewMemberId") as string | null;

  if (!Number.isInteger(userId) || userId <= 0) {
    return { error: "Invalid user." };
  }
  if (!roleRaw || !(Object.values(UserRole) as string[]).includes(roleRaw)) {
    return { error: "Pick a valid role." };
  }
  const role = roleRaw as UserRole;
  const crewMemberId = crewMemberIdRaw ? Number(crewMemberIdRaw) : null;
  if (
    crewMemberId !== null &&
    (!Number.isInteger(crewMemberId) || crewMemberId <= 0)
  ) {
    return { error: "Pick a valid crew member (or leave it blank)." };
  }
  if (userId === Number(me.id)) {
    return { error: "You can't change your own role." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "That user no longer exists." };

  if (crewMemberId !== null) {
    const member = await prisma.crewMember.findUnique({
      where: { id: crewMemberId },
    });
    if (!member) return { error: "That crew member no longer exists." };
    const linked = await prisma.user.findUnique({ where: { crewMemberId } });
    if (linked && linked.id !== userId) {
      return {
        error: "That crew member is already linked to another account.",
      };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role, crewMemberId },
  });
  revalidatePath("/users");
  return { ok: true };
}
