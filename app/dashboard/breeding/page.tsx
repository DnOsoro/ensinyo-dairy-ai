import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type BreedingRecord = {
  id: string;
  cow_id: string;
  breeding_date: string;
  breeding_method: string | null;
  bull_name: string | null;
  expected_calving_date: string | null;
  actual_calving_date: string | null;
  outcome: string | null;
  notes: string | null;
  event_type: string | null;
  pregnancy_status: string | null;
  pregnancy_check_date: string | null;
  calving_outcome: string | null;
  calf_count: number | null;
  veterinarian: string | null;
  cost_ksh: number | null;
};

type Cow = {
  id: string;
  tag_number: string | null;
  name: string | null;
  breed: string | null;
};

function formatDate(date: string | null) {
  if (!date) return null;

  return new Date(date).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BreedingPage() {
  const supabase = await createClient();

  // -----------------------------------------
  // DELETE BREEDING RECORD
  // -----------------------------------------

  async function deleteBreedingRecord(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const recordId = String(formData.get("record_id") || "").trim();

    if (!recordId) {
      return;
    }

    // -----------------------------------------
    // Verify record belongs to user's farm
    // -----------------------------------------

    const { data: record, error: recordError } = await supabase
      .from("breeding_records")
      .select("id, cow_id")
      .eq("id", recordId)
      .single();

    if (recordError || !record) {
      console.error("Breeding record lookup error:", recordError);
      return;
    }

    const { data: cow, error: cowError } = await supabase
      .from("cows")
      .select("id, farm_id")
      .eq("id", record.cow_id)
      .single();

    if (cowError || !cow) {
      console.error("Cow lookup error:", cowError);
      return;
    }

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", cow.farm_id)
      .eq("owner_id", user.id)
      .single();

    if (farmError || !farm) {
      console.error("Farm ownership verification error:", farmError);
      return;
    }

    // -----------------------------------------
    // Delete record
    // -----------------------------------------

    const { error: deleteError } = await supabase
      .from("breeding_records")
      .delete()
      .eq("id", recordId);

    if (deleteError) {
      console.error("Breeding record delete error:", deleteError);
      return;
    }

    revalidatePath("/dashboard/breeding");
  }

  // -----------------------------------------
  // GET USER
  // -----------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // -----------------------------------------
  // GET FARMS
  // -----------------------------------------

  const { data: farms, error: farmsError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", farmsError);
  }

  const safeFarms = farms ?? [];
  const farmIds = safeFarms.map((farm) => farm.id);

  // -----------------------------------------
  // GET COWS
  // -----------------------------------------

  let cows: Cow[] = [];

  if (farmIds.length > 0) {
    const { data, error } = await supabase
      .from("cows")
      .select("id, tag_number, name, breed")
      .in("farm_id", farmIds)
      .order("name");

    if (error) {
      console.error("Cow loading error:", error);
    } else {
      cows = data ?? [];
    }
  }

  // -----------------------------------------
  // GET BREEDING RECORDS
  // -----------------------------------------

  let breedingRecords: BreedingRecord[] = [];

  if (cows.length > 0) {
    const cowIds = cows.map((cow) => cow.id);

    const { data, error } = await supabase
      .from("breeding_records")
      .select(
        `
          id,
          cow_id,
          breeding_date,
          breeding_method,
          bull_name,
          expected_calving_date,
          actual_calving_date,
          outcome,
          notes,
          event_type,
          pregnancy_status,
          pregnancy_check_date,
          calving_outcome,
          calf_count,
          veterinarian,
          cost_ksh
        `
      )
      .in("cow_id", cowIds)
      .order("breeding_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Breeding record loading error:", error);
    } else {
      breedingRecords = data ?? [];
    }
  }

  // -----------------------------------------
  // COW MAP
  // -----------------------------------------

  const cowMap = new Map(cows.map((cow) => [cow.id, cow]));

  // -----------------------------------------
  // STATISTICS
  // -----------------------------------------

  const totalEvents = breedingRecords.length;

  const pregnantCount = breedingRecords.filter(
    (record) =>
      record.pregnancy_status?.toLowerCase() === "pregnant" ||
      record.outcome?.toLowerCase() === "pregnant"
  ).length;

  const calvedCount = breedingRecords.filter(
    (record) =>
      record.actual_calving_date !== null || record.calving_outcome !== null
  ).length;

  const totalCost = breedingRecords.reduce(
    (sum, record) => sum + Number(record.cost_ksh ?? 0),
    0
  );

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">
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
              Breeding Management
            </h1>

            <p className="mt-1 text-gray-600">
              Track mating, artificial insemination, pregnancy, and calving.
            </p>
          </div>

          <Link
            href="/dashboard/breeding/new"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            + Record Breeding Event
          </Link>
        </div>

        {/* NO FARM */}
        {safeFarms.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Before recording breeding information, you need to create your farm profile.
            </p>
            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Farm
            </Link>
          </div>
        )}

        {/* NO COWS */}
        {safeFarms.length > 0 && cows.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No cows registered yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Register cattle before recording breeding information.
            </p>
            <Link
              href="/dashboard/cows/new"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Register Cow
            </Link>
          </div>
        )}

        {/* MAIN DATA SECTION */}
        {cows.length > 0 && (
          <>
            {/* STATISTICS */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Breeding Events</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalEvents}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Pregnant</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {pregnantCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Calved</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {calvedCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Breeding Costs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {totalCost.toLocaleString("en-KE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* RECENT RECORDS */}
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Breeding Records
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Your latest breeding activities.
                </p>
              </div>

              {breedingRecords.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No breeding records yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-gray-600">
                    Start recording mating, artificial insemination, pregnancy, and calving events.
                  </p>
                  <Link
                    href="/dashboard/breeding/new"
                    className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                  >
                    Record First Breeding Event
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {breedingRecords.slice(0, 20).map((record) => {
                    const cow = cowMap.get(record.cow_id);

                    return (
                      <div
                        key={record.id}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                      >
                        {/* HEADER */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {cow?.name || "Unnamed Cow"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Tag: {cow?.tag_number || "Not assigned"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              {record.event_type || "Breeding"}
                            </span>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(record.breeding_date)}
                            </p>
                          </div>
                        </div>

                        {/* DETAILS GRID */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Method</p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900">
                              {record.breeding_method || "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Bull / Sire</p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900">
                              {record.bull_name || "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Pregnancy Status</p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900">
                              {record.pregnancy_status || "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Expected Calving</p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900">
                              {formatDate(record.expected_calving_date) || "—"}
                            </p>
                          </div>

                          {record.actual_calving_date && (
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Actual Calving</p>
                              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                                {formatDate(record.actual_calving_date)}
                              </p>
                            </div>
                          )}

                          {record.calf_count !== null && (
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Calves</p>
                              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                                {record.calf_count}
                              </p>
                            </div>
                          )}

                          {record.cost_ksh !== null && (
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Cost</p>
                              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                                KSh {Number(record.cost_ksh).toLocaleString("en-KE")}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* NOTES */}
                        {record.notes && (
                          <div className="mt-4 border-t border-gray-100 pt-3">
                            <p className="text-xs font-medium text-gray-500">Notes</p>
                            <p className="mt-1 text-sm text-gray-700">{record.notes}</p>
                          </div>
                        )}

                        {/* ACTIONS */}
                        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                          <Link
                            href={`/dashboard/breeding/${record.id}/edit`}
                            className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </Link>

                          <form action={deleteBreedingRecord}>
                            <input type="hidden" name="record_id" value={record.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}