"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getTodayDate,
  isFutureDate,
} from "@/lib/utils/date";

const categories = [
  "Milk Sales",
  "Cow Sales",
  "Calf Sales",
  "Breeding Services",
  "Crop Sales",
  "Manure Sales",
  "Other",
];

type IncomeRecord = {
  id: string;
  farm_id: string;
  income_date: string;
  category: string;
  description: string | null;
  amount_ksh: number;
};

export default function EditIncomePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [record, setRecord] =
    useState<IncomeRecord | null>(null);

  const [incomeDate, setIncomeDate] =
    useState("");

  const [category, setCategory] =
    useState("Milk Sales");

  const [description, setDescription] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadIncomeRecord() {
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
        // GET INCOME RECORD
        // =========================================

        const {
          data,
          error: incomeError,
        } =
          await supabase
            .from("income")
            .select(`
              id,
              farm_id,
              income_date,
              category,
              description,
              amount_ksh
            `)
            .eq("id", id)
            .maybeSingle();

        if (incomeError) {
          console.error(
            "Income loading error:",
            incomeError
          );

          setError(
            "Unable to load this income record."
          );

          setLoading(false);

          return;
        }

        if (!data) {
          setError(
            "Income record not found."
          );

          setLoading(false);

          return;
        }

        // =========================================
        // LOAD RECORD INTO FORM
        // =========================================

        const incomeRecord =
          data as IncomeRecord;

        setRecord(incomeRecord);

        setIncomeDate(
          incomeRecord.income_date
        );

        setCategory(
          incomeRecord.category
        );

        setDescription(
          incomeRecord.description || ""
        );

        setAmount(
          String(incomeRecord.amount_ksh)
        );

        setLoading(false);

      } catch (err) {
        console.error(
          "Unexpected loading error:",
          err
        );

        setError(
          "Something went wrong while loading the income record."
        );

        setLoading(false);
      }
    }

    if (id) {
      loadIncomeRecord();
    }
  }, [id, router]);

  // =========================================
  // UPDATE INCOME
  // =========================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!record) {
      setError(
        "Income record could not be loaded."
      );

      return;
    }

    // =========================================
    // DATE VALIDATION
    // =========================================

    if (!incomeDate) {
      setError(
        "Please select an income date."
      );

      return;
    }

    if (isFutureDate(incomeDate)) {
      setError(
        "Income records cannot use a future date."
      );

      return;
    }

    // =========================================
    // CATEGORY VALIDATION
    // =========================================

    if (!category) {
      setError(
        "Please select an income category."
      );

      return;
    }

    // =========================================
    // AMOUNT VALIDATION
    // =========================================

    const numericAmount =
      Number(amount);

    if (
      !amount ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid income amount."
      );

      return;
    }

    setSaving(true);

    try {
      const supabase =
        createClient();

      // =========================================
      // UPDATE RECORD
      // =========================================

      const {
        error: updateError,
      } =
        await supabase
          .from("income")
          .update({
            income_date:
              incomeDate,

            category:
              category.trim(),

            description:
              description.trim() ||
              null,

            amount_ksh:
              numericAmount,
          })
          .eq("id", record.id);

      if (updateError) {
        console.error(
          "Income update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to update income record."
        );

        setSaving(false);

        return;
      }

      // =========================================
      // SUCCESS
      // =========================================

      router.push(
        "/dashboard/income"
      );

      router.refresh();

    } catch (err) {
      console.error(
        "Unexpected update error:",
        err
      );

      setError(
        "Something went wrong while updating the income record."
      );

      setSaving(false);
    }
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">

        <div className="mx-auto max-w-2xl">

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

            <p className="text-gray-600">
              Loading income record...
            </p>

          </div>

        </div>

      </main>
    );
  }

  // =========================================
  // ERROR / NOT FOUND
  // =========================================

  if (!record) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">

        <div className="mx-auto max-w-2xl">

          <Link
            href="/dashboard/income"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Income
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">

            <p className="font-medium text-red-700">
              {error ||
                "Income record not found."}
            </p>

          </div>

        </div>

      </main>
    );
  }

  // =========================================
  // FORM
  // =========================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">

      <div className="mx-auto max-w-2xl">

        {/* HEADER */}

        <div className="mb-8">

          <Link
            href="/dashboard/income"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Income
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Edit Income Record
          </h1>

          <p className="mt-1 text-gray-600">
            Update the income information for this record.
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


          {/* FARM */}

          <div className="rounded-xl bg-gray-50 p-4">

            <p className="text-xs font-medium text-gray-500">
              Farm
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              This income record&apos;s farm
            </p>

            <p className="mt-1 text-xs text-gray-500">
              The farm cannot be changed when editing this income record.
            </p>

          </div>


          {/* DATE */}

          <div className="mt-6">

            <label
              htmlFor="incomeDate"
              className="block text-sm font-medium text-gray-700"
            >
              Income Date
            </label>

            <input
              id="incomeDate"
              type="date"
              max={getTodayDate()}
              value={incomeDate}
              onChange={(event) =>
                setIncomeDate(
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
              Income Category
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

              {categories.map(
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
              placeholder="e.g. 2500"
              required
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
              <span className="ml-1 text-gray-400">
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
              placeholder="e.g. 50 litres of milk sold to local dairy"
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

          </div>


          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/income"
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
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}