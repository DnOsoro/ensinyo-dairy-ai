import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const categories = [
  {
    icon: "🩺",
    title: "Veterinarians",
    description: "Find veterinary professionals for animal health and treatment.",
  },
  {
    icon: "🥬",
    title: "Feed Suppliers",
    description: "Find suppliers of dairy feeds, minerals, hay, silage and supplements.",
  },
  {
    icon: "🏠",
    title: "Cow Shed Builders",
    description: "Find people who build modern, practical and affordable dairy sheds.",
  },
  {
    icon: "🥛",
    title: "Milk Buyers",
    description: "Connect with milk vendors, processors and other buyers.",
  },
  {
    icon: "🚜",
    title: "Farm Services",
    description: "Find people offering transport, silage, machinery and other farm services.",
  },
  {
    icon: "💊",
    title: "Animal Health Suppliers",
    description: "Find trusted suppliers of animal health products and farm essentials.",
  },
];

export default async function MarketplacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: farm } = await supabase
    .from("farms")
    .select("id, farm_name, location, county, country")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      {/* HEADER */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            >
              ←
            </Link>

            <div>

              <h1 className="text-2xl font-bold text-gray-900">
                Ensinyo Marketplace
              </h1>

              <p className="text-sm text-gray-500">
                Connect with farmers, suppliers and farm service providers.
              </p>

            </div>

          </div>

        </div>

      </header>


      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* HERO */}

        <div className="mb-10 rounded-3xl bg-gradient-to-br from-green-800 via-green-700 to-green-600 p-8 text-white shadow-md">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
              FARM MARKETPLACE
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Find the people and services your farm needs.
            </h2>

            <p className="mt-4 text-base leading-7 text-green-50">
              Connect with veterinarians, feed suppliers, cow shed builders,
              milk buyers and other agricultural service providers.
            </p>

            {farm && (
              <p className="mt-5 text-sm text-green-100">
                Serving farmers around{" "}
                <span className="font-semibold">
                  {farm.location}, {farm.county}
                </span>
              </p>
            )}

          </div>

        </div>


        {/* SEARCH */}

        <div className="mb-10">

          <input
            type="search"
            placeholder="Search for a service, supplier or provider..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />

        </div>


        {/* CATEGORIES */}

        <div>

          <div className="mb-5">

            <h3 className="text-xl font-bold text-gray-900">
              Browse Services
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Choose the type of service you are looking for.
            </p>

          </div>


          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {categories.map((category) => (

              <Link
                key={category.title}
                href={`/dashboard/marketplace?category=${encodeURIComponent(
                  category.title
                )}`}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                  {category.icon}
                </div>

                <h4 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-green-700">
                  {category.title}
                </h4>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {category.description}
                </p>

                <div className="mt-5 text-sm font-semibold text-green-700">
                  Explore →
                </div>

              </Link>

            ))}

          </div>

        </div>


        {/* COMING SOON */}

        <div className="mt-12 rounded-2xl border border-green-100 bg-green-50 p-6">

          <div className="flex gap-4">

            <div className="text-2xl">
              🚜
            </div>

            <div>

              <h3 className="font-bold text-green-900">
                Marketplace is growing
              </h3>

              <p className="mt-1 text-sm leading-6 text-green-800">
                We are building a trusted network of agricultural
                professionals and suppliers so farmers can easily find
                the services and products they need.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}