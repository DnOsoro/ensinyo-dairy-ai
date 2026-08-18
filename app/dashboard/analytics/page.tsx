import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsCharts from "./AnalyticsCharts";

type Cow = {
  id: string;
  status: string;
  pregnancy_status: string | null;
};

type MilkRecord = {
  record_date: string;
  total_litres: number | null;
};

type FeedRecord = {
  feed_date: string;
  quantity_kg: number;
  cost_ksh: number | null;
};

type ExpenseRecord = {
  expense_date: string;
  category: string;
  amount_ksh: number;
};

type IncomeRecord = {
  income_date: string;
  category: string;
  amount_ksh: number;
};

type HealthRecord = {
  event_date: string;
  event_type: string;
  cost_ksh: number | null;
};

type BreedingRecord = {
  breeding_date: string;
  expected_calving_date: string | null;
  pregnancy_status: string | null;
  actual_calving_date: string | null;
  cost_ksh: number | null;
};

function formatCurrency(value: number) {
  return `KSh ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getNairobiDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDateDaysAgo(days: number) {
  const today = new Date(`${getNairobiDate()}T00:00:00`);

  today.setDate(today.getDate() - days);

  return today.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // ==========================================================
  // 1. AUTHENTICATED USER
  // ==========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // ==========================================================
  // 2. GET FARM
  // ==========================================================

  const { data: farms, error: farmsError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Analytics farm loading error:", farmsError);
  }

  const farm = farms?.[0];

  if (!farm) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Dashboard
          </Link>

          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <div className="text-5xl"></div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Set up your farm first
            </h1>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Analytics will become available once you create your farm
              profile and start recording farm data.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Set Up Farm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const farmId = farm.id;

  // ==========================================================
  // 3. DATE RANGE
  // ==========================================================

  const today = getNairobiDate();

  const start30Days = getDateDaysAgo(29);

  // ==========================================================
  // 4. LOAD COWS
  // ==========================================================

  const { data: cowsData, error: cowsError } = await supabase
    .from("cows")
    .select(`
      id,
      status,
      pregnancy_status
    `)
    .eq("farm_id", farmId);

  if (cowsError) {
    console.error("Analytics cow loading error:", cowsError);
  }

  const cows: Cow[] = cowsData ?? [];

  const cowIds = cows.map((cow) => cow.id);

  // ==========================================================
  // 5. LOAD MILK
  // ==========================================================

  const { data: milkData, error: milkError } = await supabase
    .from("milk_records")
    .select(`
      record_date,
      total_litres
    `)
    .eq("farm_id", farmId)
    .gte("record_date", start30Days)
    .lte("record_date", today)
    .order("record_date", {
      ascending: true,
    });

  if (milkError) {
    console.error("Analytics milk loading error:", milkError);
  }

  const milkRecords: MilkRecord[] = milkData ?? [];

  // ==========================================================
  // 6. LOAD FEED
  // ==========================================================

  const { data: feedData, error: feedError } = await supabase
    .from("feed_records")
    .select(`
      feed_date,
      quantity_kg,
      cost_ksh
    `)
    .eq("farm_id", farmId)
    .gte("feed_date", start30Days)
    .lte("feed_date", today)
    .order("feed_date", {
      ascending: true,
    });

  if (feedError) {
    console.error("Analytics feed loading error:", feedError);
  }

  const feedRecords: FeedRecord[] = feedData ?? [];

  // ==========================================================
  // 7. LOAD EXPENSES
  // ==========================================================

  const { data: expenseData, error: expenseError } = await supabase
    .from("expenses")
    .select(`
      expense_date,
      category,
      amount_ksh
    `)
    .eq("farm_id", farmId)
    .gte("expense_date", start30Days)
    .lte("expense_date", today)
    .order("expense_date", {
      ascending: true,
    });

  if (expenseError) {
    console.error(
      "Analytics expense loading error:",
      expenseError
    );
  }

  const expenseRecords: ExpenseRecord[] = expenseData ?? [];

  // ==========================================================
  // 8. LOAD INCOME
  // ==========================================================

  const { data: incomeData, error: incomeError } = await supabase
    .from("income")
    .select(`
      income_date,
      category,
      amount_ksh
    `)
    .eq("farm_id", farmId)
    .gte("income_date", start30Days)
    .lte("income_date", today)
    .order("income_date", {
      ascending: true,
    });

  if (incomeError) {
    console.error(
      "Analytics income loading error:",
      incomeError
    );
  }

  const incomeRecords: IncomeRecord[] = incomeData ?? [];

  // ==========================================================
  // 9. LOAD HEALTH RECORDS
  // ==========================================================

  let healthRecords: HealthRecord[] = [];

  if (cowIds.length > 0) {
    const { data: healthData, error: healthError } = await supabase
      .from("health_records")
      .select(`
        event_date,
        event_type,
        cost_ksh
      `)
      .in("cow_id", cowIds)
      .gte("event_date", start30Days)
      .lte("event_date", today)
      .order("event_date", {
        ascending: true,
      });

    if (healthError) {
      console.error(
        "Analytics health loading error:",
        healthError
      );
    }

    healthRecords = healthData ?? [];
  }

  // ==========================================================
  // 10. LOAD BREEDING RECORDS
  // ==========================================================

  let breedingRecords: BreedingRecord[] = [];

  if (cowIds.length > 0) {
    const { data: breedingData, error: breedingError } =
      await supabase
        .from("breeding_records")
        .select(`
          breeding_date,
          expected_calving_date,
          pregnancy_status,
          actual_calving_date,
          cost_ksh
        `)
        .in("cow_id", cowIds)
        .order("breeding_date", {
          ascending: false,
        });

    if (breedingError) {
      console.error(
        "Analytics breeding loading error:",
        breedingError
      );
    }

    breedingRecords = breedingData ?? [];
  }

  // ==========================================================
  // 11. FARM KPIs
  // ==========================================================

  const totalCows = cows.length;

  const activeCows = cows.filter(
    (cow) =>
      cow.status?.toLowerCase() === "active" ||
      cow.status?.toLowerCase() === "lactating"
  ).length;

  const pregnantCows = cows.filter(
    (cow) =>
      cow.pregnancy_status?.toLowerCase() === "pregnant"
  ).length;

  // ==========================================================
  // 12. MILK KPIs
  // ==========================================================

  const totalMilk = milkRecords.reduce(
    (sum, record) =>
      sum + Number(record.total_litres ?? 0),
    0
  );

  const averageDailyMilk =
    milkRecords.length > 0
      ? totalMilk /
        new Set(
          milkRecords.map(
            (record) => record.record_date
          )
        ).size
      : 0;

  // ==========================================================
  // 13. FEED KPIs
  // ==========================================================

  const totalFeed = feedRecords.reduce(
    (sum, record) =>
      sum + Number(record.quantity_kg ?? 0),
    0
  );

  const totalFeedCost = feedRecords.reduce(
    (sum, record) =>
      sum + Number(record.cost_ksh ?? 0),
    0
  );

  const feedCostPerKg =
    totalFeed > 0
      ? totalFeedCost / totalFeed
      : 0;

  // ==========================================================
  // 14. FINANCIAL KPIs
  // ==========================================================

  const totalIncome = incomeRecords.reduce(
    (sum, record) =>
      sum + Number(record.amount_ksh ?? 0),
    0
  );

  const totalExpenses = expenseRecords.reduce(
    (sum, record) =>
      sum + Number(record.amount_ksh ?? 0),
    0
  );

  const netIncome =
    totalIncome - totalExpenses;

  const profitMargin =
    totalIncome > 0
      ? (netIncome / totalIncome) * 100
      : 0;

  // ==========================================================
  // 15. HEALTH KPIs
  // ==========================================================

  const healthEventCount =
    healthRecords.length;

  const healthCost = healthRecords.reduce(
    (sum, record) =>
      sum + Number(record.cost_ksh ?? 0),
    0
  );

  // ==========================================================
  // 16. BREEDING KPIs
  // ==========================================================

  const breedingEventCount =
    breedingRecords.length;

  const upcomingCalvings =
    breedingRecords.filter((record) => {
      if (!record.expected_calving_date) {
        return false;
      }

      if (record.actual_calving_date) {
        return false;
      }

      return (
        record.expected_calving_date >= today
      );
    }).length;

  const breedingCost =
    breedingRecords.reduce(
      (sum, record) =>
        sum + Number(record.cost_ksh ?? 0),
      0
    );

  // ==========================================================
  // 17. CATEGORY BREAKDOWNS
  // ==========================================================

  const expenseByCategory: Record<string, number> = {};

  for (const expense of expenseRecords) {
    const category =
      expense.category || "Other";

    expenseByCategory[category] =
      (expenseByCategory[category] ?? 0) +
      Number(expense.amount_ksh ?? 0);
  }

  const incomeByCategory: Record<string, number> = {};

  for (const income of incomeRecords) {
    const category =
      income.category || "Other";

    incomeByCategory[category] =
      (incomeByCategory[category] ?? 0) +
      Number(income.amount_ksh ?? 0);
  }

  // ==========================================================
  // 18. BUILD 30-DAY CHART DATA
  // ==========================================================

  const chartData = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(
      `${start30Days}T00:00:00`
    );

    date.setDate(
      date.getDate() + i
    );

    const dateKey =
      date.toISOString().slice(0, 10);

    const milk =
      milkRecords
        .filter(
          (record) =>
            record.record_date === dateKey
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(
              record.total_litres ?? 0
            ),
          0
        );

    const income =
      incomeRecords
        .filter(
          (record) =>
            record.income_date === dateKey
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(
              record.amount_ksh ?? 0
            ),
          0
        );

    const expenses =
      expenseRecords
        .filter(
          (record) =>
            record.expense_date === dateKey
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(
              record.amount_ksh ?? 0
            ),
          0
        );

    const feedCost =
      feedRecords
        .filter(
          (record) =>
            record.feed_date === dateKey
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(
              record.cost_ksh ?? 0
            ),
          0
        );

    chartData.push({
      date: dateKey,
      milk,
      income,
      expenses,
      feedCost,
    });
  }

  // ==========================================================
  // 19. RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Farm Analytics 
            </h1>

            <p className="mt-1 text-gray-600">
              Understand your farm performance using your recorded data.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-500">
              Farm
            </p>

            <p className="font-semibold text-gray-900">
              {farm.farm_name}
            </p>
          </div>

        </div>

        {/* OVERVIEW */}

        <section className="mt-8">

          <h2 className="text-xl font-bold text-gray-900">
            Farm Overview
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Performance for the last 30 days.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Total Cows"
              value={formatNumber(totalCows)}
              icon=""
            />

            <MetricCard
              label="Active Cows"
              value={formatNumber(activeCows)}
              icon=""
            />

            <MetricCard
              label="Pregnant Cows"
              value={formatNumber(pregnantCows)}
              icon=""
            />

            <MetricCard
              label="Milk Produced"
              value={`${formatNumber(
                totalMilk,
                1
              )} L`}
              icon=""
            />

          </div>

        </section>

        {/* FINANCIAL */}

        <section className="mt-10">

          <h2 className="text-xl font-bold text-gray-900">
            Financial Performance
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Income, expenses and profitability over the last 30 days.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Income"
              value={formatCurrency(totalIncome)}
              icon=""
            />

            <MetricCard
              label="Expenses"
              value={formatCurrency(totalExpenses)}
              icon=""
            />

            <MetricCard
              label="Net Income"
              value={formatCurrency(netIncome)}
              icon={netIncome >= 0 ? "" : ""}
              positive={netIncome >= 0}
            />

            <MetricCard
              label="Profit Margin"
              value={`${formatNumber(
                profitMargin,
                1
              )}%`}
              icon=""
              positive={profitMargin >= 0}
            />

          </div>

        </section>

        {/* CHARTS */}

        <section className="mt-10">

          <h2 className="text-xl font-bold text-gray-900">
            Farm Trends
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Track how production and finances are changing over time.
          </p>

          <div className="mt-5">
            <AnalyticsCharts
              chartData={chartData}
              expenseByCategory={expenseByCategory}
              incomeByCategory={incomeByCategory}
            />
          </div>

        </section>

        {/* OPERATIONS */}

        <section className="mt-10">

          <h2 className="text-xl font-bold text-gray-900">
            Farm Operations
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Feed Used"
              value={`${formatNumber(
                totalFeed,
                1
              )} kg`}
              icon=""
            />

            <MetricCard
              label="Feed Cost"
              value={formatCurrency(
                totalFeedCost
              )}
              icon=""
            />

            <MetricCard
              label="Feed Cost / Kg"
              value={formatCurrency(
                feedCostPerKg
              )}
              icon=""
            />

            <MetricCard
              label="Health Events"
              value={formatNumber(
                healthEventCount
              )}
              icon=""
            />

          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Health Costs"
              value={formatCurrency(
                healthCost
              )}
              icon=""
            />

            <MetricCard
              label="Breeding Events"
              value={formatNumber(
                breedingEventCount
              )}
              icon=""
            />

            <MetricCard
              label="Upcoming Calvings"
              value={formatNumber(
                upcomingCalvings
              )}
              icon=""
            />

            <MetricCard
              label="Breeding Costs"
              value={formatCurrency(
                breedingCost
              )}
              icon=""
            />

          </div>

        </section>

        {/* PRODUCTION EFFICIENCY */}

        <section className="mt-10">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <h2 className="text-xl font-bold text-gray-900">
              Production Efficiency
            </h2>

            <div className="mt-5 grid gap-6 md:grid-cols-3">

              <InsightItem
                label="Average Daily Milk"
                value={`${formatNumber(
                  averageDailyMilk,
                  1
                )} L`}
              />

              <InsightItem
                label="Pregnancy Rate"
                value={
                  totalCows > 0
                    ? `${formatNumber(
                        (pregnantCows /
                          totalCows) *
                          100,
                        1
                      )}%`
                    : "0%"
                }
              />

              <InsightItem
                label="Feed Cost / Milk Litre"
                value={
                  totalMilk > 0
                    ? formatCurrency(
                        totalFeedCost /
                          totalMilk
                      )
                    : "KSh 0"
                }
              />

            </div>

          </div>

        </section>

        {/* EMPTY DATA NOTICE */}

        {totalCows === 0 &&
          milkRecords.length === 0 &&
          incomeRecords.length === 0 &&
          expenseRecords.length === 0 && (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">

              <div className="text-4xl">
                
              </div>

              <h3 className="mt-3 text-lg font-bold text-gray-900">
                Start recording farm data
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
                Your analytics dashboard becomes more useful as you
                record cows, milk production, feed, expenses, income,
                health and breeding activities.
              </p>

            </div>
          )}

      </div>
    </main>
  );
}


/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  label,
  value,
  icon,
  positive,
}: {
  label: string;
  value: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

      <div className="flex items-center justify-between">

        <p className="text-sm text-gray-500">
          {label}
        </p>

        <div className="text-2xl">
          {icon}
        </div>

      </div>

      <p
        className={`mt-3 text-2xl font-bold ${
          positive === true
            ? "text-green-700"
            : positive === false
            ? "text-red-700"
            : "text-gray-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   INSIGHT ITEM
============================================================ */

function InsightItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f7f8f3] p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}