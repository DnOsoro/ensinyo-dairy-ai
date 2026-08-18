import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CowForm from "./cow-form";

export default async function NewCowPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get farms belonging to the logged-in user
  const { data: farms, error } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .order("farm_name");

  if (error) {
    console.error("Farm loading error:", error);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/dashboard/cows"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Back to My Cows
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Register a Cow
          </h1>

          <p className="mt-2 text-gray-600">
            Add your cow&apos;s basic information to your digital herd.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load your farms. Please try again.
          </div>
        )}

        <CowForm farms={farms ?? []} />

      </div>
    </main>
  );
}