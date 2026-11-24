-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'PROJECT_MANAGER', 'CREW', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CREW',
    "crewMemberId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_crewMemberId_key" ON "User"("crewMemberId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "CrewMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
