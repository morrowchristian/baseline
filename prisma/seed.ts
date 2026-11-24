// Sample data for local dev / first run. Clearly sample construction jobs —
// NOT real client data. Dates are relative to today so the schedule week
// always shows assignments on first run.
import { CostCategory, JobStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { addDays, startOfWeekMonday } from "../src/lib/dates";

function daysAgo(n: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n));
}

async function main() {
  await prisma.scheduleAssignment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.costEntry.deleteMany();
  await prisma.job.deleteMany();
  await prisma.crewMember.deleteMany();

  const crew = await Promise.all(
    [
      { name: "Marcus Webb", role: "Foreman", hourlyRate: 42 },
      { name: "Dana Reyes", role: "Carpenter", hourlyRate: 32 },
      { name: "Tom Alvarez", role: "Electrician", hourlyRate: 38 },
      { name: "Priya Nair", role: "Carpenter", hourlyRate: 30 },
      { name: "Chris Doyle", role: "Laborer", hourlyRate: 22 },
      { name: "Sam Okafor", role: "Apprentice", hourlyRate: null },
    ].map((c) => prisma.crewMember.create({ data: c })),
  );
  const byName = Object.fromEntries(crew.map((c) => [c.name, c]));

  const jobs = await Promise.all(
    [
      {
        name: "Maple Street Kitchen Remodel",
        client: "Harper Family",
        jobSiteAddress: "1847 Maple St, Cleveland, TN",
        status: JobStatus.active,
        budget: 48000,
      },
      {
        name: "Riverside Office Build-Out",
        client: "Riverside Dental Group",
        jobSiteAddress: "2200 Riverside Dr, Cleveland, TN",
        status: JobStatus.active,
        budget: 125000,
      },
      {
        name: "Oak Grove Deck & Pergola",
        client: "Nguyen Family",
        jobSiteAddress: "58 Oak Grove Ln, Cleveland, TN",
        status: JobStatus.planned,
        budget: 18500,
      },
      {
        name: "Cedar Lane Roof Replacement",
        client: "Patel Family",
        jobSiteAddress: "12 Cedar Ln, Cleveland, TN",
        status: JobStatus.complete,
        budget: 22000,
      },
      {
        name: "Downtown Café Renovation",
        client: "Bluebird Café LLC",
        jobSiteAddress: "410 Main St E, Cleveland, TN",
        status: JobStatus.active,
        budget: 86000,
      },
    ].map((j) => prisma.job.create({ data: j })),
  );
  const byJob = Object.fromEntries(jobs.map((j) => [j.name, j]));

  type Cost = { job: string; category: CostCategory; amount: number; daysAgo: number; description: string; vendor?: string };
  const costs: Cost[] = [
    // Maple Street Kitchen Remodel
    { job: "Maple Street Kitchen Remodel", category: CostCategory.Materials, amount: 9400, daysAgo: 12, description: "Cabinet order — deposit", vendor: "Cleveland Lumber Co." },
    { job: "Maple Street Kitchen Remodel", category: CostCategory.Labor, amount: 3200, daysAgo: 10, description: "Demo crew — 2 days", vendor: "Volunteer Demo LLC" },
    { job: "Maple Street Kitchen Remodel", category: CostCategory.Materials, amount: 2850, daysAgo: 7, description: "Tile & fixtures", vendor: "Ferguson" },
    { job: "Maple Street Kitchen Remodel", category: CostCategory.Equipment, amount: 640, daysAgo: 9, description: "Dumpster rental — 20 yd", vendor: "Waste Connections" },
    { job: "Maple Street Kitchen Remodel", category: CostCategory.Subcontractor, amount: 4500, daysAgo: 5, description: "Plumbing rough-in", vendor: "FlowRight Plumbing" },
    // Riverside Office Build-Out
    { job: "Riverside Office Build-Out", category: CostCategory.Materials, amount: 18200, daysAgo: 18, description: "Drywall & framing package", vendor: "ABC Supply" },
    { job: "Riverside Office Build-Out", category: CostCategory.Materials, amount: 12750, daysAgo: 14, description: "LVT flooring — 3,200 sq ft", vendor: "Cleveland Flooring" },
    { job: "Riverside Office Build-Out", category: CostCategory.Subcontractor, amount: 21000, daysAgo: 11, description: "HVAC install — 2 zones", vendor: "AirPro Mechanical" },
    { job: "Riverside Office Build-Out", category: CostCategory.Equipment, amount: 3100, daysAgo: 8, description: "Scissor lift rental — 2 weeks", vendor: "United Rentals" },
    { job: "Riverside Office Build-Out", category: CostCategory.Labor, amount: 2400, daysAgo: 6, description: "Temp labor — cleanup & punch list", vendor: "Labor Ready" },
    { job: "Riverside Office Build-Out", category: CostCategory.Other, amount: 850, daysAgo: 20, description: "Building permit", vendor: "City of Cleveland" },
    // Oak Grove Deck & Pergola
    { job: "Oak Grove Deck & Pergola", category: CostCategory.Materials, amount: 1200, daysAgo: 3, description: "Lumber deposit — pressure-treated", vendor: "Cleveland Lumber Co." },
    // Cedar Lane Roof Replacement
    { job: "Cedar Lane Roof Replacement", category: CostCategory.Materials, amount: 8900, daysAgo: 16, description: "Architectural shingles — 28 sq", vendor: "ABC Supply" },
    { job: "Cedar Lane Roof Replacement", category: CostCategory.Subcontractor, amount: 7500, daysAgo: 15, description: "Roofing crew — tear-off & install", vendor: "Summit Roofing" },
    { job: "Cedar Lane Roof Replacement", category: CostCategory.Equipment, amount: 900, daysAgo: 15, description: "Dumpster rental — roofing", vendor: "Waste Connections" },
    { job: "Cedar Lane Roof Replacement", category: CostCategory.Other, amount: 320, daysAgo: 21, description: "Roofing permit", vendor: "City of Cleveland" },
    // Downtown Café Renovation — intentionally over budget in the sample data
    { job: "Downtown Café Renovation", category: CostCategory.Materials, amount: 24600, daysAgo: 19, description: "Millwork & counters", vendor: "Custom Millwork TN" },
    { job: "Downtown Café Renovation", category: CostCategory.Materials, amount: 11300, daysAgo: 13, description: "Floor & wall tile", vendor: "Ferguson" },
    { job: "Downtown Café Renovation", category: CostCategory.Subcontractor, amount: 18900, daysAgo: 9, description: "Electrical — panel & lighting", vendor: "BrightSpark Electric" },
    { job: "Downtown Café Renovation", category: CostCategory.Subcontractor, amount: 14200, daysAgo: 8, description: "Plumbing — grease trap & lines", vendor: "FlowRight Plumbing" },
    { job: "Downtown Café Renovation", category: CostCategory.Equipment, amount: 2800, daysAgo: 7, description: "Scaffolding rental", vendor: "United Rentals" },
    { job: "Downtown Café Renovation", category: CostCategory.Labor, amount: 6400, daysAgo: 12, description: "Demo crew — 3 days", vendor: "Volunteer Demo LLC" },
    { job: "Downtown Café Renovation", category: CostCategory.Materials, amount: 9750, daysAgo: 4, description: "Lighting & fixtures", vendor: "Ferguson" },
    { job: "Downtown Café Renovation", category: CostCategory.Other, amount: 1100, daysAgo: 21, description: "Building permit", vendor: "City of Cleveland" },
  ];
  await Promise.all(
    costs.map((c) =>
      prisma.costEntry.create({
        data: {
          jobId: byJob[c.job].id,
          category: c.category,
          amount: c.amount,
          date: daysAgo(c.daysAgo),
          description: c.description,
          vendor: c.vendor,
        },
      }),
    ),
  );

  type Log = { crew: string; job: string; daysAgo: number; hours: number; task: string };
  const logs: Log[] = [
    { crew: "Dana Reyes", job: "Maple Street Kitchen Remodel", daysAgo: 3, hours: 8, task: "Framing — kitchen walls" },
    { crew: "Dana Reyes", job: "Maple Street Kitchen Remodel", daysAgo: 2, hours: 8, task: "Cabinet blocking & layout" },
    { crew: "Dana Reyes", job: "Maple Street Kitchen Remodel", daysAgo: 1, hours: 8, task: "Subfloor prep" },
    { crew: "Tom Alvarez", job: "Maple Street Kitchen Remodel", daysAgo: 4, hours: 6, task: "Rough-in — outlets & lighting" },
    { crew: "Tom Alvarez", job: "Maple Street Kitchen Remodel", daysAgo: 2, hours: 6, task: "Panel labeling & circuits" },
    { crew: "Chris Doyle", job: "Maple Street Kitchen Remodel", daysAgo: 3, hours: 8, task: "Demo haul-out & site cleanup" },
    { crew: "Chris Doyle", job: "Maple Street Kitchen Remodel", daysAgo: 2, hours: 8, task: "Material staging" },
    { crew: "Chris Doyle", job: "Maple Street Kitchen Remodel", daysAgo: 1, hours: 8, task: "Site cleanup" },
    { crew: "Chris Doyle", job: "Maple Street Kitchen Remodel", daysAgo: 1, hours: 6, task: "Dump runs" },
    { crew: "Marcus Webb", job: "Riverside Office Build-Out", daysAgo: 5, hours: 8, task: "Framing inspection & layout" },
    { crew: "Marcus Webb", job: "Riverside Office Build-Out", daysAgo: 4, hours: 8, task: "Drywall walkthrough" },
    { crew: "Marcus Webb", job: "Riverside Office Build-Out", daysAgo: 3, hours: 8, task: "HVAC coordination" },
    { crew: "Marcus Webb", job: "Riverside Office Build-Out", daysAgo: 2, hours: 8, task: "Flooring layout" },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", daysAgo: 5, hours: 8, task: "Framing — office partitions" },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", daysAgo: 4, hours: 8, task: "Framing — conference room" },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", daysAgo: 3, hours: 8, task: "Door hanging" },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", daysAgo: 2, hours: 8, task: "Trim — reception" },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", daysAgo: 1, hours: 8, task: "Trim — offices" },
    { crew: "Priya Nair", job: "Riverside Office Build-Out", daysAgo: 4, hours: 8, task: "Drywall finishing" },
    { crew: "Priya Nair", job: "Riverside Office Build-Out", daysAgo: 3, hours: 8, task: "Drywall finishing" },
    { crew: "Priya Nair", job: "Riverside Office Build-Out", daysAgo: 2, hours: 8, task: "Paint prep" },
    { crew: "Priya Nair", job: "Riverside Office Build-Out", daysAgo: 1, hours: 4, task: "Paint — touch-ups" },
    { crew: "Sam Okafor", job: "Riverside Office Build-Out", daysAgo: 3, hours: 8, task: "Cleanup & material runs" },
    { crew: "Sam Okafor", job: "Riverside Office Build-Out", daysAgo: 2, hours: 8, task: "Cleanup & material runs" },
    { crew: "Chris Doyle", job: "Cedar Lane Roof Replacement", daysAgo: 14, hours: 8, task: "Tear-off support & cleanup" },
    { crew: "Chris Doyle", job: "Cedar Lane Roof Replacement", daysAgo: 13, hours: 8, task: "Tear-off support & cleanup" },
    { crew: "Chris Doyle", job: "Cedar Lane Roof Replacement", daysAgo: 12, hours: 8, task: "Site cleanup & magnet sweep" },
    { crew: "Marcus Webb", job: "Cedar Lane Roof Replacement", daysAgo: 13, hours: 8, task: "Roof inspection & flashing check" },
    { crew: "Marcus Webb", job: "Downtown Café Renovation", daysAgo: 6, hours: 8, task: "Millwork install oversight" },
    { crew: "Marcus Webb", job: "Downtown Café Renovation", daysAgo: 5, hours: 8, task: "Electrical walkthrough" },
    { crew: "Marcus Webb", job: "Downtown Café Renovation", daysAgo: 2, hours: 8, task: "Punch list" },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", daysAgo: 7, hours: 8, task: "Panel upgrade" },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", daysAgo: 6, hours: 8, task: "Lighting rough-in" },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", daysAgo: 5, hours: 8, task: "Fixture install" },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", daysAgo: 3, hours: 8, task: "Trim-out & testing" },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", daysAgo: 1, hours: 4, task: "Final testing" },
    { crew: "Dana Reyes", job: "Downtown Café Renovation", daysAgo: 6, hours: 8, task: "Tile — back wall" },
    { crew: "Dana Reyes", job: "Downtown Café Renovation", daysAgo: 5, hours: 8, task: "Tile — floor" },
    { crew: "Dana Reyes", job: "Downtown Café Renovation", daysAgo: 4, hours: 8, task: "Trim — bar area" },
    { crew: "Dana Reyes", job: "Downtown Café Renovation", daysAgo: 2, hours: 6, task: "Touch-ups" },
    { crew: "Priya Nair", job: "Downtown Café Renovation", daysAgo: 5, hours: 8, task: "Counter install" },
    { crew: "Priya Nair", job: "Downtown Café Renovation", daysAgo: 4, hours: 8, task: "Counter install" },
    { crew: "Priya Nair", job: "Downtown Café Renovation", daysAgo: 1, hours: 4, task: "Hardware install" },
    { crew: "Chris Doyle", job: "Downtown Café Renovation", daysAgo: 6, hours: 8, task: "Demo haul-out" },
    { crew: "Chris Doyle", job: "Downtown Café Renovation", daysAgo: 3, hours: 8, task: "Site cleanup" },
  ];
  await Promise.all(
    logs.map((l) =>
      prisma.timeLog.create({
        data: {
          crewMemberId: byName[l.crew].id,
          jobId: byJob[l.job].id,
          date: daysAgo(l.daysAgo),
          hours: l.hours,
          task: l.task,
        },
      }),
    ),
  );

  // This week's crew schedule (Mon–Sun, relative to today).
  const monday = startOfWeekMonday(new Date());
  type Assign = { crew: string; job: string; day: number };
  const assignments: Assign[] = [
    { crew: "Marcus Webb", job: "Riverside Office Build-Out", day: 0 },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", day: 0 },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", day: 0 },
    { crew: "Chris Doyle", job: "Maple Street Kitchen Remodel", day: 0 },
    { crew: "Marcus Webb", job: "Downtown Café Renovation", day: 1 },
    { crew: "Dana Reyes", job: "Maple Street Kitchen Remodel", day: 1 },
    { crew: "Priya Nair", job: "Riverside Office Build-Out", day: 1 },
    { crew: "Sam Okafor", job: "Riverside Office Build-Out", day: 1 },
    { crew: "Tom Alvarez", job: "Downtown Café Renovation", day: 2 },
    { crew: "Dana Reyes", job: "Maple Street Kitchen Remodel", day: 2 },
    { crew: "Chris Doyle", job: "Riverside Office Build-Out", day: 2 },
    { crew: "Marcus Webb", job: "Riverside Office Build-Out", day: 2 },
    { crew: "Priya Nair", job: "Maple Street Kitchen Remodel", day: 3 },
    { crew: "Sam Okafor", job: "Downtown Café Renovation", day: 3 },
    { crew: "Marcus Webb", job: "Downtown Café Renovation", day: 4 },
    { crew: "Tom Alvarez", job: "Maple Street Kitchen Remodel", day: 4 },
    { crew: "Dana Reyes", job: "Riverside Office Build-Out", day: 4 },
    { crew: "Chris Doyle", job: "Downtown Café Renovation", day: 4 },
    { crew: "Sam Okafor", job: "Oak Grove Deck & Pergola", day: 5 },
    { crew: "Priya Nair", job: "Maple Street Kitchen Remodel", day: 5 },
  ];
  await Promise.all(
    assignments.map((a) =>
      prisma.scheduleAssignment.create({
        data: {
          crewMemberId: byName[a.crew].id,
          jobId: byJob[a.job].id,
          date: addDays(monday, a.day),
        },
      }),
    ),
  );

  console.log(
    `Seeded ${crew.length} crew members, ${jobs.length} jobs, ${costs.length} cost entries, ${logs.length} time logs, ${assignments.length} assignments (week of ${monday.toISOString().slice(0, 10)}).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
