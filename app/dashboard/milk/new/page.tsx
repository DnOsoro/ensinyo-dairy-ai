"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Farm = {
  id: string;
  farm_name: string;
};

type Cow = {
  id: string;
  farm_id: string;
  tag_number: string | null;
  name: string | null;
  breed: string | null;
};

export default function NewMilkRecordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);

  const [farmId, setFarmId] = useState("");
  const [cowId, setCowId] = useState("");

  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [morningLitres, setMorningLitres] = useState("");
  const [eveningLitres, setEveningLitres] = useState("");
  const [lactationNumber, setLactationNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load farms and cows
  // --------------------------------------------------

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Get user's farms
      const { data: farmData, error: farmError } = await supabase
        .from("farms")
        .select("id, farm_name")
        .eq("owner_id", user.id)
        .order("farm_name");

      if (farmError) {
        console.error("Farm loading error:", farmError);
        setError("Could not load your farms.");
        setLoading(false);
        return;
      }

      const userFarms = farmData ?? [];

      setFarms(userFarms);

      if (userFarms.length > 0) {
        setFarmId(userFarms[0].id);

        const farmIds = userFarms.map((farm) => farm.id);

        // Get cows belonging to user's farms
        const { data: cowData, error: cowError } = await supabase
          .from("cows")
          .select(
            `
              id,
              farm_id,
              tag_number,
              name,
              breed
            `
          )
          .in("farm_id", farmIds)
          .order("name");

        if (cowError) {
          console.error("Cow loading error:", cowError);
          setError("Could not load your cows.");
        } else {
          setCows(cowData ?? []);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  // --------------------------------------------------
  // Cows belonging to selected farm
  // --------------------------------------------------

  const farmCows = cows.filter((cow) => cow.farm_id === farmId);

  // --------------------------------------------------
  // Automatically select first cow
  // --------------------------------------------------

  useEffect(() => {
    if (farmCows.length > 0) {
      setCowId(farmCows[0].id);
    } else {
      setCowId("");
    }
  }, [farmId, farmCows.length]);

  // --------------------------------------------------
  // Calculate total for display
  // --------------------------------------------------

  const morning = morningLitres ? Number(morningLitres) : 0;
  const evening = eveningLitres ? Number(eveningLitres) : 0;

  const totalLitres = morning + evening;

  // --------------------------------------------------
  // Save milk record
  // --------------------------------------------------

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    if (!farmId) {
      setError("Please select a farm.");
      setSaving(false);
      return;
    }

    if (!cowId) {
      setError("Please select a cow.");
      setSaving(false);
      return;
    }

    if (!recordDate) {
      setError("Please select the record date.");
      setSaving(false);
      return;
    }

    if (
      Number.isNaN(morning) ||
      Number.isNaN(evening) ||
      morning < 0 ||
      evening < 0
    ) {
      setError("Please enter valid milk quantities.");
      setSaving(false);
      return;
    }

    const lactation =
      lactationNumber.trim() !== ""
        ? Number(lactationNumber)
        : null;

    if (
      lactation !== null &&
      (!Number.isInteger(lactation) || lactation < 1)
    ) {
      setError(
        "Lactation number must be a positive whole number."
      );
      setSaving(false);
      return;
    }

    // IMPORTANT:
    // Do NOT send total_litres.
    // Supabase/PostgreSQL calculates it automatically
    // because total_litres is a generated column.

    const { error: insertError } = await supabase
      .from("milk_records")
      .insert({
        cow_id: cowId,
        farm_id: farmId,
        record_date: recordDate,
        morning_litres: morning,
        evening_litres: evening,
        lactation_number: lactation,
        notes: notes.trim() || null,
      });

    if (insertError) {
      console.error(
        "Milk record insert error:",
        insertError
      );

      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard/milk");
    router.refresh();
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-600">
              Loading your farm data...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}

        <div>
          <Link
            href="/dashboard/milk"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Milk Production
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Record Milk Production
          </h1>

          <p className="mt-1 text-gray-600">
            Record the amount of milk produced by a cow.
          </p>
        </div>

        {/* NO FARMS */}

        {farms.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              🌱
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No farm found
            </h2>

            <p className="mt-2 text-gray-600">
              Create your farm before recording milk.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Farm
            </Link>

          </div>
        ) : farmCows.length === 0 ? (

          /* NO COWS */

          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              🐄
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No cows found
            </h2>

            <p className="mt-2 text-gray-600">
              Register a cow before recording milk production.
            </p>

            <Link
              href="/dashboard/cows/new"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Register Cow
            </Link>

          </div>

        ) : (

          /* FORM */

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
          >

            <div className="space-y-6">

              {/* FARM */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Farm
                </label>

                <select
                  value={farmId}
                  onChange={(e) =>
                    setFarmId(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {farms.map((farm) => (
                    <option
                      key={farm.id}
                      value={farm.id}
                    >
                      {farm.farm_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* COW */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Cow
                </label>

                <select
                  required
                  value={cowId}
                  onChange={(e) =>
                    setCowId(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select cow
                  </option>

                  {farmCows.map((cow) => (
                    <option
                      key={cow.id}
                      value={cow.id}
                    >
                      {cow.name ||
                        cow.tag_number ||
                        "Unnamed cow"}
                      {cow.tag_number
                        ? ` — Tag ${cow.tag_number}`
                        : ""}
                      {cow.breed
                        ? ` — ${cow.breed}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Record date
                </label>

                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) =>
                    setRecordDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* MORNING */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Morning milk (litres)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={morningLitres}
                  onChange={(e) =>
                    setMorningLitres(e.target.value)
                  }
                  placeholder="e.g. 8.5"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* EVENING */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Evening milk (litres)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={eveningLitres}
                  onChange={(e) =>
                    setEveningLitres(e.target.value)
                  }
                  placeholder="e.g. 7.2"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* TOTAL */}

              <div className="rounded-xl bg-green-50 p-5">
                <p className="text-sm text-green-700">
                  Total daily production
                </p>

                <p className="mt-1 text-3xl font-bold text-green-800">
                  {totalLitres.toFixed(1)} L
                </p>

                <p className="mt-1 text-xs text-green-700">
                  Morning + Evening
                </p>
              </div>

              {/* LACTATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Lactation number
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={lactationNumber}
                  onChange={(e) =>
                    setLactationNumber(e.target.value)
                  }
                  placeholder="e.g. 2"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Leave blank if you do not know it.
                </p>
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  rows={4}
                  placeholder="Optional notes about today's production..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              disabled={saving}
              className="mt-8 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving milk record..."
                : "Save Milk Record"}
            </button>

          </form>
        )}

      </div>
    </main>
  );
}