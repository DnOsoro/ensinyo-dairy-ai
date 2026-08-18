import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isFutureDate } from "@/lib/utils/date";

export default async function NewFeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: farms, error: farmsError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", farmsError);
  }

  const userFarms = farms ?? [];

  if (userFarms.length === 0) {
    redirect("/dashboard/farm/edit");
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  async function createFeedRecord(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const farmId = String(formData.get("farm_id") ?? "");
    const feedDate = String(formData.get("feed_date") ?? "");
    const feedType = String(formData.get("feed_type") ?? "").trim();
    const quantityKg = Number(formData.get("quantity_kg"));
    const costValue = String(formData.get("cost_ksh") ?? "").trim();
    const notesValue = String(formData.get("notes") ?? "").trim();

    const costKsh = costValue === "" ? null : Number(costValue);

    if (
      !farmId ||
      !feedDate ||
      !feedType ||
      !Number.isFinite(quantityKg) ||
      quantityKg <= 0
    ) {
      redirect("/dashboard/feed/new?error=invalid");
    }

    if (isFutureDate(feedDate)) {
      redirect("/dashboard/feed/new?error=future_date");
    }

    if (costKsh !== null && (!Number.isFinite(costKsh) || costKsh < 0)) {
      redirect("/dashboard/feed/new?error=invalid");
    }

    // Verify ownership of the target farm
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", farmId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (farmError || !farm) {
      redirect("/dashboard/feed/new?error=unauthorized");
    }

    // Insert feed record
    const { error: insertError } = await supabase.from("feed_records").insert({
      farm_id: farmId,
      feed_date: feedDate,
      feed_type: feedType,
      quantity_kg: quantityKg,
      cost_ksh: costKsh,
      notes: notesValue === "" ? null : notesValue,
    });

    if (insertError) {
      console.error("Feed record insert error:", insertError);
      redirect("/dashboard/feed/new?error=insert");
    }

    redirect("/dashboard/feed");
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Record Feed </h1>
          <p className="mt-1 text-gray-600">Record feed used on your farm.</p>
        </div>

        <form
          action={createFeedRecord}
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
              defaultValue={userFarms[0]?.id}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {userFarms.map((farm) => (
                <option key={farm.id} value={farm.id}>
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
              defaultValue={today}
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
              placeholder="e.g. 25"
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
              <span className="ml-2 font-normal text-gray-500">Optional</span>
            </label>
            <input
              id="cost_ksh"
              name="cost_ksh"
              type="number"
              min="0"
              step="0.01"
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
              <span className="ml-2 font-normal text-gray-500">Optional</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
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
              Save Feed Record
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