import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isFutureDate } from "@/lib/utils/date";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
};

export default async function EditFeedPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // --------------------------------------------------
  // 1. GET CURRENT USER
  // --------------------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // --------------------------------------------------
  // 2. GET USER FARMS
  // --------------------------------------------------

  const { data: farms, error: farmsError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", farmsError);
  }

  const userFarms: Farm[] = farms ?? [];

  if (userFarms.length === 0) {
    redirect("/dashboard/farm/edit");
  }

  const farmIds = userFarms.map((farm) => farm.id);

  // --------------------------------------------------
  // 3. GET FEED RECORD
  // --------------------------------------------------

  const { data: feedRecord, error: feedError } = await supabase
    .from("feed_records")
    .select(`
      id,
      farm_id,
      feed_date,
      feed_type,
      quantity_kg,
      cost_ksh,
      notes
    `)
    .eq("id", id)
    .in("farm_id", farmIds)
    .maybeSingle();

  if (feedError) {
    console.error("Feed record loading error:", feedError);
  }

  if (!feedRecord) {
    redirect("/dashboard/feed");
  }

  const record: FeedRecord = feedRecord;

  // --------------------------------------------------
  // 4. TODAY — NAIROBI TIME
  // --------------------------------------------------

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  // --------------------------------------------------
  // 5. UPDATE FEED RECORD
  // --------------------------------------------------

  async function updateFeedRecord(formData: FormData) {
    "use server";

    const supabase = await createClient();

    // ----------------------------------------------
    // Authenticate user
    // ----------------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // ----------------------------------------------
    // Read form data
    // ----------------------------------------------

    const farmId = String(
      formData.get("farm_id") ?? ""
    );

    const feedDate = String(
      formData.get("feed_date") ?? ""
    );

    const feedType = String(
      formData.get("feed_type") ?? ""
    ).trim();

    const quantityKg = Number(
      formData.get("quantity_kg")
    );

    const costValue = String(
      formData.get("cost_ksh") ?? ""
    ).trim();

    const notesValue = String(
      formData.get("notes") ?? ""
    ).trim();

    const costKsh =
      costValue === ""
        ? null
        : Number(costValue);

    // ----------------------------------------------
    // Basic validation
    // ----------------------------------------------

    if (
      !farmId ||
      !feedDate ||
      !feedType ||
      !Number.isFinite(quantityKg) ||
      quantityKg <= 0
    ) {
      redirect(
        `/dashboard/feed/${id}/edit?error=invalid`
      );
    }

    // ----------------------------------------------
    // Future date protection
    // ----------------------------------------------

    if (isFutureDate(feedDate)) {
      redirect(
        `/dashboard/feed/${id}/edit?error=future_date`
      );
    }

    // ----------------------------------------------
    // Cost validation
    // ----------------------------------------------

    if (
      costKsh !== null &&
      (!Number.isFinite(costKsh) || costKsh < 0)
    ) {
      redirect(
        `/dashboard/feed/${id}/edit?error=invalid`
      );
    }

    // ----------------------------------------------
    // Verify farm belongs to current user
    // ----------------------------------------------

    const { data: farm, error: farmError } =
      await supabase
        .from("farms")
        .select("id")
        .eq("id", farmId)
        .eq("owner_id", user.id)
        .maybeSingle();

    if (farmError || !farm) {
      redirect(
        `/dashboard/feed/${id}/edit?error=unauthorized`
      );
    }

    // ----------------------------------------------
    // Verify record belongs to user's farm
    // ----------------------------------------------

    const { data: existingRecord, error: recordError } =
      await supabase
        .from("feed_records")
        .select("id")
        .eq("id", id)
        .eq("farm_id", farmId)
        .maybeSingle();

    if (recordError || !existingRecord) {
      redirect(
        `/dashboard/feed/${id}/edit?error=unauthorized`
      );
    }

    // ----------------------------------------------
    // UPDATE RECORD
    // ----------------------------------------------

    const { error: updateError } = await supabase
      .from("feed_records")
      .update({
        farm_id: farmId,
        feed_date: feedDate,
        feed_type: feedType,
        quantity_kg: quantityKg,
        cost_ksh: costKsh,
        notes: notesValue === "" ? null : notesValue,
      })
      .eq("id", id)
      .eq("farm_id", farmId);

    if (updateError) {
      console.error(
        "Feed record update error:",
        updateError
      );

      redirect(
        `/dashboard/feed/${id}/edit?error=update`
      );
    }

    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    redirect("/dashboard/feed");
  }

  // --------------------------------------------------
  // 6. PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/dashboard/feed"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Back to Feed Management
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Feed Record
          </h1>

          <p className="mt-1 text-gray-600">
            Update the details of this feed record.
          </p>
        </div>

        <form
          action={updateFeedRecord}
          className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
        >

          {/* FARM */}

          <div>
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
              defaultValue={record.farm_id}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {userFarms.map((farm) => (
                <option
                  key={farm.id}
                  value={farm.id}
                >
                  {farm.farm_name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label
              htmlFor="feed_date"
              className="block text-sm font-semibold text-gray-900"
            >
              Feed Date
            </label>

            <input
              id="feed_date"
              name="feed_date"
              type="date"
              required
              max={today}
              defaultValue={record.feed_date}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* FEED TYPE */}

          <div>
            <label
              htmlFor="feed_type"
              className="block text-sm font-semibold text-gray-900"
            >
              Feed Type
            </label>

            <input
              id="feed_type"
              name="feed_type"
              type="text"
              required
              defaultValue={record.feed_type}
              placeholder="e.g. Dairy meal, Napier grass, Silage"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* QUANTITY */}

          <div>
            <label
              htmlFor="quantity_kg"
              className="block text-sm font-semibold text-gray-900"
            >
              Quantity (kg)
            </label>

            <input
              id="quantity_kg"
              name="quantity_kg"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={record.quantity_kg}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* COST */}

          <div>
            <label
              htmlFor="cost_ksh"
              className="block text-sm font-semibold text-gray-900"
            >
              Cost (KSh)

              <span className="ml-2 font-normal text-gray-500">
                Optional
              </span>
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
              placeholder="e.g. 1500"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* NOTES */}

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-gray-900"
            >
              Notes

              <span className="ml-2 font-normal text-gray-500">
                Optional
              </span>
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={record.notes ?? ""}
              placeholder="Any additional information..."
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">

            <button
              type="submit"
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
            >
              Update Feed Record
            </button>

            <Link
              href="/dashboard/feed"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

          </div>

        </form>

      </div>
    </main>
  );
}