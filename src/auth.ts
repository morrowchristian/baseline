import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

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
