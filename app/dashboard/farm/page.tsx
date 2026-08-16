import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FarmPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: farm } = await supabase
    .from("farms")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">

          <a
            href="/dashboard"
            className="text-sm font-medium text-green-700"
          >
            ← Back to dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            My Farm
          </h1>

          <p className="mt-2 text-gray-600">
            Manage your farm information.
          </p>

        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          {farm ? (
            <>
              <div className="mb-8">

                <p className="text-sm font-semibold text-green-700">
                  FARM PROFILE
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {farm.farm_name}
                </h2>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <Info
                  label="Location"
                  value={farm.location || "Not provided"}
                />

                <Info
                  label="County"
                  value={farm.county || "Not provided"}
                />

                <Info
                  label="Country"
                  value={farm.country || "Not provided"}
                />

                <Info
                  label="Farm type"
                  value={farm.farm_type || "Not provided"}
                />

                <Info
                  label="Total farm size"
                  value={
                    farm.total_acres !== null
                      ? `${farm.total_acres} acres`
                      : "Not provided"
                  }
                />

                <Info
                  label="Farming system"
                  value={
                    farm.farming_system ||
                    "Not provided"
                  }
                />

                <Info
                  label="Main activity"
                  value={
                    farm.main_activity ||
                    "Not provided"
                  }
                />

              </div>

              <a
                href="/dashboard/farm/edit"
                className="mt-8 inline-flex rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Edit farm
              </a>
            </>
          ) : (
            <>

              <h2 className="text-2xl font-bold text-gray-900">
                Let's set up your farm
              </h2>

              <p className="mt-2 text-gray-600">
                Tell us about your farm so Ensinyo can
                personalize your experience.
              </p>

              <a
                href="/dashboard/farm/edit"
                className="mt-6 inline-flex rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Set up my farm
              </a>

            </>
          )}

        </div>

      </section>

    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}