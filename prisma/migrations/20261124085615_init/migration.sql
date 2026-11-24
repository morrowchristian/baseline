-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('planned', 'active', 'complete');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('Labor', 'Materials', 'Equipment', 'Subcontractor', 'Other');

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "jobSiteAddress" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'planned',
    "budget" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostEntry" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "category" "CostCategory" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "hourlyRate" DECIMAL(65,30),

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" SERIAL NOT NULL,
    "crewMemberId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(65,30) NOT NULL,
    "task" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleAssignment" (
    "id" SERIAL NOT NULL,
    "crewMemberId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostEntry_jobId_date_idx" ON "CostEntry"("jobId", "date");

-- CreateIndex
CREATE INDEX "TimeLog_jobId_date_idx" ON "TimeLog"("jobId", "date");

-- CreateIndex
CREATE INDEX "TimeLog_crewMemberId_date_idx" ON "TimeLog"("crewMemberId", "date");

-- CreateIndex
CREATE INDEX "ScheduleAssignment_date_idx" ON "ScheduleAssignment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleAssignment_crewMemberId_date_key" ON "ScheduleAssignment"("crewMemberId", "date");

-- AddForeignKey
ALTER TABLE "CostEntry" ADD CONSTRAINT "CostEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "CrewMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "CrewMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

