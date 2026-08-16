import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FarmForm from "./farm-form";

export default async function EditFarmPage() {
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
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-12">

      <div className="mx-auto max-w-2xl">

        <a
          href="/dashboard/farm"
          className="text-sm font-medium text-green-700"
        >
          ← Back to farm
        </a>

        <div className="mt-6">

          <h1 className="text-3xl font-bold text-gray-900">
            {farm ? "Update your farm" : "Set up your farm"}
          </h1>

          <p className="mt-2 text-gray-600">
            Give us a few details about your farm.
          </p>

        </div>

        <FarmForm farm={farm} />

      </div>

    </main>
  );
}