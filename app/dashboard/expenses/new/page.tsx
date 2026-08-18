"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getTodayDate,
  isFutureDate,
} from "@/lib/utils/date";

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

export default function NewExpensePage() {
  const router = useRouter();

  const [expenseDate, setExpenseDate] =
    useState(getTodayDate());

  const [category, setCategory] =
    useState("Feed");

  const [description, setDescription] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!expenseDate) {
      setError("Please select an expense date.");
      return;
    }

    if (isFutureDate(expenseDate)) {
      setError("Expense records cannot use a future date.");
      return;
    }

    if (!category) {
      setError("Please select an expense category.");
      return;
    }

    const amountNumber =
      Number(amount);

    if (
      !amount ||
      Number.isNaN(amountNumber) ||
      amountNumber <= 0
    ) {
      setError(
        "Please enter a valid expense amount."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase =
        createClient();

      // =========================================
      // GET CURRENT USER
      // =========================================

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // =========================================
      // GET USER'S FARM
      // =========================================

      const {
        data: farms,
        error: farmError,
      } =
        await supabase
          .from("farms")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", {
            ascending: true,
          });

      if (farmError) {
        console.error(
          "Farm loading error:",
          farmError
        );

        setError(
          "Unable to load your farm."
        );

        setSaving(false);

        return;
      }

      if (!farms || farms.length === 0) {
        setError(
          "You need to create a farm before recording an expense."
        );

        setSaving(false);

        return;
      }

      // =========================================
      // USE FIRST FARM
      // =========================================

      const farmId =
        farms[0].id;

      // =========================================
      // INSERT EXPENSE
      // =========================================

      const {
        error: insertError,
      } =
        await supabase
          .from("expenses")
          .insert({
            farm_id: farmId,
            expense_date:
              expenseDate,
            category:
              category.trim(),
            description:
              description.trim() ||
              null,
            amount_ksh:
              amountNumber,
          });

      if (insertError) {
        console.error(
          "Expense insertion error:",
          insertError
        );

        setError(
          insertError.message ||
            "Unable to save expense."
        );

        setSaving(false);

        return;
      }

      // =========================================
      // SUCCESS
      // =========================================

      router.push(
        "/dashboard/expenses"
      );

      router.refresh();

    } catch (err) {
      console.error(
        "Unexpected expense error:",
        err
      );

      setError(
        "Something went wrong while saving the expense."
      );

      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">

      <div className="mx-auto max-w-2xl">

        {/* HEADER */}

        <div className="mb-8">

          <Link
            href="/dashboard/expenses"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Expenses
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Record Expense 
          </h1>

          <p className="mt-1 text-gray-600">
            Record money spent on your farm.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
        >

          {/* ERROR */}

          {error && (

            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

            </div>

          )}


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
              type="date"
              max={getTodayDate()}
              value={expenseDate}
              onChange={(event) =>
                setExpenseDate(
                  event.target.value
                )
              }
              required
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
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              required
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
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount (KSh)
            </label>

            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
              placeholder="e.g. 400"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={4}
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
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Expense"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}