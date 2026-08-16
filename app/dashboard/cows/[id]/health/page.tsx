import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Cow = {
  id: string;
  farm_id: string;
  tag_number: string | null;
  name: string | null;
  breed: string | null;
  sex: string | null;
};

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
  created_at: string;
};

export default async function CowHealthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  // 2. Get the cow
  // -----------------------------------------

  const { data: cow, error: cowError } = await supabase
    .from("cows")
    .select(`
      id,
      farm_id,
      tag_number,
      name,
      breed,
      sex
    `)
    .eq("id", id)
    .single();

  if (cowError || !cow) {
    notFound();
  }

  // -----------------------------------------
  // 3. Verify cow belongs to user's farm
  // -----------------------------------------

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("id", cow.farm_id)
    .eq("owner_id", user.id)
    .single();

  if (farmError || !farm) {
    notFound();
  }

  // -----------------------------------------
  // 4. Get health records for this cow
  // -----------------------------------------

  const { data: records, error: recordsError } = await supabase
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
      notes,
      created_at
    `)
    .eq("cow_id", cow.id)
    .order("event_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (recordsError) {
    console.error("Health records error:", recordsError);
  }

  const healthRecords: HealthRecord[] = records ?? [];

  // -----------------------------------------
  // 5. Calculate health statistics
  // -----------------------------------------

  const totalEvents = healthRecords.length;

  const treatmentCount = healthRecords.filter(
    (record) =>
      record.treatment ||
      record.medication
  ).length;

  const vetVisitCount = healthRecords.filter(
    (record) => record.veterinarian
  ).length;

  const totalCost = healthRecords.reduce(
    (sum, record) =>
      sum + Number(record.cost_ksh || 0),
    0
  );

  const cowName =
    cow.name || "Unnamed Cow";

  // -----------------------------------------
  // 6. Page
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* BACK NAVIGATION */}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/dashboard/cows"
            className="font-medium text-green-700 hover:text-green-800"
          >
            ← My Cows
          </Link>

          <span className="text-gray-400">
            /
          </span>

          <Link
            href={`/dashboard/cows/${cow.id}`}
            className="font-medium text-green-700 hover:text-green-800"
          >
            {cowName}
          </Link>

          <span className="text-gray-400">
            /
          </span>

          <span className="text-gray-500">
            Health
          </span>
        </div>

        {/* HEADER */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-3xl">
                ❤️
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {cowName}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Tag: {cow.tag_number || "Not assigned"}
                  {" • "}
                  {cow.breed || "Breed not recorded"}
                  {" • "}
                  {cow.sex || "Sex not recorded"}
                </p>
              </div>

            </div>

            <p className="mt-4 text-gray-600">
              Health Management
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {farm.farm_name}
            </p>
          </div>

          <Link
            href={`/dashboard/cows/${cow.id}/health/new`}
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            + Record Health Event
          </Link>

        </div>

        {/* STATISTICS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Health Events
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalEvents}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Treatments
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {treatmentCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Vet Visits
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {vetVisitCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Health Costs
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              KSh{" "}
              {totalCost.toLocaleString("en-KE", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

        </div>

        {/* HEALTH HISTORY */}

        <section className="mt-8">

          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Health History
            </h2>

            <p className="mt-1 text-gray-600">
              All recorded health events for {cowName}.
            </p>
          </div>

          {healthRecords.length === 0 ? (

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

              <div className="text-5xl">
                ❤️
              </div>

              <h3 className="mt-4 text-xl font-bold text-gray-900">
                No health records yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-gray-600">
                Start recording diseases, treatments,
                vaccinations and veterinary visits for this cow.
              </p>

              <Link
                href={`/dashboard/cows/${cow.id}/health/new`}
                className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Record First Health Event
              </Link>

            </div>

          ) : (

            <div className="space-y-4">

              {healthRecords.map((record) => (

                <div
                  key={record.id}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold text-gray-900">
                          {record.event_type}
                        </h3>

                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                          {new Date(
                            `${record.event_date}T00:00:00`
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>

                      </div>

                      {record.diagnosis && (
                        <p className="mt-3 text-sm">
                          <span className="font-semibold text-gray-700">
                            Diagnosis:
                          </span>{" "}
                          <span className="text-gray-600">
                            {record.diagnosis}
                          </span>
                        </p>
                      )}

                      {record.treatment && (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-gray-700">
                            Treatment:
                          </span>{" "}
                          <span className="text-gray-600">
                            {record.treatment}
                          </span>
                        </p>
                      )}

                      {record.medication && (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-gray-700">
                            Medication:
                          </span>{" "}
                          <span className="text-gray-600">
                            {record.medication}
                          </span>
                        </p>
                      )}

                      {record.veterinarian && (
                        <p className="mt-2 text-sm">
                          <span className="font-semibold text-gray-700">
                            Veterinarian:
                          </span>{" "}
                          <span className="text-gray-600">
                            {record.veterinarian}
                          </span>
                        </p>
                      )}

                      {record.notes && (
                        <div className="mt-4 rounded-xl bg-gray-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Notes
                          </p>

                          <p className="mt-1 text-sm text-gray-700">
                            {record.notes}
                          </p>
                        </div>
                      )}

                    </div>

                    <div className="shrink-0 text-left sm:text-right">

                      {record.cost_ksh !== null && (
                        <>
                          <p className="text-xs text-gray-500">
                            Cost
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            KSh{" "}
                            {Number(
                              record.cost_ksh
                            ).toLocaleString("en-KE", {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </>
                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}