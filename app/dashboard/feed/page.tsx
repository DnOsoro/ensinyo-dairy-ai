import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteFeedButton from "./DeleteFeedButton";

type Farm = {
  id: string;
  farm_name: string;
};

type FeedRecord = {
  id: string;
  farm_id: string;
  feed_date: string;
  feed_type: string;
  quantity_kg: number;
  cost_ksh: number | null;
  notes: string | null;
  created_at: string;
};

export default async function FeedPage() {
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
  // 3. GET FEED RECORDS
  // =========================================================

  let feedRecords: FeedRecord[] = [];

  if (farmIds.length > 0) {
    const { data, error } = await supabase
      .from("feed_records")
      .select(`
        id,
        farm_id,
        feed_date,
        feed_type,
        quantity_kg,
        cost_ksh,
        notes,
        created_at
      `)
      .in("farm_id", farmIds)
      .order("feed_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Feed record loading error:",
        error
      );
    } else {
      feedRecords = data ?? [];
    }
  }

  // =========================================================
  // 4. CALCULATE STATISTICS
  // =========================================================

  const totalQuantity = feedRecords.reduce(
    (sum, record) =>
      sum + Number(record.quantity_kg ?? 0),
    0
  );

  const totalCost = feedRecords.reduce(
    (sum, record) =>
      sum + Number(record.cost_ksh ?? 0),
    0
  );

  const averageCostPerKg =
    totalQuantity > 0
      ? totalCost / totalQuantity
      : 0;

  // =========================================================
  // 5. TODAY (EAST AFRICA TIMEZONE - AFRICA/NAIROBI)
  // =========================================================

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  const todayRecords = feedRecords.filter(
    (record) => record.feed_date === today
  );

  const todayQuantity = todayRecords.reduce(
    (sum, record) => sum + Number(record.quantity_kg ?? 0),
    0
  );

  const todayCost = todayRecords.reduce(
    (sum, record) => sum + Number(record.cost_ksh ?? 0),
    0
  );

  // =========================================================
  // 6. DASHBOARD
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
              Feed Management
            </h1>

            <p className="mt-1 text-gray-600">
              Track feed usage, quantities and feeding costs.
            </p>
          </div>

          <Link
            href="/dashboard/feed/new"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            + Record Feed
          </Link>
        </div>

        {/* NO FARM */}

        {userFarms.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              You need to create your farm before recording feed information.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Farm
            </Link>
          </div>
        )}

        {/* FARM EXISTS */}

        {userFarms.length > 0 && (
          <>
            {/* SUMMARY CARDS */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* TODAY */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Today&apos;s Feed
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {todayQuantity.toFixed(2)} kg
                </p>

                <p className="mt-1 text-sm text-gray-500">{today}</p>
              </div>

              {/* TOTAL */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Total Feed
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalQuantity.toFixed(2)} kg
                </p>

                <p className="mt-1 text-sm text-gray-500">Across all records</p>
              </div>

              {/* COST */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">Feed Cost</p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {totalCost.toLocaleString("en-KE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 text-sm text-gray-500">All recorded feed</p>
              </div>

              {/* COST PER KG */}

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">
                  Average Cost / Kg
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {averageCostPerKg.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Feed cost efficiency
                </p>
              </div>
            </div>

            {/* TODAY SUMMARY */}

            {todayRecords.length > 0 && (
              <div className="mt-8 rounded-2xl bg-green-50 p-6 ring-1 ring-green-100">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-green-900">
                      Today&apos;s Feeding
                    </h2>

                    <p className="mt-1 text-sm text-green-800">
                      {todayRecords.length}{" "}
                      {todayRecords.length === 1
                        ? "feed record"
                        : "feed records"}{" "}
                      recorded today.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm text-green-700">Quantity</p>

                    <p className="text-xl font-bold text-green-900">
                      {todayQuantity.toFixed(2)} kg
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      Cost: KSh {todayCost.toLocaleString("en-KE")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RECENT RECORDS */}

            <section className="mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Feed Records
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Your latest feed usage and cost entries.
                  </p>
                </div>

                {feedRecords.length > 0 && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {feedRecords.length}{" "}
                    {feedRecords.length === 1 ? "record" : "records"}
                  </span>
                )}
              </div>

              {/* NO RECORDS */}

              {feedRecords.length === 0 && (
                <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No feed records yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-gray-600">
                    Start recording the feed used on your farm.
                  </p>

                  <Link
                    href="/dashboard/feed/new"
                    className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                  >
                    Record First Feed
                  </Link>
                </div>
              )}

              {/* RECORD TABLE & CARDS */}

              {feedRecords.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                  {/* MOBILE LIST */}
                  <div className="divide-y divide-gray-200 sm:hidden">
                    {feedRecords.slice(0, 20).map((record) => (
                      <div key={record.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {record.feed_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {record.feed_date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-700">
                              {Number(record.quantity_kg).toFixed(2)} kg
                            </p>
                            <p className="text-xs text-gray-500">
                              KSh{" "}
                              {Number(record.cost_ksh ?? 0).toLocaleString(
                                "en-KE",
                                {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        {record.notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                            {record.notes}
                          </p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <Link
                            href={`/dashboard/feed/${record.id}/edit`}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <DeleteFeedButton recordId={record.id} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Feed Type</th>
                          <th className="px-6 py-4 text-right">Quantity</th>
                          <th className="px-6 py-4 text-right">Cost</th>
                          <th className="px-6 py-4">Notes</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {feedRecords.slice(0, 20).map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50/50">
                            {/* DATE */}
                            <td className="whitespace-nowrap px-6 py-4">
                              <p className="text-sm font-semibold text-gray-900">
                                {record.feed_date}
                              </p>
                            </td>

                            {/* FEED TYPE */}
                            <td className="whitespace-nowrap px-6 py-4">
                              <p className="text-sm font-medium text-gray-900">
                                {record.feed_type}
                              </p>
                            </td>

                            {/* QUANTITY */}
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {Number(record.quantity_kg).toFixed(2)} kg
                              </p>
                            </td>

                            {/* COST */}
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                KSh{" "}
                                {Number(record.cost_ksh ?? 0).toLocaleString(
                                  "en-KE",
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </p>
                            </td>

                            {/* NOTES */}
                            <td className="max-w-xs px-6 py-4">
                              {record.notes ? (
                                <p className="truncate text-sm text-gray-600">
                                  {record.notes}
                                </p>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>

                            {/* ACTIONS */}
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/dashboard/feed/${record.id}/edit`}
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                  Edit
                                </Link>

                                <DeleteFeedButton recordId={record.id} />
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