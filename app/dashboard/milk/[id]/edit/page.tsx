"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  isFutureDate,
  getTodayDate,
} from "@/lib/utils/date";

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

type MilkRecord = {
  id: string;
  cow_id: string;
  farm_id: string;
  record_date: string;
  morning_litres: number | null;
  evening_litres: number | null;
  lactation_number: number | null;
  notes: string | null;
};

export default function EditMilkRecordPage() {
  const router = useRouter();
  const params = useParams();

  const recordId = params.id as string;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [record, setRecord] = useState<MilkRecord | null>(null);

  const [farmId, setFarmId] = useState("");
  const [cowId, setCowId] = useState("");
  const [recordDate, setRecordDate] = useState("");

  const [morningLitres, setMorningLitres] = useState("");
  const [eveningLitres, setEveningLitres] = useState("");
  const [lactationNumber, setLactationNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD RECORD
  // =========================================================

  useEffect(() => {
    const supabase = createClient();

    async function loadRecord() {
      setLoading(true);
      setError("");

      // -------------------------------------------------------
      // AUTHENTICATED USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // -------------------------------------------------------
      // USER FARMS
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // MILK RECORD
      // -------------------------------------------------------

      const { data: milkRecord, error: recordError } = await supabase
        .from("milk_records")
        .select(`
          id,
          cow_id,
          farm_id,
          record_date,
          morning_litres,
          evening_litres,
          lactation_number,
          notes
        `)
        .eq("id", recordId)
        .single();

      if (recordError || !milkRecord) {
        console.error("Milk record loading error:", recordError);
        setError("Milk record could not be found.");
        setLoading(false);
        return;
      }

      // -------------------------------------------------------
      // SECURITY CHECK
      //
      // Make sure the record belongs to one of the user's farms.
      // -------------------------------------------------------

      const ownsFarm = userFarms.some(
        (farm) => farm.id === milkRecord.farm_id
      );

      if (!ownsFarm) {
        setError(
          "You do not have permission to edit this milk record."
        );
        setLoading(false);
        return;
      }

      setRecord(milkRecord);

      setFarmId(milkRecord.farm_id);
      setCowId(milkRecord.cow_id);
      setRecordDate(milkRecord.record_date);

      setMorningLitres(
        milkRecord.morning_litres?.toString() ?? ""
      );

      setEveningLitres(
        milkRecord.evening_litres?.toString() ?? ""
      );

      setLactationNumber(
        milkRecord.lactation_number?.toString() ?? ""
      );

      setNotes(milkRecord.notes ?? "");

      // -------------------------------------------------------
      // LOAD COWS
      // -------------------------------------------------------

      const farmIds = userFarms.map((farm) => farm.id);

      if (farmIds.length > 0) {
        const { data: cowData, error: cowError } =
          await supabase
            .from("cows")
            .select(`
              id,
              farm_id,
              tag_number,
              name,
              breed
            `)
            .in("farm_id", farmIds)
            .order("name");

        if (cowError) {
          console.error(
            "Cow loading error:",
            cowError
          );
          setError("Could not load your cows.");
        } else {
          setCows(cowData ?? []);
        }
      }

      setLoading(false);
    }

    loadRecord();
  }, [recordId, router]);

  // =========================================================
  // COWS FOR SELECTED FARM
  // =========================================================

  const farmCows = cows.filter(
    (cow) => cow.farm_id === farmId
  );

  // =========================================================
  // TOTAL
  // =========================================================

  const morning =
    morningLitres.trim() === ""
      ? 0
      : Number(morningLitres);

  const evening =
    eveningLitres.trim() === ""
      ? 0
      : Number(eveningLitres);

  const totalLitres = morning + evening;

  // =========================================================
  // UPDATE
  // =========================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

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

    if (isFutureDate(recordDate)) {
      setError(
        "Milk records cannot use a future date."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(morning) ||
      !Number.isFinite(evening) ||
      morning < 0 ||
      evening < 0
    ) {
      setError(
        "Please enter valid milk quantities."
      );
      setSaving(false);
      return;
    }

    const lactation =
      lactationNumber.trim() !== ""
        ? Number(lactationNumber)
        : null;

    if (
      lactation !== null &&
      (!Number.isInteger(lactation) ||
        lactation < 1)
    ) {
      setError(
        "Lactation number must be a positive whole number."
      );
      setSaving(false);
      return;
    }

    const supabase = createClient();

    // IMPORTANT:
    // We keep the original farm_id.
    // We do not allow the edit form to move a record
    // between farms.

    const { error: updateError } = await supabase
      .from("milk_records")
      .update({
        cow_id: cowId,
        record_date: recordDate,
        morning_litres: morning,
        evening_litres: evening,
        lactation_number: lactation,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (updateError) {
      console.error(
        "Milk record update error:",
        updateError
      );

      if (updateError.code === "23505") {
        setError(
          "A milk record for this cow already exists for this date."
        );
      } else {
        setError(
          "We could not update this milk record. Please check your information and try again."
        );
      }

      setSaving(false);
      return;
    }

    router.push("/dashboard/milk");
    router.refresh();
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-600">
              Loading milk record...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/dashboard/milk"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Milk Production
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Edit Milk Record
        </h1>

        <p className="mt-1 text-gray-600">
          Update this cow&apos;s milk production record.
        </p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {record && (
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
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600"
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

                <p className="mt-1 text-xs text-gray-500">
                  Farm cannot be changed when editing a milk record.
                </p>
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                  max={getTodayDate()}
                  value={recordDate}
                  onChange={(e) =>
                    setRecordDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* TOTAL */}

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  Total daily production
                </p>

                <p className="mt-1 text-2xl font-bold text-green-800">
                  {totalLitres.toFixed(1)} L
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
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
                  placeholder="Optional notes..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-8 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Updating record..."
                : "Update Milk Record"}
            </button>

          </form>
        )}
      </div>
    </main>
  );
}