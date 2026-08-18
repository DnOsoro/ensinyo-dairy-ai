import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const expenseCategories = [
  "Feed",
  "Veterinary",
  "Medicine",
  "Labour",
  "Transport",
  "Equipment",
  "Breeding",
  "Utilities",
  "Maintenance",
  "Seeds & Crops",
  "Other",
];

function getTodayDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

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
  // GET EXPENSE
  // =========================================================

  const { data: expense, error: expenseError } =
    await supabase
      .from("expenses")
      .select(`
        id,
        farm_id,
        expense_date,
        category,
        description,
        amount_ksh
      `)
      .eq("id", id)
      .single();

  if (expenseError || !expense) {
    notFound();
  }

  // =========================================================
  // VERIFY FARM OWNERSHIP
  // =========================================================

  const { data: farm, error: farmError } =
    await supabase
      .from("farms")
      .select("id")
      .eq("id", expense.farm_id)
      .eq("owner_id", user.id)
      .single();

  if (farmError || !farm) {
    notFound();
  }

  // =========================================================
  // UPDATE EXPENSE
  // =========================================================

  async function updateExpense(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const expenseDate = String(
      formData.get("expense_date") || ""
    ).trim();

    const category = String(
      formData.get("category") || ""
    ).trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    const amountValue = String(
      formData.get("amount_ksh") || ""
    ).trim();

    if (!expenseDate) {
      throw new Error(
        "Expense date is required."
      );
    }

    // Event/transaction date is the only date
    // that cannot be in the future.
    if (expenseDate > getTodayDate()) {
      throw new Error(
        "Expense records cannot use a future date."
      );
    }

    if (!category) {
      throw new Error(
        "Expense category is required."
      );
    }

    const amount = Number(amountValue);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Please enter a valid expense amount."
      );
    }

    // RLS protects ownership.
    const { error: updateError } =
      await supabase
        .from("expenses")
        .update({
          expense_date: expenseDate,
          category,
          description: description || null,
          amount_ksh: amount,
        })
        .eq("id", id);

    if (updateError) {
      console.error(
        "Expense update error:",
        updateError
      );

      throw new Error(
        "Could not update this expense."
      );
    }

    revalidatePath("/dashboard/expenses");

    redirect("/dashboard/expenses");
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8">
          <Link
            href="/dashboard/expenses"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Expenses
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Edit Expense
          </h1>

          <p className="mt-1 text-gray-600">
            Update this farm expense.
          </p>
        </div>

        <form
          action={updateExpense}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
        >

          {/* DATE */}

          <div>
            <label
              htmlFor="expense_date"
              className="block text-sm font-medium text-gray-700"
            >
              Expense Date
            </label>

            <input
              id="expense_date"
              name="expense_date"
              type="date"
              required
              max={getTodayDate()}
              defaultValue={
                expense.expense_date
              }
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* CATEGORY */}

          <div className="mt-6">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Expense Category
            </label>

            <select
              id="category"
              name="category"
              required
              defaultValue={
                expense.category
              }
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {expenseCategories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          {/* AMOUNT */}

          <div className="mt-6">
            <label
              htmlFor="amount_ksh"
              className="block text-sm font-medium text-gray-700"
            >
              Amount (KSh)
            </label>

            <input
              id="amount_ksh"
              name="amount_ksh"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={
                expense.amount_ksh
              }
              placeholder="e.g. 400"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* DESCRIPTION */}

          <div className="mt-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
              <span className="font-normal text-gray-400">
                {" "}
                (optional)
              </span>
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={
                expense.description ?? ""
              }
              placeholder="e.g. Bought 10 bags of dairy meal."
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/expenses"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Save Changes
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}