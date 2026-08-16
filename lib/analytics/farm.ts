import { SupabaseClient } from "@supabase/supabase-js";

export type FarmAnalytics = {
  overview: {
    totalCows: number;
    activeCows: number;
    pregnantCows: number;
    lactatingCows: number;
  };

  milk: {
    totalLitres: number;
    averageDailyLitres: number;
    averageLitresPerCow: number;
    previousPeriodLitres: number;
    changePercent: number | null;
  };

  finance: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    profitMargin: number | null;
  };

  feed: {
    totalKg: number;
    totalCost: number;
    costPerKg: number | null;
    costPerMilkLitre: number | null;
  };

  health: {
    totalEvents: number;
    totalCost: number;
  };

  breeding: {
    totalEvents: number;
    pregnantCount: number;
    pregnancyRate: number | null;
    upcomingCalvings: number;
    totalCost: number;
  };

  trends: {
    date: string;
    milkLitres: number;
    income: number;
    expenses: number;
    feedCost: number;
  }[];

  expenseBreakdown: {
    category: string;
    amount: number;
  }[];

  incomeBreakdown: {
    category: string;
    amount: number;
  }[];

  warnings: string[];
};

function round(value: number, decimals = 2) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function percentageChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return round(((current - previous) / previous) * 100);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export async function getFarmAnalytics(
  supabase: SupabaseClient,
  farmId: string,
  days = 30
): Promise<FarmAnalytics> {
  const today = startOfDay(new Date());

  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - (days - 1));

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const currentStartDate = dateKey(currentStart);
  const todayDate = dateKey(today);
  const previousStartDate = dateKey(previousStart);
  const previousEndDate = dateKey(previousEnd);

  /*
   * ==========================================================
   * COWS
   * ==========================================================
   */

  const { data: cows, error: cowsError } = await supabase
    .from("cows")
    .select(
      `
        id,
        status,
        pregnancy_status
      `
    )
    .eq("farm_id", farmId);

  if (cowsError) {
    throw new Error(`Unable to load cows: ${cowsError.message}`);
  }

  const safeCows = cows ?? [];

  const totalCows = safeCows.length;

  const activeCows = safeCows.filter(
    (cow) =>
      cow.status?.toLowerCase() === "active"
  ).length;

  const pregnantCows = safeCows.filter(
    (cow) =>
      cow.pregnancy_status?.toLowerCase() ===
      "pregnant"
  ).length;

  /*
   * Lactating cows are derived from cows that
   * have milk records in the selected period.
   */

  const { data: milkRecords, error: milkError } =
    await supabase
      .from("milk_records")
      .select(
        `
          cow_id,
          record_date,
          morning_litres,
          evening_litres,
          total_litres
        `
      )
      .eq("farm_id", farmId)
      .gte("record_date", currentStartDate)
      .lte("record_date", todayDate);

  if (milkError) {
    throw new Error(
      `Unable to load milk records: ${milkError.message}`
    );
  }

  const safeMilkRecords = milkRecords ?? [];

  const lactatingCowIds = new Set(
    safeMilkRecords.map(
      (record) => record.cow_id
    )
  );

  const lactatingCows =
    lactatingCowIds.size;

  /*
   * ==========================================================
   * MILK
   * ==========================================================
   */

  const totalMilk = safeMilkRecords.reduce(
    (sum, record) => {
      const value =
        record.total_litres ??
        (record.morning_litres ?? 0) +
          (record.evening_litres ?? 0);

      return sum + Number(value || 0);
    },
    0
  );

  const averageDailyLitres =
    totalMilk / days;

  const averageLitresPerCow =
    lactatingCows > 0
      ? averageDailyLitres / lactatingCows
      : 0;

  /*
   * Previous period milk
   */

  const { data: previousMilkRecords } =
    await supabase
      .from("milk_records")
      .select(
        `
          morning_litres,
          evening_litres,
          total_litres
        `
      )
      .eq("farm_id", farmId)
      .gte(
        "record_date",
        previousStartDate
      )
      .lte(
        "record_date",
        previousEndDate
      );

  const previousMilk =
    previousMilkRecords?.reduce(
      (sum, record) => {
        const value =
          record.total_litres ??
          (record.morning_litres ?? 0) +
            (record.evening_litres ?? 0);

        return sum + Number(value || 0);
      },
      0
    ) ?? 0;

  /*
   * ==========================================================
   * FINANCE
   * ==========================================================
   */

  const { data: incomeRecords } =
    await supabase
      .from("income")
      .select(
        `
          income_date,
          category,
          amount_ksh
        `
      )
      .eq("farm_id", farmId)
      .gte("income_date", currentStartDate)
      .lte("income_date", todayDate);

  const { data: expenseRecords } =
    await supabase
      .from("expenses")
      .select(
        `
          expense_date,
          category,
          amount_ksh
        `
      )
      .eq("farm_id", farmId)
      .gte("expense_date", currentStartDate)
      .lte("expense_date", todayDate);

  const safeIncome = incomeRecords ?? [];
  const safeExpenses = expenseRecords ?? [];

  const totalIncome = safeIncome.reduce(
    (sum, record) =>
      sum + Number(record.amount_ksh || 0),
    0
  );

  const totalExpenses = safeExpenses.reduce(
    (sum, record) =>
      sum + Number(record.amount_ksh || 0),
    0
  );

  const netIncome =
    totalIncome - totalExpenses;

  const profitMargin =
    totalIncome > 0
      ? round(
          (netIncome / totalIncome) * 100
        )
      : null;

  /*
   * ==========================================================
   * FEED
   * ==========================================================
   */

  const { data: feedRecords } =
    await supabase
      .from("feed_records")
      .select(
        `
          feed_date,
          quantity_kg,
          cost_ksh
        `
      )
      .eq("farm_id", farmId)
      .gte("feed_date", currentStartDate)
      .lte("feed_date", todayDate);

  const safeFeed = feedRecords ?? [];

  const totalFeedKg = safeFeed.reduce(
    (sum, record) =>
      sum + Number(record.quantity_kg || 0),
    0
  );

  const totalFeedCost = safeFeed.reduce(
    (sum, record) =>
      sum + Number(record.cost_ksh || 0),
    0
  );

  const costPerKg =
    totalFeedKg > 0
      ? totalFeedCost / totalFeedKg
      : null;

  const costPerMilkLitre =
    totalMilk > 0
      ? totalFeedCost / totalMilk
      : null;

  /*
   * ==========================================================
   * HEALTH
   * ==========================================================
   */

  const cowIds = safeCows.map(
    (cow) => cow.id
  );

  let healthRecords: {
    event_date: string;
    cost_ksh: number | null;
  }[] = [];

  if (cowIds.length > 0) {
    const { data } = await supabase
      .from("health_records")
      .select(
        `
          event_date,
          cost_ksh
        `
      )
      .in("cow_id", cowIds)
      .gte(
        "event_date",
        currentStartDate
      )
      .lte(
        "event_date",
        todayDate
      );

    healthRecords = data ?? [];
  }

  const healthEvents =
    healthRecords.length;

  const healthCost =
    healthRecords.reduce(
      (sum, record) =>
        sum + Number(record.cost_ksh || 0),
      0
    );

  /*
   * ==========================================================
   * BREEDING
   * ==========================================================
   */

  let breedingRecords: {
    breeding_date: string;
    pregnancy_status: string | null;
    outcome: string | null;
    expected_calving_date: string | null;
    cost_ksh: number | null;
  }[] = [];

  if (cowIds.length > 0) {
    const { data } = await supabase
      .from("breeding_records")
      .select(
        `
          breeding_date,
          pregnancy_status,
          outcome,
          expected_calving_date,
          cost_ksh
        `
      )
      .in("cow_id", cowIds)
      .gte(
        "breeding_date",
        currentStartDate
      )
      .lte(
        "breeding_date",
        todayDate
      );

    breedingRecords = data ?? [];
  }

  const breedingEvents =
    breedingRecords.length;

  const breedingPregnant =
    breedingRecords.filter(
      (record) =>
        record.pregnancy_status?.toLowerCase() ===
          "pregnant" ||
        record.outcome?.toLowerCase() ===
          "pregnant"
    ).length;

  const pregnancyRate =
    breedingEvents > 0
      ? round(
          (breedingPregnant /
            breedingEvents) *
            100
        )
      : null;

  const upcomingCalvings =
    breedingRecords.filter((record) => {
      if (!record.expected_calving_date) {
        return false;
      }

      const date = new Date(
        record.expected_calving_date
      );

      return date >= today;
    }).length;

  const breedingCost =
    breedingRecords.reduce(
      (sum, record) =>
        sum + Number(record.cost_ksh || 0),
      0
    );

  /*
   * ==========================================================
   * DAILY TRENDS
   * ==========================================================
   */

  const trendMap = new Map<
    string,
    {
      milkLitres: number;
      income: number;
      expenses: number;
      feedCost: number;
    }
  >();

  for (
    let i = 0;
    i < days;
    i++
  ) {
    const date = new Date(
      currentStart
    );

    date.setDate(
      currentStart.getDate() + i
    );

    trendMap.set(dateKey(date), {
      milkLitres: 0,
      income: 0,
      expenses: 0,
      feedCost: 0,
    });
  }

  for (const record of safeMilkRecords) {
    const key = record.record_date;

    const existing =
      trendMap.get(key);

    if (!existing) continue;

    const milk =
      record.total_litres ??
      (record.morning_litres ?? 0) +
        (record.evening_litres ?? 0);

    existing.milkLitres +=
      Number(milk || 0);
  }

  for (const record of safeIncome) {
    const existing =
      trendMap.get(record.income_date);

    if (existing) {
      existing.income += Number(
        record.amount_ksh || 0
      );
    }
  }

  for (const record of safeExpenses) {
    const existing =
      trendMap.get(record.expense_date);

    if (existing) {
      existing.expenses += Number(
        record.amount_ksh || 0
      );
    }
  }

  for (const record of safeFeed) {
    const existing =
      trendMap.get(record.feed_date);

    if (existing) {
      existing.feedCost += Number(
        record.cost_ksh || 0
      );
    }
  }

  const trends = Array.from(
    trendMap.entries()
  ).map(([date, values]) => ({
    date,
    milkLitres: round(
      values.milkLitres
    ),
    income: round(
      values.income
    ),
    expenses: round(
      values.expenses
    ),
    feedCost: round(
      values.feedCost
    ),
  }));

  /*
   * ==========================================================
   * EXPENSE BREAKDOWN
   * ==========================================================
   */

  const expenseMap =
    new Map<string, number>();

  for (const record of safeExpenses) {
    const category =
      record.category ||
      "Other";

    expenseMap.set(
      category,
      (expenseMap.get(category) ?? 0) +
        Number(record.amount_ksh || 0)
    );
  }

  const expenseBreakdown =
    Array.from(
      expenseMap.entries()
    )
      .map(
        ([category, amount]) => ({
          category,
          amount: round(amount),
        })
      )
      .sort(
        (a, b) =>
          b.amount - a.amount
      );

  /*
   * ==========================================================
   * INCOME BREAKDOWN
   * ==========================================================
   */

  const incomeMap =
    new Map<string, number>();

  for (const record of safeIncome) {
    const category =
      record.category ||
      "Other";

    incomeMap.set(
      category,
      (incomeMap.get(category) ?? 0) +
        Number(record.amount_ksh || 0)
    );
  }

  const incomeBreakdown =
    Array.from(
      incomeMap.entries()
    )
      .map(
        ([category, amount]) => ({
          category,
          amount: round(amount),
        })
      )
      .sort(
        (a, b) =>
          b.amount - a.amount
      );

  /*
   * ==========================================================
   * WARNINGS / DATA QUALITY
   * ==========================================================
   */

  const warnings: string[] = [];

  if (totalCows === 0) {
    warnings.push(
      "No cows have been registered yet."
    );
  }

  if (
    totalMilk === 0 &&
    lactatingCows === 0
  ) {
    warnings.push(
      "There are no milk production records for the selected period."
    );
  }

  if (
    breedingEvents > 0 &&
    breedingEvents < 5
  ) {
    warnings.push(
      "Pregnancy performance is based on fewer than 5 breeding records and may not represent the farm's long-term reproductive performance."
    );
  }

  if (
    totalIncome > 0 &&
    totalIncome > 0 &&
    totalExpenses === 0
  ) {
    warnings.push(
      "Income has been recorded but no expenses were recorded during this period."
    );
  }

  if (
    totalIncome > 0 &&
    incomeBreakdown.length === 1 &&
    incomeBreakdown[0].category
      .toLowerCase()
      .includes("cow")
  ) {
    warnings.push(
      "Most recorded income currently comes from livestock sales rather than recurring dairy production."
    );
  }

  return {
    overview: {
      totalCows,
      activeCows,
      pregnantCows,
      lactatingCows,
    },

    milk: {
      totalLitres: round(
        totalMilk
      ),
      averageDailyLitres: round(
        averageDailyLitres
      ),
      averageLitresPerCow: round(
        averageLitresPerCow
      ),
      previousPeriodLitres: round(
        previousMilk
      ),
      changePercent:
        percentageChange(
          totalMilk,
          previousMilk
        ),
    },

    finance: {
      totalIncome: round(
        totalIncome
      ),
      totalExpenses: round(
        totalExpenses
      ),
      netIncome: round(
        netIncome
      ),
      profitMargin,
    },

    feed: {
      totalKg: round(
        totalFeedKg
      ),
      totalCost: round(
        totalFeedCost
      ),
      costPerKg:
        costPerKg === null
          ? null
          : round(costPerKg),
      costPerMilkLitre:
        costPerMilkLitre === null
          ? null
          : round(
              costPerMilkLitre
            ),
    },

    health: {
      totalEvents:
        healthEvents,
      totalCost:
        round(healthCost),
    },

    breeding: {
      totalEvents:
        breedingEvents,
      pregnantCount:
        breedingPregnant,
      pregnancyRate,
      upcomingCalvings,
      totalCost:
        round(breedingCost),
    },

    trends,
    expenseBreakdown,
    incomeBreakdown,
    warnings,
  };
}