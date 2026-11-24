import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { UserRowForm } from "@/components/user-forms";

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  PROJECT_MANAGER: "Project Manager",
  CREW: "Crew Member",
  VIEWER: "Viewer",
};

export default async function UsersPage() {
  const me = await requireRole(UserRole.OWNER);

  const [users, crew] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { crewMember: true },
    }),
    prisma.crewMember.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users &amp; roles</h1>
        <p className="mt-1 text-sm text-slate-600">
          Who can sign in, what they can see, and which crew member each
          account is linked to. Only the Owner can change roles.
        </p>
      </div>

      {users.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          No users yet.
        </p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {u.name}
                    {u.id === Number(me.id) && (
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        (you)
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-600">{u.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Role: {ROLE_LABELS[u.role]}
                    {u.crewMember ? ` · Linked to ${u.crewMember.name}` : " · Not linked to a crew member"}
                    {" · "}Joined {u.createdAt.toLocaleDateString("en-US")}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <UserRowForm
                  user={{
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    crewMemberId: u.crewMemberId,
                  }}
                  crew={crew.map((c) => ({ id: c.id, name: c.name, role: c.role }))}
                  isSelf={u.id === Number(me.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
