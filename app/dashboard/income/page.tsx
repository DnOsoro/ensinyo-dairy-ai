import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import DeleteIncomeButton from "@/components/delete-income-button";

type IncomeRecord = {
  id: string;
  farm_id: string;
  income_date: string;
  category: string;
  description: string | null;
  amount_ksh: number;
  created_at: string;
};

export default async function IncomePage() {
  const supabase = await createClient();

  // -----------------------------------------
  // 1. Get logged-in user
  // -----------------------------------------
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // -----------------------------------------
  // SERVER ACTION: Delete Income Record
  // -----------------------------------------
  async function deleteIncomeRecord(formData: FormData) {
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
      throw new Error("Record ID is required.");
    }

    // Verify ownership via farm
    const { data: record, error: recordError } = await supabase
      .from("income")
      .select("id, farm_id")
      .eq("id", recordId)
      .single();

    if (recordError || !record) {
      throw new Error("Income record not found.");
    }

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", record.farm_id)
      .eq("owner_id", user.id)
      .single();

    if (farmError || !farm) {
      throw new Error("Unauthorized to delete this record.");
    }

    const { error: deleteError } = await supabase
      .from("income")
      .delete()
      .eq("id", recordId);

    if (deleteError) {
      console.error("Delete income error:", deleteError);
      throw new Error("Failed to delete income record.");
    }

    revalidatePath("/dashboard/income");
  }

  // -----------------------------------------
  // 2. Get user's farms
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
  // 3. Get income records
  // -----------------------------------------
  let incomeRecords: IncomeRecord[] = [];

  if (farmIds.length > 0) {
    const { data, error } = await supabase
      .from("income")
      .select(`
        id,
        farm_id,
        income_date,
        category,
        description,
        amount_ksh,
        created_at
      `)
      .in("farm_id", farmIds)
      .order("income_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Income loading error:", error);
    } else {
      incomeRecords = data ?? [];
    }
  }

  // -----------------------------------------
  // 4. Date helpers
  // -----------------------------------------
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // -----------------------------------------
  // 5. Statistics
  // -----------------------------------------
  const totalIncome = incomeRecords.reduce(
    (sum, record) => sum + Number(record.amount_ksh ?? 0),
    0
  );

  const todayIncome = incomeRecords
    .filter((record) => record.income_date === today)
    .reduce((sum, record) => sum + Number(record.amount_ksh ?? 0), 0);

  const monthIncome = incomeRecords
    .filter((record) => record.income_date.startsWith(currentMonth))
    .reduce((sum, record) => sum + Number(record.amount_ksh ?? 0), 0);

  const averageIncome =
    incomeRecords.length > 0 ? totalIncome / incomeRecords.length : 0;

  // -----------------------------------------
  // 6. Income breakdown
  // -----------------------------------------
  const incomeBreakdown = incomeRecords.reduce((acc, record) => {
    const category = record.category || "Other";
    acc[category] = (acc[category] || 0) + Number(record.amount_ksh ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedBreakdown = Object.entries(incomeBreakdown).sort(
    (a, b) => b[1] - a[1]
  );

  // -----------------------------------------
  // 7. Render Page
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
              Income Management
            </h1>
            <p className="mt-1 text-gray-600">
              Track and manage your farm income.
            </p>
          </div>

          <Link
            href="/dashboard/income/new"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            + Record Income
          </Link>
        </div>

        {/* NO FARM STATE */}
        {safeFarms.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Add your farm first
            </h2>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Before recording income, you need to create your farm profile.
            </p>
            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Add Farm
            </Link>
          </div>
        )}

        {/* METRICS & TABLES */}
        {safeFarms.length > 0 && (
          <>
            {/* STATS CARDS */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Today&apos;s Income</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {todayIncome.toLocaleString("en-KE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-sm text-gray-500">{today}</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {totalIncome.toLocaleString("en-KE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-sm text-gray-500">Across all records</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">This Month</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {monthIncome.toLocaleString("en-KE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-sm text-gray-500">Current month</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Average Income</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  KSh{" "}
                  {averageIncome.toLocaleString("en-KE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-sm text-gray-500">Per income record</p>
              </div>
            </div>

            {/* BREAKDOWN SECTION */}
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Income Breakdown
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  See where your farm income is coming from.
                </p>
              </div>

              {sortedBreakdown.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
                  <p className="text-gray-600">No income recorded yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedBreakdown.map(([category, amount]) => (
                    <div
                      key={category}
                      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-500">
                        {category}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-green-700">
                        KSh{" "}
                        {amount.toLocaleString("en-KE", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RECENT INCOME TABLE SECTION */}
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Income
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Your latest farm income records.
                  </p>
                </div>

                {incomeRecords.length > 0 && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {incomeRecords.length}{" "}
                    {incomeRecords.length === 1 ? "record" : "records"}
                  </span>
                )}
              </div>

              {incomeRecords.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    No income records yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-gray-600">
                    Start recording milk sales, livestock sales, and other farm income.
                  </p>
                  <Link
                    href="/dashboard/income/new"
                    className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Record First Income
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                        <tr>
                          <th scope="col" className="px-6 py-4">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-4">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-4">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-4 text-right">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-4 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {incomeRecords.slice(0, 20).map((record) => {
                          const formId = `delete-income-form-${record.id}`;

                          return (
                            <tr
                              key={record.id}
                              className="transition hover:bg-gray-50/50"
                            >
                              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                                {record.income_date}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                                  {record.category}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <p className="max-w-xs truncate text-sm text-gray-600">
                                  {record.description || "—"}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-green-700">
                                KSh{" "}
                                {Number(record.amount_ksh).toLocaleString(
                                  "en-KE",
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    href={`/dashboard/income/${record.id}/edit`}
                                    className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                  >
                                    Edit
                                  </Link>

                                  <form
                                    id={formId}
                                    action={deleteIncomeRecord}
                                  >
                                    <input
                                      type="hidden"
                                      name="record_id"
                                      value={record.id}
                                    />
                                    <DeleteIncomeButton formId={formId} />
                                  </form>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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