import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFarmIntelligence } from "@/lib/intelligence";
import IntelligenceChat from "./intelligence-chat";

export default async function IntelligenceTestPage() {
  const supabase = await createClient();

  // 1. Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Get the user's farm
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (farmError) {
    return (
      <main className="p-10">
        <h1 className="text-xl font-bold text-red-600">
          Farm Error
        </h1>

        <pre className="mt-4 rounded bg-gray-100 p-4">
          {farmError.message}
        </pre>
      </main>
    );
  }

  if (!farm) {
    return (
      <main className="p-10">
        <h1 className="text-xl font-bold">
          No farm found
        </h1>

        <p className="mt-2 text-gray-600">
          Create a farm before testing intelligence.
        </p>
      </main>
    );
  }

  // 3. Run intelligence engine
  const intelligence = await getFarmIntelligence(farm.id);

  if (!intelligence) {
    return (
      <main className="p-10">
        <h1 className="text-xl font-bold text-red-600">
          Intelligence Error
        </h1>

        <p className="mt-2 text-gray-600">
          Could not load farm intelligence data.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] p-10">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-3xl font-bold text-gray-900">
          Ensinyo Intelligence Engine
        </h1>

        <p className="mt-2 text-gray-600">
          Internal V2 intelligence test.
        </p>

        {/* FARM */}

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          <h2 className="text-xl font-bold">
            Farm
          </h2>

          <p className="mt-2 text-gray-700">
            {intelligence.farm.name}
          </p>

          <p className="text-sm text-gray-500">
            {intelligence.farm.location},{" "}
            {intelligence.farm.county},{" "}
            {intelligence.farm.country}
          </p>

        </section>


        {/* INTELLIGENCE ASSISTANT */}

        <IntelligenceChat />


        {/* KPIs */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          <h2 className="text-xl font-bold">
            Farm KPIs
          </h2>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950 p-5 text-sm text-green-400">
            {JSON.stringify(
              intelligence.kpis,
              null,
              2
            )}
          </pre>

        </section>


        {/* TRENDS */}

        {"trends" in intelligence && (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

            <h2 className="text-xl font-bold">
              Farm Trends
            </h2>

            <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950 p-5 text-sm text-blue-400">
              {JSON.stringify(
                intelligence.trends,
                null,
                2
              )}
            </pre>

          </section>
        )}


        {/* RAW DATA */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          <h2 className="text-xl font-bold">
            Intelligence Data
          </h2>

          <pre className="mt-4 max-h-[600px] overflow-auto rounded-xl bg-gray-950 p-5 text-sm text-gray-300">
            {JSON.stringify(
              intelligence.data,
              null,
              2
            )}
          </pre>

        </section>

      </div>
    </main>
  );
}