import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import { JournalExplorer } from "@/components/journal-explorer";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user ?? null;

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
                <JournalExplorer />
                <nav className="flex items-center gap-1">
                  <NavLink href="/">Dashboard</NavLink>
                  <NavLink href="/jobs">Jobs</NavLink>
                  <NavLink href="/schedule">Schedule</NavLink>
                  {user.role === "OWNER" && <NavLink href="/users">Users</NavLink>}
                </nav>
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
