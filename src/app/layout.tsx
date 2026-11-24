import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { getSessionUser, type SessionUser } from "@/lib/authz";
import { LogCostPickerButton, LogHoursButton } from "@/components/log-buttons";
import type { CrewOption, JobOption } from "@/components/forms";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baseline — Construction Job Costing & Crew Scheduling",
  description:
    "Track job budgets vs. actual spend, log costs and crew hours, and schedule the crew week by week.",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  PROJECT_MANAGER: "Project Manager",
  CREW: "Crew Member",
  VIEWER: "Viewer",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
    >
      {children}
    </Link>
  );
}

type HeaderLogData = {
  /** Owner / Project Manager only. */
  canLogCost: boolean;
  canLogHours: boolean;
  jobs: JobOption[];
  crew: CrewOption[];
  /** Crew role only — the member is fixed when logging their own hours. */
  fixedCrewMember?: { id: number; name: string };
};

/**
 * Role-scoped lists for the header's Log Cost / Log Hours buttons. Costs
 * are Owner / Project Manager only; Crew logs only their own hours on
 * jobs they are assigned to; Viewers get no buttons.
 */
async function getHeaderLogData(user: SessionUser): Promise<HeaderLogData> {
  if (user.role === "VIEWER") {
    return { canLogCost: false, canLogHours: false, jobs: [], crew: [] };
  }
  if (user.role === "CREW") {
    if (user.crewMemberId === null) {
      return { canLogCost: false, canLogHours: false, jobs: [], crew: [] };
    }
    const [member, assigned] = await Promise.all([
      prisma.crewMember.findUnique({ where: { id: user.crewMemberId } }),
      prisma.scheduleAssignment.findMany({
        where: { crewMemberId: user.crewMemberId },
        select: { jobId: true },
        distinct: ["jobId"],
      }),
    ]);
    if (!member) {
      return { canLogCost: false, canLogHours: false, jobs: [], crew: [] };
    }
    const jobs = await prisma.job.findMany({
      where: { id: { in: assigned.map((a) => a.jobId) } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return {
      canLogCost: false,
      canLogHours: true,
      jobs,
      crew: [],
      fixedCrewMember: { id: member.id, name: member.name },
    };
  }
  const [jobs, crew] = await Promise.all([
    prisma.job.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.crewMember.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { canLogCost: true, canLogHours: true, jobs, crew };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user ?? null;

  // The header is minimal now — there are no other pages to navigate to.
  // The log buttons live here so entry is one click away from anywhere.
  const sessionUser = user !== null ? await getSessionUser() : null;
  const headerLog =
    sessionUser !== null ? await getHeaderLogData(sessionUser) : null;

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
        <header className="bg-slate-900 shadow">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Baseline
              </span>
              <span className="hidden text-xs font-medium uppercase tracking-wider text-amber-400 sm:inline">
                Job costing &amp; crew scheduling
              </span>
            </Link>
            {user ? (
              <div className="flex flex-wrap items-center gap-1">
                {headerLog?.canLogCost && (
                  <LogCostPickerButton jobs={headerLog.jobs} />
                )}
                {headerLog?.canLogHours && (
                  <LogHoursButton
                    jobs={headerLog.jobs}
                    crew={headerLog.crew}
                    fixedCrewMember={headerLog.fixedCrewMember}
                  />
                )}
                <span className="ml-2 hidden text-xs text-slate-400 md:inline">
                  {user.name} · {ROLE_LABELS[user.role] ?? user.role}
                </span>
                <form action={signOutAction} className="ml-1">
                  <button
                    type="submit"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <nav className="flex items-center gap-1">
                <NavLink href="/signin">Sign in</NavLink>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-[1600px] px-4 pb-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500">
            Sample data — the jobs, clients, and crew shown here are fictional
            examples for demonstration, not real client work.
          </p>
        </footer>
      </body>
    </html>
  );
}
