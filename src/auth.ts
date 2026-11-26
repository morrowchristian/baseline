import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// The shared demo account. One-click demo sign-in (the "demo" provider
// below) signs a visitor in as this user — no account creation, no
// password. It is always role OWNER and never linked to a crew member, so
// the demo sees everything and never hides anyone from the sign-up
// dropdown (which lists crew with user: null).
export const DEMO_EMAIL = "demo@baseline.app";
const DEMO_NAME = "Demo";

// Auth.js v5 (next-auth@beta) with a Credentials provider and JWT sessions.
// No database adapter — users live in our own Prisma User model; the JWT
// carries the role and linked crew member so the proxy and pages can gate
// by role without a database round-trip on every request.
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          crewMemberId: user.crewMemberId ?? null,
        };
      },
    }),
    // Demo sign-in — a second Credentials provider with no password.
    // Its authorize() get-or-creates the shared demo account and returns
    // it, so `signIn("demo")` from the demo server action signs the
    // visitor straight in. No password is ever involved: the demo never
    // signs in through the "credentials" provider, so the passwordHash
    // stored for the demo row is a hash of a random value nobody knows
    // and nobody can use (any password tried against it via the sign-in
    // form simply fails bcrypt.compare). The demo is just another
    // signed-in user — every role check and permission still applies to
    // it. The demo account shares the seed data with every other visitor,
    // so demo edits are visible to everyone (no per-visitor isolation).
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      async authorize() {
        const passwordHash = await bcrypt.hash(randomUUID(), 10);
        const user = await prisma.user.upsert({
          where: { email: DEMO_EMAIL },
          update: {
            name: DEMO_NAME,
            role: "OWNER",
            crewMemberId: null,
          },
          create: {
            name: DEMO_NAME,
            email: DEMO_EMAIL,
            passwordHash,
            role: "OWNER",
            crewMemberId: null,
          },
        });
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          crewMemberId: user.crewMemberId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is the object returned by authorize — persist
      // the role and linked crew member onto the JWT.
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.crewMemberId =
          (user as { crewMemberId: number | null }).crewMemberId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
        session.user.crewMemberId = (token.crewMemberId as number | null) ?? null;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const pathname = nextUrl.pathname;
      // Public pages.
      if (pathname === "/signin" || pathname === "/signup") return true;
      if (pathname.startsWith("/api/auth")) return true;
      // Everything else requires a signed-in user. Returning false sends
      // the browser to pages.signIn (/signin).
      return isLoggedIn;
    },
  },
});
