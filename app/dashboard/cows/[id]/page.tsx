import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteCowButton from "./DeleteCowButton";

export default async function CowProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  // 2. Get cow ID
  // -----------------------------------------

  const { id } = await params;

  // -----------------------------------------
  // 3. Get cow
  // -----------------------------------------

  const { data: cow, error: cowError } = await supabase
    .from("cows")
    .select(`
      id,
      farm_id,
      tag_number,
      name,
      breed,
      sex,
      date_of_birth,
      color,
      weight_kg,
      status,
      pregnancy_status,
      notes,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (cowError) {
    console.error("Cow loading error:", cowError);
  }

  if (!cow) {
    notFound();
  }

  // -----------------------------------------
  // 4. Get farm belonging to logged-in user
  // -----------------------------------------

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select(`
      id,
      farm_name,
      location,
      county
    `)
    .eq("id", cow.farm_id)
    .eq("owner_id", user.id)
    .single();

  if (farmError) {
    console.error("Farm loading error:", farmError);
  }

  if (!farm) {
    notFound();
  }

  // -----------------------------------------
  // 5. Format date of birth
  // -----------------------------------------

  const formattedDateOfBirth = cow.date_of_birth
    ? new Date(cow.date_of_birth).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not recorded";

  // -----------------------------------------
  // 6. Format registration date
  // -----------------------------------------

  const formattedCreatedAt = new Date(
    cow.created_at
  ).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // -----------------------------------------
  // 7. Calculate approximate age
  // -----------------------------------------

  let ageText = "Not recorded";

  if (cow.date_of_birth) {
    const birthDate = new Date(cow.date_of_birth);
    const today = new Date();

    let years =
      today.getFullYear() -
      birthDate.getFullYear();

    let months =
      today.getMonth() -
      birthDate.getMonth();

    if (
      months < 0 ||
      (months === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      years--;
      months += 12;
    }

    if (years > 0) {
      ageText = `${years} ${
        years === 1 ? "year" : "years"
      } old`;
    } else {
      ageText = `${months} ${
        months === 1 ? "month" : "months"
      } old`;
    }
  }

  // -----------------------------------------
  // 8. Cow profile
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* BACK LINK */}

        <Link
          href="/dashboard/cows"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← My Cows
        </Link>

        {/* HEADER */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-5">

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-green-100 text-4xl">
                
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h1 className="text-3xl font-bold text-gray-900">
                    {cow.name || "Unnamed Cow"}
                  </h1>

                  {cow.status && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {cow.status}
                    </span>
                  )}

                </div>

                <p className="mt-2 text-gray-500">
                  Tag:{" "}
                  <span className="font-medium text-gray-800">
                    {cow.tag_number || "Not assigned"}
                  </span>
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {cow.breed || "Breed not recorded"}
                  {" • "}
                  {cow.sex || "Sex not recorded"}
                </p>

              </div>

            </div>

            {/* MANAGEMENT ACTION BUTTONS */}

            <div className="flex flex-wrap items-start gap-3">

              <Link
                href={`/dashboard/cows/${cow.id}/edit`}
                className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Edit Cow
              </Link>

              <DeleteCowButton
                cowId={cow.id}
                cowName={cow.name || "this cow"}
              />

              <Link
                href="/dashboard/cows"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to My Cows
              </Link>

            </div>

          </div>
        </div>

        {/* FARM */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          <p className="text-sm text-gray-500">
            Farm
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {farm.farm_name}
          </h2>

          {(farm.location || farm.county) && (
            <p className="mt-1 text-sm text-gray-500">
              {[farm.location, farm.county]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

        </div>

        {/* BASIC INFORMATION */}

        <section className="mt-6">

          <h2 className="text-xl font-bold text-gray-900">
            Basic Information
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* BREED */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Breed
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {cow.breed || "Not recorded"}
              </p>
            </div>

            {/* SEX */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Sex
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {cow.sex || "Not recorded"}
              </p>
            </div>

            {/* DATE OF BIRTH */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Date of birth
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {formattedDateOfBirth}
              </p>
            </div>

            {/* AGE */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Age
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {ageText}
              </p>
            </div>

            {/* WEIGHT */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Weight
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {cow.weight_kg !== null
                  ? `${cow.weight_kg} kg`
                  : "Not recorded"}
              </p>
            </div>

            {/* COLOR */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Color
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {cow.color || "Not recorded"}
              </p>
            </div>

            {/* PREGNANCY */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Pregnancy
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {cow.pregnancy_status || "Not recorded"}
              </p>
            </div>

            {/* REGISTERED */}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Registered
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {formattedCreatedAt}
              </p>
            </div>

          </div>

        </section>

        {/* NOTES */}

        <section className="mt-6">

          <h2 className="text-xl font-bold text-gray-900">
            Notes
          </h2>

          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <p className="whitespace-pre-wrap text-gray-700">
              {cow.notes ||
                "No additional notes recorded for this cow."}
            </p>

          </div>

        </section>

        {/* COW MANAGEMENT */}

        <section className="mt-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Cow Management
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage the health, milk, breeding and performance of this cow.
              </p>
            </div>

          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* MILK */}

            <Link
              href={`/dashboard/milk?cow=${cow.id}`}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl">
                
              </div>

              <h3 className="mt-4 font-bold text-gray-900 group-hover:text-green-700">
                Milk Production
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Record and analyze daily milk production.
              </p>

              <div className="mt-4 text-sm font-semibold text-green-700">
                Open Milk →
              </div>

            </Link>

            {/* HEALTH */}

            <Link
              href={`/dashboard/health?cow=${cow.id}`}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
                
              </div>

              <h3 className="mt-4 font-bold text-gray-900 group-hover:text-green-700">
                Health Management
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Track diseases, treatments, vaccinations and veterinary care.
              </p>

              <div className="mt-4 text-sm font-semibold text-green-700">
                Open Health →
              </div>

            </Link>

            {/* BREEDING */}

            <Link
              href={`/dashboard/cows/${cow.id}/breeding`}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-2xl">
                
              </div>

              <h3 className="mt-4 font-bold text-gray-900 group-hover:text-green-700">
                Breeding
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Track mating, insemination, pregnancy and calving.
              </p>

              <div className="mt-4 text-sm font-semibold text-green-700">
                Open Breeding →
              </div>

            </Link>

            {/* ANALYTICS */}

            <Link
              href={`/dashboard/analytics?cow=${cow.id}`}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-2xl">
                
              </div>

              <h3 className="mt-4 font-bold text-gray-900 group-hover:text-green-700">
                Analytics
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Understand this cow&apos;s milk, health and overall performance.
              </p>

              <div className="mt-4 text-sm font-semibold text-green-700">
                View Analytics →
              </div>

            </Link>

          </div>

        </section>

        {/* QUICK HEALTH ACTION */}

        <section className="mt-6">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-2xl">
                  
                </div>

                <div>

                  <h2 className="font-bold text-gray-900">
                    Health Management
                  </h2>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                    Keep a complete health history for {cow.name || "this cow"},
                    including diseases, treatments, medication, veterinary
                    visits and health costs.
                  </p>

                </div>

              </div>

              <Link
                href={`/dashboard/health?cow=${cow.id}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Manage Health →
              </Link>

            </div>

          </div>

        </section>

        {/* FOOTER */}

        <div className="mt-8">

          <Link
            href="/dashboard/cows"
            className="inline-flex rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to My Cows
          </Link>

        </div>

      </div>
    </main>
  );
}