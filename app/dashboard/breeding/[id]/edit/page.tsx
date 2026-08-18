import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBreedingRecordPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

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
  // GET RECORD
  // -----------------------------------------

  const { data: record, error: recordError } =
    await supabase
      .from("breeding_records")
      .select(`
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
        semen_code,
        pregnancy_status,
        pregnancy_check_date,
        calving_outcome,
        calf_count,
        veterinarian,
        cost_ksh
      `)
      .eq("id", id)
      .single();

  if (recordError || !record) {
    redirect("/dashboard/breeding");
  }

  // -----------------------------------------
  // VERIFY COW / FARM OWNERSHIP
  // -----------------------------------------

  const { data: cow, error: cowError } =
    await supabase
      .from("cows")
      .select(`
        id,
        farm_id,
        name,
        tag_number,
        breed
      `)
      .eq("id", record.cow_id)
      .single();

  if (cowError || !cow) {
    redirect("/dashboard/breeding");
  }

  const { data: farm, error: farmError } =
    await supabase
      .from("farms")
      .select("id, farm_name")
      .eq("id", cow.farm_id)
      .eq("owner_id", user.id)
      .single();

  if (farmError || !farm) {
    redirect("/dashboard/breeding");
  }

  // -----------------------------------------
  // UPDATE SERVER ACTION
  // -----------------------------------------

  async function updateBreedingRecord(
    formData: FormData
  ) {
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

    const cowId = String(
      formData.get("cow_id") || ""
    ).trim();

    const breedingDate = String(
      formData.get("breeding_date") || ""
    ).trim();

    const eventType = String(
      formData.get("event_type") || ""
    ).trim();

    const breedingMethod = String(
      formData.get("breeding_method") || ""
    ).trim();

    const bullName = String(
      formData.get("bull_name") || ""
    ).trim();

    const semenCode = String(
      formData.get("semen_code") || ""
    ).trim();

    const pregnancyStatus = String(
      formData.get("pregnancy_status") || ""
    ).trim();

    const pregnancyCheckDate = String(
      formData.get("pregnancy_check_date") || ""
    ).trim();

    const expectedCalvingDate = String(
      formData.get("expected_calving_date") || ""
    ).trim();

    const actualCalvingDate = String(
      formData.get("actual_calving_date") || ""
    ).trim();

    const calvingOutcome = String(
      formData.get("calving_outcome") || ""
    ).trim();

    const calfCountValue = String(
      formData.get("calf_count") || ""
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

    if (
      !recordId ||
      !cowId ||
      !breedingDate ||
      !eventType
    ) {
      throw new Error(
        "Cow, event date and event type are required."
      );
    }

    // Validate event date (cannot be in the future)
    const today = new Date().toISOString().split("T")[0];
    if (breedingDate > today) {
      throw new Error("Event date cannot be in the future.");
    }

    // -----------------------------------------
    // VERIFY OWNERSHIP
    // -----------------------------------------

    const { data: selectedCow, error: selectedCowError } =
      await supabase
        .from("cows")
        .select("id, farm_id")
        .eq("id", cowId)
        .single();

    if (
      selectedCowError ||
      !selectedCow
    ) {
      throw new Error(
        "The selected cow could not be found."
      );
    }

    const { data: farm } =
      await supabase
        .from("farms")
        .select("id")
        .eq("id", selectedCow.farm_id)
        .eq("owner_id", user.id)
        .single();

    if (!farm) {
      throw new Error(
        "You are not authorized to update this record."
      );
    }

    // -----------------------------------------
    // NUMERIC VALUES
    // -----------------------------------------

    const calfCount =
      calfCountValue !== ""
        ? Number(calfCountValue)
        : null;

    const costKsh =
      costValue !== ""
        ? Number(costValue)
        : null;

    if (
      calfCount !== null &&
      (!Number.isInteger(calfCount) ||
        calfCount < 0)
    ) {
      throw new Error(
        "Number of calves must be a valid whole number."
      );
    }

    if (
      costKsh !== null &&
      (!Number.isFinite(costKsh) ||
        costKsh < 0)
    ) {
      throw new Error(
        "Cost must be a valid number."
      );
    }

    // -----------------------------------------
    // UPDATE
    // -----------------------------------------

    const { error: updateError } =
      await supabase
        .from("breeding_records")
        .update({
          cow_id: cowId,
          breeding_date: breedingDate,
          breeding_method:
            breedingMethod || null,
          bull_name:
            bullName || null,
          semen_code:
            semenCode || null,
          expected_calving_date:
            expectedCalvingDate || null,
          actual_calving_date:
            actualCalvingDate || null,
          outcome:
            calvingOutcome || null,
          notes:
            notes || null,
          event_type:
            eventType || null,
          pregnancy_status:
            pregnancyStatus || null,
          pregnancy_check_date:
            pregnancyCheckDate || null,
          calving_outcome:
            calvingOutcome || null,
          calf_count: calfCount,
          veterinarian:
            veterinarian || null,
          cost_ksh: costKsh,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordId);

    if (updateError) {
      console.error(
        "Breeding update error:",
        updateError
      );

      throw new Error(
        `Could not update breeding record: ${updateError.message}`
      );
    }

    // -----------------------------------------
    // UPDATE COW PREGNANCY STATUS
    // -----------------------------------------

    if (pregnancyStatus) {
      const { error: cowUpdateError } =
        await supabase
          .from("cows")
          .update({
            pregnancy_status:
              pregnancyStatus,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", cowId);

      if (cowUpdateError) {
        console.error(
          "Cow pregnancy status update error:",
          cowUpdateError
        );
      }
    }

    redirect("/dashboard/breeding");
  }

  // -----------------------------------------
  // PAGE
  // -----------------------------------------

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/dashboard/breeding"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Breeding Management
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Breeding Record
          </h1>

          <p className="mt-2 text-gray-600">
            Update the breeding, pregnancy and
            calving information for this record.
          </p>
        </div>

        <form
          action={updateBreedingRecord}
          className="mt-8 space-y-6"
        >

          <input
            type="hidden"
            name="record_id"
            value={record.id}
          />

          {/* COW */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <label
              htmlFor="cow_id"
              className="block text-sm font-semibold text-gray-900"
            >
              Cow
            </label>

            <div className="mt-3 rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                {cow.name || "Unnamed Cow"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Tag: {cow.tag_number || "Not assigned"}
                {cow.breed
                  ? ` • ${cow.breed}`
                  : ""}
              </p>
            </div>

            <input
              type="hidden"
              id="cow_id"
              name="cow_id"
              value={cow.id}
            />

            <p className="mt-2 text-xs text-gray-500">
              The cow cannot be changed when editing
              this breeding record.
            </p>

          </div>

          {/* EVENT */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <h2 className="text-lg font-bold text-gray-900">
              Breeding Event
            </h2>

            <div className="mt-5">

              <label
                htmlFor="breeding_date"
                className="block text-sm font-semibold text-gray-900"
              >
                Event date
              </label>

              <input
                id="breeding_date"
                name="breeding_date"
                type="date"
                required
                max={todayStr}
                defaultValue={record.breeding_date}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="event_type"
                className="block text-sm font-semibold text-gray-900"
              >
                Event type
              </label>

              <select
                id="event_type"
                name="event_type"
                required
                defaultValue={
                  record.event_type || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              >
                <option value="">
                  Select event
                </option>

                <option value="Mating">
                  Mating
                </option>

                <option value="Artificial Insemination">
                  Artificial Insemination
                </option>

                <option value="Pregnancy Check">
                  Pregnancy Check
                </option>

                <option value="Calving">
                  Calving
                </option>
              </select>

            </div>

            <div className="mt-5">

              <label
                htmlFor="breeding_method"
                className="block text-sm font-semibold text-gray-900"
              >
                Breeding method
              </label>

              <select
                id="breeding_method"
                name="breeding_method"
                defaultValue={
                  record.breeding_method || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              >
                <option value="">
                  Select method
                </option>

                <option value="Natural Mating">
                  Natural Mating
                </option>

                <option value="Artificial Insemination">
                  Artificial Insemination
                </option>
              </select>

            </div>

            <div className="mt-5">

              <label
                htmlFor="bull_name"
                className="block text-sm font-semibold text-gray-900"
              >
                Bull name
              </label>

              <input
                id="bull_name"
                name="bull_name"
                type="text"
                defaultValue={
                  record.bull_name || ""
                }
                placeholder="Bull name"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="semen_code"
                className="block text-sm font-semibold text-gray-900"
              >
                Semen code
              </label>

              <input
                id="semen_code"
                name="semen_code"
                type="text"
                defaultValue={
                  record.semen_code || ""
                }
                placeholder="For artificial insemination"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

          </div>

          {/* PREGNANCY */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <h2 className="text-lg font-bold text-gray-900">
              Pregnancy & Calving
            </h2>

            <div className="mt-5">

              <label
                htmlFor="pregnancy_status"
                className="block text-sm font-semibold text-gray-900"
              >
                Pregnancy status
              </label>

              <select
                id="pregnancy_status"
                name="pregnancy_status"
                defaultValue={
                  record.pregnancy_status || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              >
                <option value="">
                  Not recorded
                </option>

                <option value="Pregnant">
                  Pregnant
                </option>

                <option value="Not Pregnant">
                  Not Pregnant
                </option>

                <option value="Unknown">
                  Unknown
                </option>
              </select>

            </div>

            <div className="mt-5">

              <label
                htmlFor="pregnancy_check_date"
                className="block text-sm font-semibold text-gray-900"
              >
                Pregnancy check date
              </label>

              <input
                id="pregnancy_check_date"
                name="pregnancy_check_date"
                type="date"
                defaultValue={
                  record.pregnancy_check_date || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="expected_calving_date"
                className="block text-sm font-semibold text-gray-900"
              >
                Expected calving date
              </label>

              <input
                id="expected_calving_date"
                name="expected_calving_date"
                type="date"
                defaultValue={
                  record.expected_calving_date || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="actual_calving_date"
                className="block text-sm font-semibold text-gray-900"
              >
                Actual calving date
              </label>

              <input
                id="actual_calving_date"
                name="actual_calving_date"
                type="date"
                defaultValue={
                  record.actual_calving_date || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="calving_outcome"
                className="block text-sm font-semibold text-gray-900"
              >
                Calving outcome
              </label>

              <select
                id="calving_outcome"
                name="calving_outcome"
                defaultValue={
                  record.calving_outcome || ""
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              >
                <option value="">
                  Not recorded
                </option>

                <option value="Successful">
                  Successful
                </option>

                <option value="Difficult">
                  Difficult
                </option>

                <option value="Assisted">
                  Assisted
                </option>

                <option value="Stillbirth">
                  Stillbirth
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

            </div>

            <div className="mt-5">

              <label
                htmlFor="calf_count"
                className="block text-sm font-semibold text-gray-900"
              >
                Number of calves
              </label>

              <input
                id="calf_count"
                name="calf_count"
                type="number"
                min="0"
                defaultValue={
                  record.calf_count ?? ""
                }
                placeholder="e.g. 1"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

          </div>

          {/* VETERINARY */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <h2 className="text-lg font-bold text-gray-900">
              Veterinary & Cost Information
            </h2>

            <div className="mt-5">

              <label
                htmlFor="veterinarian"
                className="block text-sm font-semibold text-gray-900"
              >
                Veterinarian
              </label>

              <input
                id="veterinarian"
                name="veterinarian"
                type="text"
                defaultValue={
                  record.veterinarian || ""
                }
                placeholder="Veterinarian name"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="cost_ksh"
                className="block text-sm font-semibold text-gray-900"
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
                  record.cost_ksh ?? ""
                }
                placeholder="e.g. 1700"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

          </div>

          {/* NOTES */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-gray-900"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={
                record.notes || ""
              }
              placeholder="Optional notes..."
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
            />

          </div>

          {/* BUTTONS */}

          <div className="flex flex-col gap-3 sm:flex-row">

            <Link
              href="/dashboard/breeding"
              className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Save Changes
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}