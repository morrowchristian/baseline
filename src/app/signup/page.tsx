import { prisma } from "@/lib/prisma";
import { SignUpForm } from "@/components/auth-forms";

export default async function SignUpPage() {
  // Crew members not already linked to an account, for the optional
  // "I am (crew member)" dropdown.
  const crew = await prisma.crewMember.findMany({
    where: { user: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  return (
    <div className="py-10">
      <SignUpForm crew={crew} />
    </div>
  );
}
