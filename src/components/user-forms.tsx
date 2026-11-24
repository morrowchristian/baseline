"use client";

import { useActionState } from "react";
import { updateUserRole, type AuthState } from "@/lib/auth-actions";
import type { UserRole } from "@prisma/client";

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600";

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  PROJECT_MANAGER: "Project Manager",
  CREW: "Crew Member",
  VIEWER: "Viewer",
};

export function UserRowForm({
  user,
  crew,
  isSelf,
}: {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    crewMemberId: number | null;
  };
  crew: { id: number; name: string; role: string }[];
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(updateUserRole, null);
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={user.id} />
      {state?.error && (
        <p role="alert" className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mb-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`role-${user.id}`} className="block text-xs font-medium text-slate-500">
            Role
          </label>
          <select
            id={`role-${user.id}`}
            name="role"
            className={inputCls}
            defaultValue={user.role}
            disabled={isSelf || pending}
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`crew-${user.id}`} className="block text-xs font-medium text-slate-500">
            Linked crew member
          </label>
          <select
            id={`crew-${user.id}`}
            name="crewMemberId"
            className={inputCls}
            defaultValue={user.crewMemberId ?? ""}
            disabled={isSelf || pending}
          >
            <option value="">Not linked</option>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isSelf || pending}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {isSelf && (
        <p className="mt-1 text-xs text-slate-500">
          This is your account — you can&apos;t change your own role.
        </p>
      )}
    </form>
  );
}
