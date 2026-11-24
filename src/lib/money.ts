// Money / totals. All money math happens on plain numbers: Prisma Decimals
// are converted with .toNumber() right after fetching, so nothing
// Decimal-shaped ever crosses into a client component.

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUSD0(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export type CostEntryLike = { amount: number; category: string };
export type TimeLogLike = { hours: number; hourlyRate: number | null };

export type JobTotals = {
  /** Sum of cost entries (all categories). */
  directCosts: number;
  /** Sum of time-log hours x the crew member's hourly rate (0 when unset). */
  laborCost: number;
  /** directCosts + laborCost */
  totalSpent: number;
  budget: number;
  remaining: number;
  overBudget: boolean;
  byCategory: { category: string; amount: number }[];
};

/** Labor cost from time logs: hours x hourly rate, 0 when no rate is set. */
export function laborCost(logs: TimeLogLike[]): number {
  return logs.reduce(
    (sum, l) => sum + l.hours * (l.hourlyRate ?? 0),
    0,
  );
}

export function computeJobTotals(
  budget: number,
  entries: CostEntryLike[],
  logs: TimeLogLike[],
): JobTotals {
  const directCosts = entries.reduce((s, e) => s + e.amount, 0);
  const labor = laborCost(logs);
  const totalSpent = directCosts + labor;
  const byCategoryMap = new Map<string, number>();
  for (const e of entries) {
    byCategoryMap.set(e.category, (byCategoryMap.get(e.category) ?? 0) + e.amount);
  }
  const byCategory = [...byCategoryMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  return {
    directCosts,
    laborCost: labor,
    totalSpent,
    budget,
    remaining: budget - totalSpent,
    overBudget: totalSpent > budget,
    byCategory,
  };
}
