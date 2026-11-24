// Next.js 16 renamed `middleware` to `proxy`. Auth.js v5's `auth` works as
// the proxy function; its `authorized` callback (in src/auth.ts) is what
// redirects unauthenticated visitors to /signin.
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
