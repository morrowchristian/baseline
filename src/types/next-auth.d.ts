import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

// Extend the Auth.js session / user / JWT types with the fields our
// Credentials provider puts on them (role + linked crew member).
declare module "next-auth" {
  interface User {
    role: UserRole;
    crewMemberId: number | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      crewMemberId: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    crewMemberId: number | null;
  }
}
