import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export default async function NewHealthRecordPage() {
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

  const safeFarms: Farm[] = farms ?? [];

  const farmIds = safeFarms.map((farm) => farm.id);

  // -----------------------------------------
  // 3. Get cows from user's farms
  // -----------------------------------------

  let cows: Cow[] = [];

  if (farmIds.length > 0) {
    const { data, error } = await supabase
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

    if (error) {
      console.error("Cow loading error:", error);
    } else {
      cows = data ?? [];
    }
  }

  // -----------------------------------------
  // 4. Page
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* BACK */}

        <Link
          href="/dashboard/health"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Health Management
        </Link>

        {/* HEADER */}

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Record Health Event ❤️
          </h1>

          <p className="mt-2 text-gray-600">
            Record a disease, treatment, vaccination,
            veterinary visit or other health event.
          </p>
        </div>

        {/* NO FARM */}

        {safeFarms.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              🌱
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>

            <p className="mt-2 text-gray-600">
              You need to create a farm before recording
              cattle health information.
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
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              🐄
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No cows registered
            </h2>

            <p className="mt-2 text-gray-600">
              Register at least one cow before recording
              a health event.
            </p>

            <Link
              href="/dashboard/cows/new"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Register Cow
            </Link>

          </div>
        )}

        {/* FORM */}

        {cows.length > 0 && (
          <form
            action={async (formData) => {
              "use server";

              const supabase = await createClient();

              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                redirect("/login");
              }

              const cowId = String(
                formData.get("cow_id") || ""
              );

              const eventDate = String(
                formData.get("event_date") || ""
              );

              const eventType = String(
                formData.get("event_type") || ""
              );

              const diagnosis = String(
                formData.get("diagnosis") || ""
              );

              const treatment = String(
                formData.get("treatment") || ""
              );

              const veterinarian = String(
                formData.get("veterinarian") || ""
              );

              const medication = String(
                formData.get("medication") || ""
              );

              const costValue = String(
                formData.get("cost_ksh") || ""
              );

              const notes = String(
                formData.get("notes") || ""
              );

              if (!cowId || !eventDate || !eventType) {
                redirect("/dashboard/health/new");
              }

              // -----------------------------------------
              // Verify cow belongs to the logged-in user
              // -----------------------------------------

              const { data: cow } = await supabase
                .from("cows")
                .select(`
                  id,
                  farm_id
                `)
                .eq("id", cowId)
                .single();

              if (!cow) {
                redirect("/dashboard/health/new");
              }

              const { data: farm } = await supabase
                .from("farms")
                .select("id")
                .eq("id", cow.farm_id)
                .eq("owner_id", user.id)
                .single();

              if (!farm) {
                redirect("/dashboard/health/new");
              }

              // -----------------------------------------
              // Convert cost
              // -----------------------------------------

              const cost =
                costValue.trim() === ""
                  ? null
                  : Number(costValue);

              if (
                cost !== null &&
                (Number.isNaN(cost) || cost < 0)
              ) {
                redirect("/dashboard/health/new");
              }

              // -----------------------------------------
              // Insert health record
              // -----------------------------------------

              const { error } = await supabase
                .from("health_records")
                .insert({
                  cow_id: cow.id,
                  event_date: eventDate,
                  event_type: eventType,
                  diagnosis:
                    diagnosis.trim() || null,
                  treatment:
                    treatment.trim() || null,
                  veterinarian:
                    veterinarian.trim() || null,
                  medication:
                    medication.trim() || null,
                  cost_ksh: cost,
                  notes:
                    notes.trim() || null,
                });

              if (error) {
                console.error(
                  "Health record insert error:",
                  error
                );

                redirect(
                  "/dashboard/health/new?error=save"
                );
              }

              redirect("/dashboard/health");
            }}
            className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
          >

            {/* COW */}

            <div>
              <label
                htmlFor="cow_id"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Cow
              </label>

              <select
                id="cow_id"
                name="cow_id"
                required
                defaultValue=""
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="" disabled>
                  Select cow
                </option>

                {cows.map((cow) => {
                  const details = [
                    cow.tag_number
                      ? `Tag ${cow.tag_number}`
                      : null,
                    cow.breed,
                  ]
                    .filter(Boolean)
                    .join(" — ");

                  return (
                    <option
                      key={cow.id}
                      value={cow.id}
                    >
                      {cow.name || "Unnamed Cow"}
                      {details
                        ? ` — ${details}`
                        : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* EVENT DATE */}

            <div className="mt-6">
              <label
                htmlFor="event_date"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Event date
              </label>

              <input
                id="event_date"
                name="event_date"
                type="date"
                required
                defaultValue={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* EVENT TYPE */}

            <div className="mt-6">
              <label
                htmlFor="event_type"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Health event type
              </label>

              <select
                id="event_type"
                name="event_type"
                required
                defaultValue=""
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="" disabled>
                  Select event type
                </option>

                <option value="Disease">
                  Disease
                </option>

                <option value="Treatment">
                  Treatment
                </option>

                <option value="Vaccination">
                  Vaccination
                </option>

                <option value="Veterinary Visit">
                  Veterinary Visit
                </option>

                <option value="Deworming">
                  Deworming
                </option>

                <option value="Injury">
                  Injury
                </option>

                <option value="Checkup">
                  Checkup
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* DIAGNOSIS */}

            <div className="mt-6">
              <label
                htmlFor="diagnosis"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Diagnosis
              </label>

              <input
                id="diagnosis"
                name="diagnosis"
                type="text"
                placeholder="e.g. Mastitis"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* TREATMENT */}

            <div className="mt-6">
              <label
                htmlFor="treatment"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Treatment
              </label>

              <textarea
                id="treatment"
                name="treatment"
                rows={3}
                placeholder="Describe the treatment given..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* MEDICATION */}

            <div className="mt-6">
              <label
                htmlFor="medication"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Medication
              </label>

              <input
                id="medication"
                name="medication"
                type="text"
                placeholder="e.g. Antibiotics"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* VETERINARIAN */}

            <div className="mt-6">
              <label
                htmlFor="veterinarian"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Veterinarian
              </label>

              <input
                id="veterinarian"
                name="veterinarian"
                type="text"
                placeholder="e.g. Dr. Otieno"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* COST */}

            <div className="mt-6">
              <label
                htmlFor="cost_ksh"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Cost (KSh)
              </label>

              <input
                id="cost_ksh"
                name="cost_ksh"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1500"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* NOTES */}

            <div className="mt-6">
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Additional information..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* BUTTONS */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/dashboard/health"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Save Health Event
              </button>

            </div>

          </form>
        )}

      </div>
    </main>
  );
}