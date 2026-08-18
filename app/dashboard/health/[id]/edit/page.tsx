import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isFutureDate } from "@/lib/utils/date";
import SubmitButton from "../../new/SubmitButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
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
};

type Cow = {
  id: string;
  tag_number: string | null;
  name: string | null;
  breed: string | null;
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

export default async function EditHealthRecordPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();

  // -----------------------------------------
  // 1. Authenticate user
  // -----------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // -----------------------------------------
  // 2. Load health record
  //
  // Supabase RLS controls whether the current
  // farmer is allowed to access this record.
  // -----------------------------------------

  const { data: record, error: recordError } =
    await supabase
      .from("health_records")
      .select(
        `
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
        `
      )
      .eq("id", id)
      .single();

  if (recordError || !record) {
    console.error(
      "Health record loading error:",
      recordError
    );

    notFound();
  }

  const healthRecord = record as HealthRecord;

  // -----------------------------------------
  // 3. Load associated cow
  // -----------------------------------------

  const { data: cow, error: cowError } =
    await supabase
      .from("cows")
      .select(
        `
          id,
          tag_number,
          name,
          breed
        `
      )
      .eq("id", healthRecord.cow_id)
      .single();

  if (cowError || !cow) {
    console.error(
      "Cow loading error:",
      cowError
    );

    notFound();
  }

  const selectedCow = cow as Cow;

  // -----------------------------------------
  // 4. Update health record
  // -----------------------------------------

  async function updateHealthRecord(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    // ---------------------------------------
    // Authenticate again inside server action
    // ---------------------------------------

    const {
      data: { user },
      error: actionUserError,
    } = await supabase.auth.getUser();

    if (actionUserError || !user) {
      redirect("/login");
    }

    // ---------------------------------------
    // Read submitted values
    // ---------------------------------------

    const cowId = String(
      formData.get("cow_id") || ""
    ).trim();

    const eventDate = String(
      formData.get("event_date") || ""
    ).trim();

    const eventType = String(
      formData.get("event_type") || ""
    ).trim();

    const diagnosis = String(
      formData.get("diagnosis") || ""
    ).trim();

    const treatment = String(
      formData.get("treatment") || ""
    ).trim();

    const medication = String(
      formData.get("medication") || ""
    ).trim();

    const veterinarian = String(
      formData.get("veterinarian") || ""
    ).trim();

    const costValue = String(
      formData.get("cost_ksh") || ""
    ).trim();

    const notes = String(
      formData.get("notes") || ""
    ).trim();

    // ---------------------------------------
    // 5. Required fields
    //
    // Only the core health-event information
    // is required.
    // ---------------------------------------

    if (
      !cowId ||
      !eventDate ||
      !eventType ||
      !diagnosis
    ) {
      redirect(
        `/dashboard/health/${id}/edit?error=required`
      );
    }

    if (isFutureDate(eventDate)) {
      redirect(
        `/dashboard/health/${id}/edit?error=future_date`
      );
    }

    // ---------------------------------------
    // 6. Validate event type
    // ---------------------------------------

    if (
      !EVENT_TYPES.includes(
        eventType as (typeof EVENT_TYPES)[number]
      )
    ) {
      redirect(
        `/dashboard/health/${id}/edit?error=event_type`
      );
    }

    // ---------------------------------------
    // 7. Validate date
    // ---------------------------------------

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ) {
      redirect(
        `/dashboard/health/${id}/edit?error=date`
      );
    }

    const parsedDate = new Date(
      `${eventDate}T00:00:00`
    );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      redirect(
        `/dashboard/health/${id}/edit?error=date`
      );
    }

    // ---------------------------------------
    // 8. Validate text lengths
    // ---------------------------------------

    if (diagnosis.length > 200) {
      redirect(
        `/dashboard/health/${id}/edit?error=diagnosis`
      );
    }

    if (treatment.length > 2000) {
      redirect(
        `/dashboard/health/${id}/edit?error=treatment`
      );
    }

    if (medication.length > 200) {
      redirect(
        `/dashboard/health/${id}/edit?error=medication`
      );
    }

    if (veterinarian.length > 200) {
      redirect(
        `/dashboard/health/${id}/edit?error=veterinarian`
      );
    }

    if (notes.length > 2000) {
      redirect(
        `/dashboard/health/${id}/edit?error=notes`
      );
    }

    // ---------------------------------------
    // 9. Validate cost
    //
    // Cost is optional.
    // ---------------------------------------

    let cost: number | null = null;

    if (costValue) {
      const parsedCost = Number(costValue);

      if (
        !Number.isFinite(parsedCost) ||
        parsedCost < 0
      ) {
        redirect(
          `/dashboard/health/${id}/edit?error=cost`
        );
      }

      cost = parsedCost;
    }

    // ---------------------------------------
    // 10. Prevent cow reassignment
    //
    // Existing health history remains attached
    // to the original cow.
    // ---------------------------------------

    if (
      cowId !== healthRecord.cow_id
    ) {
      redirect(
        `/dashboard/health/${id}/edit?error=cow`
      );
    }

    // ---------------------------------------
    // 11. Update record
    //
    // RLS remains the final authorization layer.
    // ---------------------------------------

    const {
      data: updatedRecord,
      error,
    } = await supabase
      .from("health_records")
      .update({
        cow_id: healthRecord.cow_id,
        event_date: eventDate,
        event_type: eventType,
        diagnosis,
        treatment: treatment || null,
        veterinarian: veterinarian || null,
        medication: medication || null,
        cost_ksh: cost,
        notes: notes || null,
      })
      .eq("id", id)
      .select("id")
      .single();

    // ---------------------------------------
    // 12. Handle database failure
    // ---------------------------------------

    if (error || !updatedRecord) {
      console.error(
        "Health record update error:",
        {
          userId: user.id,
          recordId: id,
          error,
        }
      );

      redirect(
        `/dashboard/health/${id}/edit?error=save`
      );
    }

    // ---------------------------------------
    // 13. Successful update
    // ---------------------------------------

    redirect("/dashboard/health");
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* BACK NAVIGATION */}

        <Link
          href="/dashboard/health"
          className="inline-flex items-center text-sm font-medium text-green-800 transition hover:text-green-900"
        >
          ← Health Management
        </Link>

        {/* HEADER */}

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Health Records
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Edit Health Event
          </h1>

          <p className="mt-2 text-gray-600">
            Update the health information recorded
            for this animal.
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {errorMessage === "required" &&
              "Please provide the cow, event date, event type and diagnosis."}

            {errorMessage === "future_date" &&
              "Event date cannot be in the future."}

            {errorMessage === "event_type" &&
              "Please select a valid health event type."}

            {errorMessage === "date" &&
              "Please enter a valid event date."}

            {errorMessage === "diagnosis" &&
              "Diagnosis must be 200 characters or fewer."}

            {errorMessage === "treatment" &&
              "Treatment must be 2,000 characters or fewer."}

            {errorMessage === "medication" &&
              "Medication must be 200 characters or fewer."}

            {errorMessage === "veterinarian" &&
              "Veterinarian must be 200 characters or fewer."}

            {errorMessage === "notes" &&
              "Notes must be 2,000 characters or fewer."}

            {errorMessage === "cost" &&
              "Please enter a valid non-negative cost."}

            {errorMessage === "cow" &&
              "The animal associated with this health record cannot be changed."}

            {errorMessage === "save" &&
              "We could not update this health record. Please try again."}
          </div>
        )}

        {/* FORM */}

        <form
          action={updateHealthRecord}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
        >

          {/* FORM INTRO */}

          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Health Event Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Fields marked with{" "}
              <span className="font-semibold text-red-600">
                *
              </span>{" "}
              are required.
            </p>
          </div>

          {/* COW */}

          <div className="mt-6">
            <label
              htmlFor="cow_id"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Cow{" "}
              <span className="text-red-600">
                *
              </span>
            </label>

            <select
              id="cow_id"
              name="cow_display"
              disabled
              defaultValue={selectedCow.id}
              className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-900 outline-none"
            >
              <option value={selectedCow.id}>
                {selectedCow.name ||
                  "Unnamed Cow"}
                {selectedCow.tag_number
                  ? ` — Tag ${selectedCow.tag_number}`
                  : ""}
                {selectedCow.breed
                  ? ` — ${selectedCow.breed}`
                  : ""}
              </option>
            </select>

            <input
              type="hidden"
              name="cow_id"
              value={selectedCow.id}
            />

            <p className="mt-2 text-xs text-gray-500">
              The animal linked to an existing
              health event cannot be changed here.
            </p>
          </div>

          {/* EVENT DATE */}

          <div className="mt-6">
            <label
              htmlFor="event_date"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Event date{" "}
              <span className="text-red-600">
                *
              </span>
            </label>

            <input
              id="event_date"
              name="event_date"
              type="date"
              required
              max={new Intl.DateTimeFormat("en-CA", {
                timeZone: "Africa/Nairobi",
              }).format(new Date())}
              defaultValue={
                healthRecord.event_date
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* EVENT TYPE */}

          <div className="mt-6">
            <label
              htmlFor="event_type"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Health event type{" "}
              <span className="text-red-600">
                *
              </span>
            </label>

            <select
              id="event_type"
              name="event_type"
              required
              defaultValue={
                healthRecord.event_type
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
            >
              <option
                value=""
                disabled
              >
                Select event type
              </option>

              {EVENT_TYPES.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* DIAGNOSIS */}

          <div className="mt-6">
            <label
              htmlFor="diagnosis"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Diagnosis{" "}
              <span className="text-red-600">
                *
              </span>
            </label>

            <input
              id="diagnosis"
              name="diagnosis"
              type="text"
              required
              minLength={2}
              maxLength={200}
              defaultValue={
                healthRecord.diagnosis ?? ""
              }
              placeholder="e.g. Mastitis"
              className="w-full rounded-xl border border-gray-300 bg-[#ffffff] px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* TREATMENT */}

          <div className="mt-6">
            <label
              htmlFor="treatment"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Treatment
            </label>

            <textarea
              id="treatment"
              name="treatment"
              rows={4}
              maxLength={2000}
              defaultValue={
                healthRecord.treatment ?? ""
              }
              placeholder="Describe the treatment given, if any..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* MEDICATION */}

          <div className="mt-6">
            <label
              htmlFor="medication"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Medication
            </label>

            <input
              id="medication"
              name="medication"
              type="text"
              maxLength={200}
              defaultValue={
                healthRecord.medication ?? ""
              }
              placeholder="e.g. Antibiotics"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* VETERINARIAN */}

          <div className="mt-6">
            <label
              htmlFor="veterinarian"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Veterinarian
            </label>

            <input
              id="veterinarian"
              name="veterinarian"
              type="text"
              maxLength={200}
              defaultValue={
                healthRecord.veterinarian ?? ""
              }
              placeholder="e.g. Dr. Otieno"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* COST */}

          <div className="mt-6">
            <label
              htmlFor="cost_ksh"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Cost (KSh)
            </label>

            <input
              id="cost_ksh"
              name="cost_ksh"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                healthRecord.cost_ksh ?? ""
              }
              placeholder="e.g. 1500"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Optional. Leave blank if there was no
              recorded cost.
            </p>
          </div>

          {/* NOTES */}

          <div className="mt-6">
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={2000}
              defaultValue={
                healthRecord.notes ?? ""
              }
              placeholder="Additional information..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Optional. Add any additional
              information that may be useful later.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row">

            <Link
              href="/dashboard/health"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <SubmitButton
              pendingText="Saving changes..."
            >
              Save Changes
            </SubmitButton>

          </div>
        </form>

        {/* SECURITY NOTE */}

        <p className="mt-5 text-center text-xs text-gray-500">
          Your health records are protected by
          database-level access controls.
        </p>

      </div>
    </main>
  );
}