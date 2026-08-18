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
  name: string | null;
  tag_number: string | null;
  breed: string | null;
};

export default async function NewBreedingRecordPage() {
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
  // 2. Server Action
  // -----------------------------------------

  async function createBreedingRecord(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    // -----------------------------------------
    // Verify user
    // -----------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    // -----------------------------------------
    // Get form values
    // -----------------------------------------

    const cowId = String(
      formData.get("cow_id") || ""
    ).trim();

    const eventDate = String(
      formData.get("event_date") || ""
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

    // -----------------------------------------
    // Validate required fields
    // -----------------------------------------

    if (!cowId || !eventDate || !eventType) {
      throw new Error(
        "Cow, event date and event type are required."
      );
    }

    // -----------------------------------------
    // Verify cow belongs to logged-in user's farm
    // -----------------------------------------

    const { data: cow, error: cowError } =
      await supabase
        .from("cows")
        .select(`
          id,
          farm_id
        `)
        .eq("id", cowId)
        .single();

    if (cowError || !cow) {
      console.error(
        "Cow verification error:",
        cowError
      );

      throw new Error(
        "The selected cow could not be found."
      );
    }

    const { data: farm, error: farmError } =
      await supabase
        .from("farms")
        .select("id")
        .eq("id", cow.farm_id)
        .eq("owner_id", user.id)
        .single();

    if (farmError || !farm) {
      console.error(
        "Farm ownership verification error:",
        farmError
      );

      throw new Error(
        "You are not authorized to record information for this cow."
      );
    }

    // -----------------------------------------
    // Prepare optional numeric values
    // -----------------------------------------

    const calfCount =
      calfCountValue !== ""
        ? Number(calfCountValue)
        : null;

    const costKsh =
      costValue !== ""
        ? Number(costValue)
        : null;

    // -----------------------------------------
    // Validate numbers
    // -----------------------------------------

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
        "Cost must be a valid positive number."
      );
    }

    // -----------------------------------------
    // Insert breeding record
    // -----------------------------------------

    const { error: insertError } =
      await supabase
        .from("breeding_records")
        .insert({
          cow_id: cowId,

          // Your actual database column
          breeding_date: eventDate,

          // Your actual database column
          breeding_method:
            breedingMethod || null,

          bull_name:
            bullName || null,

          expected_calving_date:
            expectedCalvingDate || null,

          actual_calving_date:
            actualCalvingDate || null,

          // Your actual database column
          outcome:
            calvingOutcome || null,

          notes: notes || null,

          // Additional columns in your actual table
          event_type:
            eventType || null,

          semen_code:
            semenCode || null,

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
        });

    if (insertError) {
      console.error(
        "Breeding record insert error:",
        insertError
      );

      throw new Error(
        `Could not save breeding record: ${insertError.message}`
      );
    }

    // -----------------------------------------
    // Update cow pregnancy status when supplied
    // -----------------------------------------

    if (pregnancyStatus) {
      const { error: cowUpdateError } =
        await supabase
          .from("cows")
          .update({
            pregnancy_status:
              pregnancyStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cowId);

      if (cowUpdateError) {
        console.error(
          "Cow pregnancy update error:",
          cowUpdateError
        );
      }
    }

    // -----------------------------------------
    // Return to breeding dashboard
    // -----------------------------------------

    redirect("/dashboard/breeding");
  }

  // -----------------------------------------
  // 3. Get user's farms
  // -----------------------------------------

  const { data: farms, error: farmsError } =
    await supabase
      .from("farms")
      .select("id, farm_name")
      .eq("owner_id", user.id)
      .order("farm_name");

  if (farmsError) {
    console.error(
      "Farm loading error:",
      farmsError
    );
  }

  const safeFarms: Farm[] = farms ?? [];

  const farmIds = safeFarms.map(
    (farm) => farm.id
  );

  // -----------------------------------------
  // 4. Get cows belonging to user's farms
  // -----------------------------------------

  let cows: Cow[] = [];

  if (farmIds.length > 0) {
    const { data, error } =
      await supabase
        .from("cows")
        .select(`
          id,
          farm_id,
          name,
          tag_number,
          breed
        `)
        .in("farm_id", farmIds)
        .order("name");

    if (error) {
      console.error(
        "Cow loading error:",
        error
      );
    } else {
      cows = data ?? [];
    }
  }

  // -----------------------------------------
  // 5. No farm
  // -----------------------------------------

  if (safeFarms.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
        <div className="mx-auto max-w-3xl">

          <Link
            href="/dashboard/breeding"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Breeding Management
          </Link>

          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              
            </div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Add your farm first
            </h1>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Before recording breeding information,
              you need to create your farm profile.
            </p>

            <Link
              href="/dashboard/farm/edit"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Farm
            </Link>

          </div>

        </div>
      </main>
    );
  }

  // -----------------------------------------
  // 6. No cows
  // -----------------------------------------

  if (cows.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
        <div className="mx-auto max-w-3xl">

          <Link
            href="/dashboard/breeding"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Breeding Management
          </Link>

          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              
            </div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              No cows registered yet
            </h1>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Register at least one cow before
              recording breeding information.
            </p>

            <Link
              href="/dashboard/cows/new"
              className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Register Cow
            </Link>

          </div>

        </div>
      </main>
    );
  }

  // -----------------------------------------
  // 7. Form
  // -----------------------------------------

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
            Record Breeding Event
          </h1>

          <p className="mt-2 text-gray-600">
            Record mating, artificial insemination,
            pregnancy checks and calving information.
          </p>

        </div>

        <form
          action={createBreedingRecord}
          className="mt-8 space-y-6"
        >

          {/* FARM */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <label
              htmlFor="farm_id"
              className="block text-sm font-semibold text-gray-900"
            >
              Farm
            </label>

            <select
              id="farm_id"
              name="farm_id"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            >
              <option value="">
                Select farm
              </option>

              {safeFarms.map((farm) => (
                <option
                  key={farm.id}
                  value={farm.id}
                >
                  {farm.farm_name}
                </option>
              ))}

            </select>

          </div>

          {/* COW */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <label
              htmlFor="cow_id"
              className="block text-sm font-semibold text-gray-900"
            >
              Cow
            </label>

            <select
              id="cow_id"
              name="cow_id"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            >
              <option value="">
                Select cow
              </option>

              {cows.map((cow) => (
                <option
                  key={cow.id}
                  value={cow.id}
                >
                  {cow.name || "Unnamed Cow"}
                  {" — Tag "}
                  {cow.tag_number || "No tag"}
                  {" — "}
                  {cow.breed || "Breed unknown"}
                </option>
              ))}

            </select>

          </div>

          {/* EVENT */}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <h2 className="text-lg font-bold text-gray-900">
              Breeding Event
            </h2>

            <div className="mt-5">

              <label
                htmlFor="event_date"
                className="block text-sm font-semibold text-gray-900"
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
                placeholder="e.g. 1"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
              />

            </div>

          </div>

          {/* VET */}

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
                placeholder="e.g. 1500"
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
              placeholder="Additional breeding notes..."
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
            />

          </div>

          {/* BUTTONS */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/breeding"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Save Breeding Event
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}