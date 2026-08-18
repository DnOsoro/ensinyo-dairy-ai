"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewIncomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [farmId, setFarmId] = useState("");
  const [incomeDate, setIncomeDate] = useState("");
  const [category, setCategory] = useState("Milk Sales");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFarm() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("farms")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Farm loading error:", error);
        setError("Unable to load your farm.");
      } else if (!data) {
        setError("Please create your farm before recording income.");
      } else {
        setFarmId(data.id);
      }

      setIncomeDate(getTodayDate());
      setLoading(false);
    }

    loadFarm();
  }, [router, supabase]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!farmId) {
      setError("No farm found. Please create your farm first.");
      return;
    }

    const numericAmount = Number(amount);

    if (!incomeDate) {
      setError("Please select an income date.");
      return;
    }

    if (isFutureDate(incomeDate)) {
      setError("Income records cannot use a future date.");
      return;
    }

    if (!category) {
      setError("Please select an income category.");
      return;
    }

    if (
      !amount ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Please enter a valid income amount.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("income")
      .insert({
        farm_id: farmId,
        income_date: incomeDate,
        category,
        description:
          description.trim() || null,
        amount_ksh: numericAmount,
      });

    if (error) {
      console.error("Income insert error:", error);
      setError(
        error.message ||
          "Unable to save income record."
      );
      setSaving(false);
      return;
    }

    router.push("/dashboard/income");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-600">
              Loading your farm...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">

      <div className="mx-auto max-w-2xl">

        {/* HEADER */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/income")
            }
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Income
          </button>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Record Income 
          </h1>

          <p className="mt-1 text-gray-600">
            Add income received by your farm.
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
        >

          {/* DATE */}

          <div>

            <label
              htmlFor="incomeDate"
              className="text-sm font-medium text-gray-700"
            >
              Income Date
            </label>

            <input
              id="incomeDate"
              type="date"
              max={getTodayDate()}
              value={incomeDate}
              onChange={(e) =>
                setIncomeDate(e.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

          </div>


          {/* CATEGORY */}

          <div className="mt-6">

            <label
              htmlFor="category"
              className="text-sm font-medium text-gray-700"
            >
              Income Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >

              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}

            </select>

          </div>


          {/* AMOUNT */}

          <div className="mt-6">

            <label
              htmlFor="amount"
              className="text-sm font-medium text-gray-700"
            >
              Amount (KSh)
            </label>

            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="e.g. 2500"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

          </div>


          {/* DESCRIPTION */}

          <div className="mt-6">

            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description
              <span className="ml-1 text-gray-400">
                (optional)
              </span>
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={4}
              placeholder="e.g. 50 litres of milk sold to local dairy"
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

          </div>


          {/* ACTIONS */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/income")
              }
              disabled={saving}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Income"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}