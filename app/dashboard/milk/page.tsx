import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MilkActions from "./milk-actions";

type Farm = {
  id: string;
  farm_name: string;
  location: string | null;
  county: string | null;
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
  record_date: string;
  morning_litres: number | null;
  evening_litres: number | null;
  total_litres: number | null;
  notes: string | null;
  created_at: string;
};

export default async function MilkPage() {
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
      farm_name,
      location,
      county
    `)
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", farmsError);
  }

  const userFarms: Farm[] = farms ?? [];

  // =========================================================
  // 3. GET COWS BELONGING TO USER'S FARMS
  // =========================================================

  const farmIds = userFarms.map((farm) => farm.id);

  let cows: Cow[] = [];

  if (farmIds.length > 0) {
    const { data: cowData, error: cowsError } = await supabase
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

    if (cowsError) {
      console.error("Cow loading error:", cowsError);
    } else {
      cows = cowData ?? [];
    }
  }

  // =========================================================
  // 4. GET MILK RECORDS
  // =========================================================

  let milkRecords: MilkRecord[] = [];

  if (cows.length > 0) {
    const cowIds = cows.map((cow) => cow.id);

    const { data: milkData, error: milkError } = await supabase
      .from("milk_records")
      .select(`
        id,
        cow_id,
        record_date,
        morning_litres,
        evening_litres,
        total_litres,
        notes,
        created_at
      `)
      .in("cow_id", cowIds)
      .order("record_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (milkError) {
      console.error("Milk record loading error:", milkError);
    } else {
      milkRecords = milkData ?? [];
    }
  }

  // =========================================================
  // 5. CREATE COW LOOKUP
  // =========================================================

  const cowMap = new Map(
    cows.map((cow) => [
      cow.id,
      cow,
    ])
  );

  // =========================================================
  // 6. CALCULATE SUMMARY
  // =========================================================

  const totalMilk = milkRecords.reduce(
    (sum, record) =>
      sum + Number(record.total_litres ?? 0),
    0
  );

  const averageMilk =
    milkRecords.length > 0
      ? totalMilk / milkRecords.length
      : 0;

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayMilk = milkRecords
    .filter(
      (record) =>
        record.record_date === today
    )
    .reduce(
      (sum, record) =>
        sum + Number(record.total_litres ?? 0),
      0
    );

  // =========================================================
  // 7. DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">

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
              Milk Production
            </h1>

            <p className="mt-1 text-gray-600">
              Track and analyze your daily milk production.
            </p>
          </div>

          <Link
            href="/dashboard/milk/new"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            + Record Milk
          </Link>
        </div>

        {/* NO FARM */}
        {userFarms.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              You need to create your farm before
              recording milk production.
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
        {userFarms.length > 0 && cows.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No cows registered
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Register at least one cow before
              recording milk production.
            </p>

            <Link
              href="/dashboard/cows/new"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Register Cow
            </Link>
          </div>
        )}

        {/* SUMMARY CARDS & RECORDS */}
        {cows.length > 0 && (
          <>
            {/* COMPACT SUMMARY CARDS */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {/* TODAY */}
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-xs font-medium text-gray-500">
                  Today&apos;s Milk
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {todayMilk.toFixed(2)} L
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {today}
                </p>
              </div>

              {/* TOTAL */}
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-xs font-medium text-gray-500">
                  Total Recorded
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {totalMilk.toFixed(2)} L
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Across all records
                </p>
              </div>

              {/* AVERAGE */}
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-xs font-medium text-gray-500">
                  Average / Record
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {averageMilk.toFixed(2)} L
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Per milk record
                </p>
              </div>
            </div>

            {/* RECENT RECORDS */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Milk Records
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Your latest milk production entries.
                  </p>
                </div>

                {milkRecords.length > 0 && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {milkRecords.length}{" "}
                    {milkRecords.length === 1
                      ? "record"
                      : "records"}
                  </span>
                )}
              </div>

              {/* NO RECORDS */}
              {milkRecords.length === 0 && (
                <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No milk records yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-gray-600">
                    Start recording daily morning and
                    evening milk production.
                  </p>

                  <Link
                    href="/dashboard/milk/new"
                    className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                  >
                    Record First Milk
                  </Link>
                </div>
              )}

              {/* COMPACT RECORD LIST */}
              {milkRecords.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
                  {milkRecords.slice(0, 20).map((record) => {
                    const cow = cowMap.get(record.cow_id);

                    return (
                      <div key={record.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {cow?.name || "Unnamed Cow"}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {record.record_date}
                              {cow?.tag_number ? ` • Tag ${cow.tag_number}` : ""}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-green-700">
                            {Number(record.total_litres ?? 0).toFixed(2)} L
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>
                              Morning:{" "}
                              <strong className="text-gray-900">
                                {Number(record.morning_litres ?? 0).toFixed(2)} L
                              </strong>
                            </span>
                            <span>
                              Evening:{" "}
                              <strong className="text-gray-900">
                                {Number(record.evening_litres ?? 0).toFixed(2)} L
                              </strong>
                            </span>
                          </div>

                          <MilkActions recordId={record.id} />
                        </div>

                        {record.notes && (
                          <p className="mt-2 text-xs text-gray-500">
                            Note: {record.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}