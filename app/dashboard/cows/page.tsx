import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Cow = {
  id: string;
  farm_id: string;
  tag_number: string | null;
  name: string | null;
  breed: string | null;
  sex: string | null;
  date_of_birth: string | null;
  color: string | null;
  weight_kg: number | null;
  status: string | null;
  pregnancy_status: string | null;
  notes: string | null;
};

export default async function CowsPage() {
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
  // 2. Get farms belonging to this user
  // -----------------------------------------

  const { data: farms, error: farmsError } =
    await supabase
      .from("farms")
      .select("id, farm_name")
      .eq("owner_id", user.id)
      .order("farm_name");

  if (farmsError) {
    console.error("Farm loading error:", farmsError);
  }

  const farmIds = (farms ?? []).map(
    (farm) => farm.id
  );

  // -----------------------------------------
  // 3. Get cows from those farms
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
        breed,
        sex,
        date_of_birth,
        color,
        weight_kg,
        status,
        pregnancy_status,
        notes
      `)
      .in("farm_id", farmIds)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Cow loading error:", error);
    } else {
      cows = data ?? [];
    }
  }

  // -----------------------------------------
  // 4. Farm lookup
  // -----------------------------------------

  const farmMap = new Map(
    (farms ?? []).map((farm) => [
      farm.id,
      farm.farm_name,
    ])
  );

  // -----------------------------------------
  // 5. Dashboard
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              My Cows
            </h1>

            <p className="mt-1 text-gray-600">
              Manage your cattle and keep track of their information.
            </p>
          </div>

          <Link
            href="/dashboard/cows/new"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            + Add Cow
          </Link>

        </div>

        {/* SUMMARY */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              My Farms
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {(farms ?? []).length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Total Cattle
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {cows.length}
            </p>
          </div>

        </div>

        {/* NO FARM */}

        {(farms ?? []).length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

            <div className="text-5xl">
              🌱
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Add your farm first
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Before registering cattle, you need to create your farm profile.
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

        {(farms ?? []).length > 0 &&
          cows.length === 0 && (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">

              <div className="text-5xl">
                🐄
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                No cows registered yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-gray-600">
                Start building your digital herd by registering your first cow.
              </p>

              <Link
                href="/dashboard/cows/new"
                className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Register First Cow
              </Link>

            </div>
          )}

        {/* COW CARDS */}

        {cows.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {cows.map((cow) => (
              <Link
                key={cow.id}
                href={`/dashboard/cows/${cow.id}`}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
                    🐄
                  </div>

                  {cow.status && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      {cow.status}
                    </span>
                  )}

                </div>

                <h2 className="mt-5 text-xl font-bold text-gray-900 group-hover:text-green-700">
                  {cow.name || "Unnamed Cow"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Tag: {cow.tag_number || "Not assigned"}
                </p>

                <div className="mt-5 space-y-2 text-sm">

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Breed
                    </span>

                    <span className="font-medium text-gray-900">
                      {cow.breed || "Not recorded"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Sex
                    </span>

                    <span className="font-medium text-gray-900">
                      {cow.sex || "Not recorded"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Weight
                    </span>

                    <span className="font-medium text-gray-900">
                      {cow.weight_kg
                        ? `${cow.weight_kg} kg`
                        : "Not recorded"}
                    </span>
                  </div>

                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">

                  <p className="text-xs text-gray-500">
                    Farm
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {farmMap.get(cow.farm_id) ||
                      "Unknown farm"}
                  </p>

                </div>

              </Link>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}