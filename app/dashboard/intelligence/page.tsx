import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntelligenceChat from "../intelligence-test/intelligence-chat";

export default async function IntelligencePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: farm, error } = await supabase
    .from("farms")
    .select("id, farm_name, location, county, country")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-200">
            <h1 className="text-xl font-bold text-red-600">
              Unable to load farm
            </h1>

            <p className="mt-2 text-gray-600">
              We could not load your farm information.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!farm) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              No farm found
            </h1>

            <p className="mt-2 text-gray-600">
              Create your farm before using Ensinyo Intelligence.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">

          {/* BACK TO DASHBOARD */}

          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-green-300 hover:bg-green-50 hover:text-green-800"
          >
            ← Back to Dashboard
          </Link>


          {/* INTELLIGENCE HEADER */}

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
              🧠
            </div>

            <div>

              <h1 className="text-2xl font-bold text-gray-900">
                Ensinyo Intelligence
              </h1>

              <p className="text-sm text-gray-500">
                Your AI-powered farm assistant
              </p>

            </div>

          </div>

        </div>
      </header>


      {/* MAIN */}

      <section className="mx-auto max-w-5xl px-6 py-8">

        {/* FARM */}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          <h2 className="text-lg font-bold text-gray-900">
            {farm.farm_name}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {farm.location}, {farm.county}, {farm.country}
          </p>

        </section>


        {/* INTELLIGENCE */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

          <div className="mb-6">

            <h2 className="text-xl font-bold text-gray-900">
              Ask Ensinyo Intelligence
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Ask questions about your cows, milk, feed, health,
              breeding and finances.
            </p>

          </div>

          <IntelligenceChat />

        </section>

      </section>

    </main>
  );
}