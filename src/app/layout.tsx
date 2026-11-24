import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baseline — Construction Job Costing & Crew Scheduling",
  description:
    "Track job budgets vs. actual spend, log costs and crew hours, and schedule the crew week by week.",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
        <header className="bg-slate-900 shadow">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Baseline
              </span>
              <span className="hidden text-xs font-medium uppercase tracking-wider text-amber-400 sm:inline">
                Job costing &amp; crew scheduling
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/jobs">Jobs</NavLink>
              <NavLink href="/schedule">Schedule</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500">
            Sample data — the jobs, clients, and crew shown here are fictional
            examples for demonstration, not real client work.
          </p>
        </footer>
      </body>
    </html>
  );
}
