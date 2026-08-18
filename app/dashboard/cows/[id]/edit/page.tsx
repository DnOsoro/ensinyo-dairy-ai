import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditCowForm from "./edit-cow-form";

type Farm = {
  id: string;
  farm_name: string;
};

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

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCowPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // -----------------------------------------
  // 1. Get authenticated user
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

  const safeFarms: Farm[] = farms ?? [];

  // -----------------------------------------
  // 3. Get the cow
  // -----------------------------------------

  const { data: cow, error: cowError } = await supabase
    .from("cows")
    .select(
      `
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
      `
    )
    .eq("id", id)
    .single();

  if (cowError || !cow) {
    console.error("Cow loading error:", cowError);
    notFound();
  }

  const typedCow = cow as Cow;

  // -----------------------------------------
  // 4. Verify cow belongs to user's farm
  // -----------------------------------------

  const ownsFarm = safeFarms.some(
    (farm) => farm.id === typedCow.farm_id
  );

  if (!ownsFarm) {
    notFound();
  }

  // -----------------------------------------
  // 5. Render edit page
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        <Link
          href={`/dashboard/cows/${typedCow.id}`}
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Back to Cow
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Cow
          </h1>

          <p className="mt-2 text-gray-600">
            Update your cow&apos;s information and keep the
            herd records accurate.
          </p>
        </div>

        {farmsError && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load your farms. Please try again.
          </div>
        )}

        <EditCowForm
          cow={typedCow}
          farms={safeFarms}
        />

      </div>
    </main>
  );
}
