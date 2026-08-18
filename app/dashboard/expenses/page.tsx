import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./delete-button";

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

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatMoney(amount: number) {
  return Number(amount ?? 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default async function ExpensesPage() {
  const supabase = await createClient();

  // =========================================================
  // DELETE EXPENSE
  // =========================================================

  async function deleteExpense(formData: FormData) {
    "use server";

    const recordId = String(
      formData.get("record_id") || ""
    ).trim();

    if (!recordId) {
      throw new Error("Expense record ID is required.");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    // RLS ensures the record belongs to the user's farm.
    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", recordId);

    if (deleteError) {
      console.error(
        "Expense deletion error:",
        deleteError
      );

      throw new Error(
        "Could not delete this expense."
      );
    }

    revalidatePath("/dashboard/expenses");
  }

  // =========================================================
  // GET CURRENT USER
  // =========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // =========================================================
  // GET USER FARMS
  // =========================================================

  const { data: farms, error: farmsError } =
    await supabase
      .from("farms")
      .select(`
        id,
        farm_name
      `)
      .eq("owner_id", user.id)
      .order("farm_name");

  if (farmsError) {
    console.error(
      "Farm loading error:",
      farmsError
    );
  }

  const userFarms: Farm[] = farms ?? [];

  const farmIds = userFarms.map(
    (farm) => farm.id
  );

  // =========================================================
  // GET EXPENSES
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
      console.error(
        "Expense loading error:",
        error
      );
    } else {
      expenses = data ?? [];
    }
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const currentMonth = today.slice(0, 7);

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
  // CATEGORY SUMMARY
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
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Expense Management
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

        {/* NO FARM */}

        {userFarms.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
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
        ) : (
          <>
            {/* STATISTICS */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Today&apos;s Expenses
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh {formatMoney(todayExpenses)}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {today}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Total Expenses
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh {formatMoney(totalExpenses)}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Across all records
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  This Month
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh {formatMoney(monthlyExpenses)}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Current month
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Average Expense
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh {formatMoney(averageExpense)}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Per expense record
                </p>
              </div>

            </div>

            {/* CATEGORY BREAKDOWN */}

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
                          KSh {formatMoney(amount)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* EXPENSE TABLE */}

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
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

              {expenses.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
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
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Date
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Category
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Description
                          </th>

                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Amount
                          </th>

                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {expenses
                          .slice(0, 20)
                          .map((expense) => (
                            <tr
                              key={expense.id}
                              className="transition hover:bg-gray-50"
                            >
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                {formatDate(
                                  expense.expense_date
                                )}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                  {expense.category}
                                </span>
                              </td>

                              <td className="max-w-xs px-6 py-4 text-sm text-gray-600">
                                {expense.description ||
                                  "—"}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                                KSh{" "}
                                {formatMoney(
                                  expense.amount_ksh
                                )}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    href={`/dashboard/expenses/${expense.id}/edit`}
                                    className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                  >
                                    Edit
                                  </Link>

                                  <DeleteButton
                                    action={
                                      deleteExpense
                                    }
                                    recordId={
                                      expense.id
                                    }
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}