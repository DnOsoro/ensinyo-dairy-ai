import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isFutureDate } from "@/lib/utils/date";
import SubmitButton from "./SubmitButton";

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

type SearchParams = {
  error?: string;
};

const EVENT_TYPES = [
  "Disease",
  "Treatment",
  "Vaccination",
  "Veterinary Visit",
  "Deworming",
  "Injury",
  "Checkup",
  "Other",
] as const;

export default async function NewHealthRecordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // ==================================================
  // 1. AUTHENTICATE USER
  // ==================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // ==================================================
  // 2. LOAD USER'S FARMS
  // ==================================================

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

  // ==================================================
  // 3. LOAD COWS BELONGING TO USER'S FARMS
  // ==================================================

  let cows: Cow[] = [];

  if (farmIds.length > 0) {
    const { data, error } = await supabase
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

    if (error) {
      console.error("Cow loading error:", error);
    } else {
      cows = data ?? [];
    }
  }

  // ==================================================
  // 4. DATE HELPER
  // ==================================================

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  // ==================================================
  // 5. ERROR MESSAGES
  // ==================================================

  const errorMessages: Record<string, string> = {
    missing_fields:
      "Please select a cow, enter the event date, select the health event type and provide a diagnosis.",

    invalid_cow:
      "The selected cow could not be found or does not belong to your farm.",

    duplicate:
      "A health record for this cow, on this date and for this event type already exists.",

    invalid_event_type: "Please select a valid health event type.",

    invalid_date: "Please enter a valid event date.",

    future_date: "Event date cannot be in the future.",

    diagnosis: "Diagnosis must be between 2 and 200 characters.",

    treatment: "Treatment must be 2,000 characters or fewer.",

    medication: "Medication must be 200 characters or fewer.",

    veterinarian: "Veterinarian must be 200 characters or fewer.",

    notes: "Notes must be 2,000 characters or fewer.",

    missing_cost: "Please enter the cost of this health event.",

    invalid_cost: "Please enter a valid non-negative cost.",

    save: "We couldn't save this health record. Please try again.",

    unexpected: "Something went wrong. Please try again.",
  };

  const errorMessage = params.error
    ? errorMessages[params.error] ?? errorMessages.unexpected
    : null;

  // ==================================================
  // 6. PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {/* BACK NAVIGATION */}
        <Link
          href="/dashboard/health"
          className="text-sm font-medium text-green-700 transition hover:text-green-800"
        >
          ← Health Management
        </Link>

        {/* HEADER */}
        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Health Records
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Record Health Event 
          </h1>

          <p className="mt-2 text-gray-600">
            Record a disease, treatment, vaccination, veterinary visit or other
            health event.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
          >
            <div className="font-semibold">Unable to save health record</div>
            <p className="mt-1">{errorMessage}</p>
          </div>
        )}

        {/* NO FARM */}
        {safeFarms.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <div className="text-5xl"></div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>

            <p className="mt-2 text-gray-600">
              You need to create a farm before recording cattle health
              information.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-flex rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Add Farm
            </Link>
          </div>
        )}

        {/* NO COWS */}
        {safeFarms.length > 0 && cows.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <div className="text-5xl"></div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No cows registered
            </h2>

            <p className="mt-2 text-gray-600">
              Register at least one cow before recording a health event.
            </p>

            <Link
              href="/dashboard/cows/new"
              className="mt-6 inline-flex rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Register Cow
            </Link>
          </div>
        )}

        {/* HEALTH RECORD FORM */}
        {cows.length > 0 && (
          <form
            action={async (formData) => {
              "use server";

              const supabase = await createClient();

              // 1. AUTHENTICATE AGAIN
              const {
                data: { user },
                error: actionUserError,
              } = await supabase.auth.getUser();

              if (actionUserError || !user) {
                redirect("/login");
              }

              // 2. READ FORM VALUES
              const cowId = String(formData.get("cow_id") || "").trim();
              const eventDate = String(formData.get("event_date") || "").trim();
              const eventType = String(formData.get("event_type") || "").trim();
              const diagnosis = String(formData.get("diagnosis") || "").trim();
              const treatment = String(formData.get("treatment") || "").trim();
              const veterinarian = String(
                formData.get("veterinarian") || ""
              ).trim();
              const medication = String(
                formData.get("medication") || ""
              ).trim();
              const costValue = String(formData.get("cost_ksh") || "").trim();
              const notes = String(formData.get("notes") || "").trim();

              // 3. REQUIRED FIELD VALIDATION
              if (!cowId || !eventDate || !eventType || !diagnosis) {
                redirect("/dashboard/health/new?error=missing_fields");
              }

              // 4. FUTURE DATE VALIDATION
              if (isFutureDate(eventDate)) {
                redirect("/dashboard/health/new?error=future_date");
              }

              // 5. COST IS REQUIRED
              if (!costValue) {
                redirect("/dashboard/health/new?error=missing_cost");
              }

              // 6. EVENT TYPE VALIDATION
              if (
                !EVENT_TYPES.includes(
                  eventType as (typeof EVENT_TYPES)[number]
                )
              ) {
                redirect("/dashboard/health/new?error=invalid_event_type");
              }

              // 7. DATE FORMAT VALIDATION
              if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
                redirect("/dashboard/health/new?error=invalid_date");
              }

              const parsedDate = new Date(`${eventDate}T00:00:00`);

              if (Number.isNaN(parsedDate.getTime())) {
                redirect("/dashboard/health/new?error=invalid_date");
              }

              // 8. TEXT LENGTH VALIDATION
              if (diagnosis.length < 2 || diagnosis.length > 200) {
                redirect("/dashboard/health/new?error=diagnosis");
              }

              if (treatment.length > 2000) {
                redirect("/dashboard/health/new?error=treatment");
              }

              if (medication.length > 200) {
                redirect("/dashboard/health/new?error=medication");
              }

              if (veterinarian.length > 200) {
                redirect("/dashboard/health/new?error=veterinarian");
              }

              if (notes.length > 2000) {
                redirect("/dashboard/health/new?error=notes");
              }

              // 9. COST VALIDATION
              const cost = Number(costValue);

              if (!Number.isFinite(cost) || cost < 0) {
                redirect("/dashboard/health/new?error=invalid_cost");
              }

              // 10. VERIFY COW OWNERSHIP
              const { data: cow, error: cowError } = await supabase
                .from("cows")
                .select(
                  `
                  id,
                  farm_id,
                  farms!inner (
                    id,
                    owner_id
                  )
                `
                )
                .eq("id", cowId)
                .eq("farms.owner_id", user.id)
                .single();

              if (cowError || !cow) {
                console.error("Cow ownership validation error:", {
                  userId: user.id,
                  cowId,
                  error: cowError,
                });

                redirect("/dashboard/health/new?error=invalid_cow");
              }

              // 11. INSERT HEALTH RECORD
              const { error: insertError } = await supabase
                .from("health_records")
                .insert({
                  cow_id: cow.id,
                  event_date: eventDate,
                  event_type: eventType,
                  diagnosis: diagnosis,
                  treatment: treatment || null,
                  veterinarian: veterinarian || null,
                  medication: medication || null,
                  cost_ksh: cost,
                  notes: notes || null,
                });

              // 12. DATABASE ERROR
              if (insertError) {
                console.error("Health record insert error:", {
                  userId: user.id,
                  cowId: cow.id,
                  error: insertError,
                });

                // PostgreSQL unique-constraint violation
                if (insertError.code === "23505") {
                  redirect("/dashboard/health/new?error=duplicate");
                }

                redirect("/dashboard/health/new?error=save");
              }

              // 13. SUCCESS
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
                Cow <span className="text-red-600">*</span>
              </label>

              <select
                id="cow_id"
                name="cow_id"
                required
                defaultValue=""
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="" disabled>
                  Select cow
                </option>

                {cows.map((cow) => {
                  const details = [
                    cow.tag_number ? `Tag ${cow.tag_number}` : null,
                    cow.breed,
                  ]
                    .filter(Boolean)
                    .join(" — ");

                  return (
                    <option key={cow.id} value={cow.id}>
                      {cow.name || "Unnamed Cow"}
                      {details ? ` — ${details}` : ""}
                    </option>
                  );
                })}
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Select the animal whose health event you want to record.
              </p>
            </div>

            {/* EVENT DATE */}
            <div className="mt-6">
              <label
                htmlFor="event_date"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Event date <span className="text-red-600">*</span>
              </label>

              <input
                id="event_date"
                name="event_date"
                type="date"
                required
                max={today}
                defaultValue={today}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* EVENT TYPE */}
            <div className="mt-6">
              <label
                htmlFor="event_type"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Health event type <span className="text-red-600">*</span>
              </label>

              <select
                id="event_type"
                name="event_type"
                required
                defaultValue=""
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="" disabled>
                  Select event type
                </option>

                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* DIAGNOSIS */}
            <div className="mt-6">
              <label
                htmlFor="diagnosis"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Diagnosis <span className="text-red-600">*</span>
              </label>

              <input
                id="diagnosis"
                name="diagnosis"
                type="text"
                required
                minLength={2}
                maxLength={200}
                placeholder="e.g. Mastitis, Fever, Routine checkup"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Briefly describe the health condition or reason for the visit.
              </p>
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
                rows={4}
                maxLength={2000}
                placeholder="Describe the treatment given, if any..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-2 text-xs text-gray-500">Optional.</p>
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
                maxLength={200}
                placeholder="e.g. Antibiotics"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-2 text-xs text-gray-500">Optional.</p>
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
                maxLength={200}
                placeholder="e.g. Dr. Otieno"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-2 text-xs text-gray-500">Optional.</p>
            </div>

            {/* COST */}
            <div className="mt-6">
              <label
                htmlFor="cost_ksh"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Cost (KSh) <span className="text-red-600">*</span>
              </label>

              <input
                id="cost_ksh"
                name="cost_ksh"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="e.g. 1500"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Required. Enter the amount spent on this health event.
              </p>
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
                maxLength={2000}
                placeholder="Additional information..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Optional. Add anything that may be useful when reviewing this
                animal&apos;s health history later.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row">
              <Link
                href="/dashboard/health"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>

              <SubmitButton pendingText="Saving health event...">
                Save Health Event
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}