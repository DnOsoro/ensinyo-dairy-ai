import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteHealthButton from "./DeleteHealthButton";

type HealthRecord = {
  id: string;
  cow_id: string;
  event_date: string;
  event_type: string;
  diagnosis: string | null;
  treatment: string | null;
  veterinarian: string | null;
  medication: string | null;
  cost_ksh: number | null;
  notes: string | null;
};

type Cow = {
  id: string;
  tag_number: string | null;
  name: string | null;
  breed: string | null;
};

type PageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function HealthPage({
  searchParams,
}: PageProps) {
  const {
    error: errorMessage,
    success: successMessage,
  } = await searchParams;

  const supabase = await createClient();

  // -----------------------------------------
  // 1. Get authenticated user
  // -----------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // -----------------------------------------
  // 2. Delete health record server action
  // -----------------------------------------

  async function deleteHealthRecord(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const recordId = String(
      formData.get("record_id") || ""
    ).trim();

    if (!recordId) {
      redirect(
        "/dashboard/health?error=delete-invalid"
      );
    }

    // RLS protects this operation.
    //
    // The health_records DELETE policy verifies:
    //
    // health_records
    //      ↓
    // cows
    //      ↓
    // farms
    //      ↓
    // farms.owner_id = auth.uid()
    //
    // Therefore a farmer cannot delete another
    // farmer's health record.

    const { error } = await supabase
      .from("health_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error(
        "Health record delete error:",
        {
          userId: user.id,
          recordId,
          error,
        }
      );

      redirect(
        "/dashboard/health?error=delete-failed"
      );
    }

    redirect(
      "/dashboard/health?success=deleted"
    );
  }

  // -----------------------------------------
  // 3. Get user's farms
  // -----------------------------------------

  const {
    data: farms,
    error: farmsError,
  } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", {
      userId: user.id,
      error: farmsError,
    });
  }

  const safeFarms = farms ?? [];

  const farmIds = safeFarms.map(
    (farm) => farm.id
  );

  // -----------------------------------------
  // 4. Get cows belonging to user's farms
  // -----------------------------------------

  let cows: Cow[] = [];

  if (farmIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("cows")
      .select(`
        id,
        tag_number,
        name,
        breed
      `)
      .in("farm_id", farmIds)
      .order("name");

    if (error) {
      console.error("Cow loading error:", {
        userId: user.id,
        error,
      });
    } else {
      cows = data ?? [];
    }
  }

  // -----------------------------------------
  // 5. Get health records
  // -----------------------------------------

  let healthRecords: HealthRecord[] = [];

  if (cows.length > 0) {
    const cowIds = cows.map(
      (cow) => cow.id
    );

    const {
      data,
      error,
    } = await supabase
      .from("health_records")
      .select(`
        id,
        cow_id,
        event_date,
        event_type,
        diagnosis,
        treatment,
        veterinarian,
        medication,
        cost_ksh,
        notes
      `)
      .in("cow_id", cowIds)
      .order("event_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Health record loading error:",
        {
          userId: user.id,
          error,
        }
      );
    } else {
      healthRecords = data ?? [];
    }
  }

  // -----------------------------------------
  // 6. Build cow lookup
  // -----------------------------------------

  const cowMap = new Map(
    cows.map((cow) => [
      cow.id,
      cow,
    ])
  );

  // -----------------------------------------
  // 7. Dashboard statistics
  // -----------------------------------------

  const totalEvents =
    healthRecords.length;

  const treatmentCount =
    healthRecords.filter(
      (record) =>
        record.event_type
          ?.toLowerCase() ===
        "treatment"
    ).length;

  const veterinaryCount =
    healthRecords.filter(
      (record) =>
        record.event_type
          ?.toLowerCase() ===
        "veterinary visit"
    ).length;

  const totalCost =
    healthRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  // -----------------------------------------
  // 8. Safe date formatting
  // -----------------------------------------

  function formatDate(date: string) {
    const parsed = new Date(
      `${date}T00:00:00`
    );

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Invalid date";
    }

    return parsed.toLocaleDateString(
      "en-KE",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // -----------------------------------------
  // 9. Dashboard
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="border-b border-[#dfe5da] pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#356b3f] transition hover:text-[#254d2d]"
              >
                ← Dashboard
              </Link>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17221a]">
                Health Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f6b61]">
                Monitor diseases, treatments,
                vaccinations, veterinary visits
                and healthcare costs.
              </p>
            </div>

            <Link
              href="/dashboard/health/new"
              className="inline-flex items-center justify-center rounded-lg bg-[#356b3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b5934] focus:outline-none focus:ring-2 focus:ring-[#356b3f] focus:ring-offset-2"
            >
              Record Health Event
            </Link>

          </div>
        </header>

        {/* FEEDBACK */}

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage ===
              "delete-invalid" &&
              "The health record could not be identified."}

            {errorMessage ===
              "delete-failed" &&
              "We could not delete this health record. Please try again."}
          </div>
        )}

        {successMessage ===
          "deleted" && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-[#cfe0d1] bg-[#eef6ef] px-4 py-3 text-sm text-[#315d38]"
          >
            Health record deleted successfully.
          </div>
        )}

        {/* NO FARM */}

        {safeFarms.length === 0 && (
          <section className="mt-8 rounded-xl border border-[#dfe5da] bg-white p-8 shadow-sm">

            <h2 className="text-xl font-semibold text-[#17221a]">
              Add your farm first
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f6b61]">
              Create your farm profile before
              recording cattle health information.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-5 inline-flex rounded-lg bg-[#356b3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b5934]"
            >
              Add Farm
            </Link>

          </section>
        )}

        {/* NO COWS */}

        {safeFarms.length > 0 &&
          cows.length === 0 && (
            <section className="mt-8 rounded-xl border border-[#dfe5da] bg-white p-8 shadow-sm">

              <h2 className="text-xl font-semibold text-[#17221a]">
                No cows registered yet
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f6b61]">
                Register at least one cow before
                recording health information.
              </p>

              <Link
                href="/dashboard/cows/new"
                className="mt-5 inline-flex rounded-lg bg-[#356b3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b5934]"
              >
                Register Cow
              </Link>

            </section>
          )}

        {/* MAIN HEALTH CONTENT */}

        {cows.length > 0 && (
          <>

            {/* STATISTICS */}

            <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

              <div className="rounded-xl border border-[#dfe5da] bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#718074]">
                  Health Events
                </p>

                <p className="mt-2 text-2xl font-semibold text-[#17221a]">
                  {totalEvents}
                </p>
              </div>

              <div className="rounded-xl border border-[#dfe5da] bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#718074]">
                  Treatments
                </p>

                <p className="mt-2 text-2xl font-semibold text-[#17221a]">
                  {treatmentCount}
                </p>
              </div>

              <div className="rounded-xl border border-[#dfe5da] bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#718074]">
                  Vet Visits
                </p>

                <p className="mt-2 text-2xl font-semibold text-[#17221a]">
                  {veterinaryCount}
                </p>
              </div>

              <div className="rounded-xl border border-[#dfe5da] bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#718074]">
                  Health Costs
                </p>

                <p className="mt-2 text-2xl font-semibold text-[#17221a]">
                  KSh{" "}
                  {totalCost.toLocaleString(
                    "en-KE",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>

            </section>

            {/* RECORDS */}

            <section className="mt-8">

              <div className="mb-4 flex items-end justify-between gap-4">

                <div>
                  <h2 className="text-xl font-semibold text-[#17221a]">
                    Health Records
                  </h2>

                  <p className="mt-1 text-sm text-[#68746a]">
                    Review and manage your cattle health history.
                  </p>
                </div>

                <p className="hidden text-sm text-[#718074] sm:block">
                  {totalEvents}{" "}
                  {totalEvents === 1
                    ? "record"
                    : "records"}
                </p>

              </div>

              {healthRecords.length ===
              0 ? (
                <div className="rounded-xl border border-[#dfe5da] bg-white p-10 text-center shadow-sm">

                  <h3 className="text-lg font-semibold text-[#17221a]">
                    No health records yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667268]">
                    Start recording diseases,
                    treatments, vaccinations
                    and veterinary visits.
                  </p>

                  <Link
                    href="/dashboard/health/new"
                    className="mt-5 inline-flex rounded-lg bg-[#356b3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b5934]"
                  >
                    Record First Health Event
                  </Link>

                </div>
              ) : (

                <div className="overflow-hidden rounded-xl border border-[#dfe5da] bg-white shadow-sm">

                  {/* DESKTOP TABLE */}

                  <div className="hidden overflow-x-auto md:block">

                    <table className="min-w-full">

                      <thead className="border-b border-[#e3e8df] bg-[#f8faf7]">
                        <tr>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#68746a]">
                            Cow
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#68746a]">
                            Event
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#68746a]">
                            Date
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#68746a]">
                            Diagnosis
                          </th>

                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#68746a]">
                            Cost
                          </th>

                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#68746a]">
                            Actions
                          </th>

                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#e8ece5]">

                        {healthRecords.map(
                          (record) => {
                            const cow =
                              cowMap.get(
                                record.cow_id
                              );

                            return (
                              <tr
                                key={
                                  record.id
                                }
                                className="transition hover:bg-[#fafcf9]"
                              >

                                <td className="whitespace-nowrap px-5 py-4">
                                  <p className="text-sm font-semibold text-[#17221a]">
                                    {cow?.name ||
                                      "Unnamed Cow"}
                                  </p>

                                  <p className="mt-0.5 text-xs text-[#718074]">
                                    Tag:{" "}
                                    {cow?.tag_number ||
                                      "Not assigned"}
                                  </p>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  <span className="inline-flex rounded-md bg-[#edf5ee] px-2.5 py-1 text-xs font-medium text-[#356b3f]">
                                    {record.event_type}
                                  </span>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4f5d52]">
                                  {formatDate(
                                    record.event_date
                                  )}
                                </td>

                                <td className="max-w-xs px-5 py-4">
                                  <p className="truncate text-sm text-[#263229]">
                                    {record.diagnosis ||
                                      record.treatment ||
                                      record.medication ||
                                      "—"}
                                  </p>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#263229]">
                                  {record.cost_ksh !==
                                  null
                                    ? `KSh ${record.cost_ksh.toLocaleString(
                                        "en-KE"
                                      )}`
                                    : "—"}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">

                                  <div className="flex items-center justify-end gap-4">

                                    <Link
                                      href={`/dashboard/health/${record.id}/edit`}
                                      className="text-sm font-medium text-[#356b3f] transition hover:text-[#244d2c]"
                                    >
                                      Edit
                                    </Link>

                                    <DeleteHealthButton
                                      action={
                                        deleteHealthRecord
                                      }
                                      recordId={
                                        record.id
                                      }
                                    />

                                  </div>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* MOBILE LIST */}

                  <div className="divide-y divide-[#e8ece5] md:hidden">

                    {healthRecords.map(
                      (record) => {
                        const cow =
                          cowMap.get(
                            record.cow_id
                          );

                        return (
                          <div
                            key={
                              record.id
                            }
                            className="p-4"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-[#17221a]">
                                  {cow?.name ||
                                    "Unnamed Cow"}
                                </p>

                                <p className="mt-0.5 text-xs text-[#718074]">
                                  Tag:{" "}
                                  {cow?.tag_number ||
                                    "Not assigned"}
                                </p>

                              </div>

                              <span className="shrink-0 rounded-md bg-[#edf5ee] px-2 py-1 text-xs font-medium text-[#356b3f]">
                                {record.event_type}
                              </span>

                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">

                              <div>
                                <p className="text-xs text-[#718074]">
                                  Date
                                </p>

                                <p className="mt-1 text-[#263229]">
                                  {formatDate(
                                    record.event_date
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-[#718074]">
                                  Cost
                                </p>

                                <p className="mt-1 text-[#263229]">
                                  {record.cost_ksh !==
                                  null
                                    ? `KSh ${record.cost_ksh.toLocaleString(
                                        "en-KE"
                                      )}`
                                    : "—"}
                                </p>
                              </div>

                            </div>

                            <div className="mt-3">

                              <p className="text-xs text-[#718074]">
                                Diagnosis
                              </p>

                              <p className="mt-1 text-sm text-[#263229]">
                                {record.diagnosis ||
                                  record.treatment ||
                                  record.medication ||
                                  "—"}
                              </p>

                            </div>

                            <div className="mt-4 flex items-center gap-4 border-t border-[#e8ece5] pt-3">

                              <Link
                                href={`/dashboard/health/${record.id}/edit`}
                                className="text-sm font-medium text-[#356b3f] transition hover:text-[#244d2c]"
                              >
                                Edit
                              </Link>

                              <DeleteHealthButton
                                action={
                                  deleteHealthRecord
                                }
                                recordId={
                                  record.id
                                }
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

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