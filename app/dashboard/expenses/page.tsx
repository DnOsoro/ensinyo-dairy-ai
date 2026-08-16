import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Farm = {
  id: string;
  farm_name: string;
};

type Expense = {
  id: string;
  farm_id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount_ksh: number;
  created_at: string;
};

export default async function ExpensesPage() {
  const supabase = await createClient();

  // =========================================================
  // 1. GET CURRENT USER
  // =========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // =========================================================
  // 2. GET USER'S FARMS
  // =========================================================

  const { data: farms, error: farmsError } = await supabase
    .from("farms")
    .select(`
      id,
      farm_name
    `)
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", farmsError);
  }

  const userFarms: Farm[] = farms ?? [];

  const farmIds = userFarms.map((farm) => farm.id);

  // =========================================================
  // 3. GET EXPENSES
  // =========================================================

  let expenses: Expense[] = [];

  if (farmIds.length > 0) {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        farm_id,
        expense_date,
        category,
        description,
        amount_ksh,
        created_at
      `)
      .in("farm_id", farmIds)
      .order("expense_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Expense loading error:", error);
    } else {
      expenses = data ?? [];
    }
  }

  // =========================================================
  // 4. CALCULATE STATISTICS
  // =========================================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const totalExpenses = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount_ksh ?? 0),
    0
  );

  const todayExpenses = expenses
    .filter(
      (expense) =>
        expense.expense_date === today
    )
    .reduce(
      (sum, expense) =>
        sum + Number(expense.amount_ksh ?? 0),
      0
    );

  const currentMonth = today.slice(0, 7);

  const monthlyExpenses = expenses
    .filter(
      (expense) =>
        expense.expense_date.startsWith(
          currentMonth
        )
    )
    .reduce(
      (sum, expense) =>
        sum + Number(expense.amount_ksh ?? 0),
      0
    );

  const averageExpense =
    expenses.length > 0
      ? totalExpenses / expenses.length
      : 0;

  // =========================================================
  // 5. CATEGORY SUMMARY
  // =========================================================

  const categoryTotals = expenses.reduce(
    (acc, expense) => {
      const category =
        expense.category || "Other";

      acc[category] =
        (acc[category] ?? 0) +
        Number(expense.amount_ksh ?? 0);

      return acc;
    },
    {} as Record<string, number>
  );

  const categoryEntries = Object.entries(
    categoryTotals
  ).sort((a, b) => b[1] - a[1]);

  // =========================================================
  // 6. DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <Link
              href="/dashboard"
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Expense Management 💰
            </h1>

            <p className="mt-1 text-gray-600">
              Track and manage your farm expenses.
            </p>

          </div>

          <Link
            href="/dashboard/expenses/new"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            + Record Expense
          </Link>

        </div>


        {/* =================================================
            NO FARM
        ================================================= */}

        {userFarms.length === 0 && (

          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              🌱
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              You need to create your farm before
              recording expenses.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Farm
            </Link>

          </div>

        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        {userFarms.length > 0 && (

          <>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* TODAY */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

                <p className="text-sm font-medium text-gray-500">
                  Today's Expenses
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {todayExpenses.toLocaleString(
                    "en-KE",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {today}
                </p>

              </div>


              {/* TOTAL */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

                <p className="text-sm font-medium text-gray-500">
                  Total Expenses
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {totalExpenses.toLocaleString(
                    "en-KE",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Across all records
                </p>

              </div>


              {/* MONTH */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

                <p className="text-sm font-medium text-gray-500">
                  This Month
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {monthlyExpenses.toLocaleString(
                    "en-KE",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Current month
                </p>

              </div>


              {/* AVERAGE */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

                <p className="text-sm font-medium text-gray-500">
                  Average Expense
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {averageExpense.toLocaleString(
                    "en-KE",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Per expense record
                </p>

              </div>

            </div>


            {/* =================================================
                CATEGORY BREAKDOWN
            ================================================= */}

            {categoryEntries.length > 0 && (

              <section className="mt-8">

                <div className="mb-4">

                  <h2 className="text-xl font-bold text-gray-900">
                    Expense Breakdown
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    See where your farm money is going.
                  </p>

                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  {categoryEntries.map(
                    ([category, amount]) => (

                      <div
                        key={category}
                        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
                      >

                        <p className="text-sm font-medium text-gray-500">
                          {category}
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          KSh{" "}
                          {amount.toLocaleString(
                            "en-KE",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </section>

            )}


            {/* =================================================
                RECENT EXPENSES
            ================================================= */}

            <section className="mt-8">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Expenses
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Your latest farm expenses.
                  </p>

                </div>

                {expenses.length > 0 && (

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {expenses.length}{" "}
                    {expenses.length === 1
                      ? "record"
                      : "records"}
                  </span>

                )}

              </div>


              {/* NO EXPENSES */}

              {expenses.length === 0 && (

                <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

                  <div className="text-5xl">
                    💰
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No expenses yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-gray-600">
                    Start recording your farm expenses
                    to understand your costs.
                  </p>

                  <Link
                    href="/dashboard/expenses/new"
                    className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                  >
                    Record First Expense
                  </Link>

                </div>

              )}


              {/* EXPENSE LIST */}

              {expenses.length > 0 && (

                <div className="mt-6 space-y-4">

                  {expenses
                    .slice(0, 20)
                    .map((expense) => (

                      <div
                        key={expense.id}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-3">

                              <h3 className="text-lg font-bold text-gray-900">
                                {expense.category}
                              </h3>

                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                {expense.expense_date}
                              </span>

                            </div>

                            {expense.description && (

                              <p className="mt-2 text-sm text-gray-600">
                                {expense.description}
                              </p>

                            )}

                          </div>


                          <div className="rounded-xl bg-red-50 px-4 py-2 text-right">

                            <p className="text-xs font-medium text-red-700">
                              Amount
                            </p>

                            <p className="text-xl font-bold text-red-800">
                              KSh{" "}
                              {Number(
                                expense.amount_ksh
                              ).toLocaleString(
                                "en-KE",
                                {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>

                          </div>

                        </div>


                        {/* DETAILS */}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">

                          <div className="rounded-xl bg-gray-50 p-4">

                            <p className="text-xs text-gray-500">
                              Category
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {expense.category}
                            </p>

                          </div>


                          <div className="rounded-xl bg-gray-50 p-4">

                            <p className="text-xs text-gray-500">
                              Expense Date
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {expense.expense_date}
                            </p>

                          </div>

                        </div>


                        {expense.description && (

                          <div className="mt-4 border-t border-gray-100 pt-4">

                            <p className="text-xs font-medium text-gray-500">
                              Description
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              {expense.description}
                            </p>

                          </div>

                        )}

                      </div>

                    ))}

                </div>

              )}

            </section>

          </>

        )}

      </div>

    </main>
  );
}