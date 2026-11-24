"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type AuthState } from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600";
const labelCls = "block text-sm font-medium text-slate-700";
const btnCls =
  "w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50";

function FormError({ state }: { state: AuthState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.error}
    </p>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, null);
  return (
    <AuthCard title="Sign in to Baseline" subtitle="Job costing & crew scheduling.">
      <form action={action} className="space-y-4">
        <FormError state={state} />
        <div>
          <label htmlFor="signin-email" className={labelCls}>
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputCls}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="signin-password" className={labelCls}>
            Password
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputCls}
          />
        </div>
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-amber-700 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export function SignUpForm({
  crew,
}: {
  crew: { id: number; name: string; role: string }[];
}) {
  const [state, action, pending] = useActionState(signUpAction, null);
  return (
    <AuthCard
      title="Create your account"
      subtitle="The first account becomes the Owner. Everyone after that signs up as a crew member."
    >
      <form action={action} className="space-y-4">
        <FormError state={state} />
        <div>
          <label htmlFor="signup-name" className={labelCls}>
            Name
          </label>
          <input
            id="signup-name"
            name="name"
            required
            autoComplete="name"
            className={inputCls}
            placeholder="e.g. Jordan Lee"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className={labelCls}>
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputCls}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className={labelCls}>
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="signup-crew" className={labelCls}>
            I am (crew member) — optional
          </label>
          <select
            id="signup-crew"
            name="crewMemberId"
            className={inputCls}
            defaultValue=""
          >
            <option value="">Not a crew member / link later</option>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Link your account to your crew record so you see your own schedule
            and hours. The Owner can also link it later.
          </p>
        </div>
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-amber-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
