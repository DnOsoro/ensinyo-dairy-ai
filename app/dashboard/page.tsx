import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    user.user_metadata?.full_name || "Farmer";

  const firstName =
    fullName.split(" ")[0];

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* BRAND */}

          <div>

            <h1 className="text-2xl font-bold text-green-800">
              Ensinyo
            </h1>

            <p className="text-sm text-gray-500">
              Dairy Intelligence Platform
            </p>

          </div>


          {/* USER + LOGOUT */}

          <div className="flex items-center gap-4">

            <div className="text-right">

              <p className="font-semibold text-gray-900">
                {fullName}
              </p>

              <p className="text-sm text-gray-500">
                {user.email}
              </p>

            </div>

            <LogoutButton />

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* ===================================================
            WELCOME
        =================================================== */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, {firstName} 👋
          </h2>

          <p className="mt-2 text-gray-600">
            Manage your farm, understand your data and make
            better decisions.
          </p>

        </div>


        {/* ===================================================
            ENSINYO INTELLIGENCE — PRIMARY FEATURE
        =================================================== */}

        <Link
          href="/dashboard/intelligence"
          className="group mb-10 block overflow-hidden rounded-3xl bg-gradient-to-br from-green-800 via-green-700 to-green-600 p-8 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
        >

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

            {/* LEFT */}

            <div className="max-w-2xl">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                  🧠
                </div>

                <div>

                  <p className="text-sm font-medium text-green-100">
                    FARM INTELLIGENCE
                  </p>

                  <h3 className="text-2xl font-bold">
                    Ensinyo Intelligence
                  </h3>

                </div>

              </div>


              <p className="mt-5 text-base leading-7 text-green-50">
                Ask questions about your cows, milk, feed,
                health, breeding and finances — and get answers
                based on your farm's actual data.
              </p>


              <div className="mt-6 flex flex-wrap gap-2">

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  🐄 Cows
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  🥛 Milk
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  🥬 Feed
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  ❤️ Health
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  🧬 Breeding
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  💰 Finances
                </span>

              </div>

            </div>


            {/* RIGHT */}

            <div className="shrink-0">

              <div className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-green-800 shadow-sm transition group-hover:bg-green-50">
                Ask Ensinyo →
              </div>

            </div>

          </div>

        </Link>


        {/* ===================================================
            EXPLORE ENSINYO
        =================================================== */}

        <div className="mb-5">

          <h3 className="text-xl font-bold text-gray-900">
            Explore Ensinyo
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Learn better farming practices and connect with
            agricultural services.
          </p>

        </div>


        <div className="mb-10 grid gap-6 md:grid-cols-2">

          {/* =================================================
              FARMER LEARNING
          ================================================= */}

          <Link
            href="/dashboard/learning"
            className="group rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl">
                🎓
              </div>

              <span className="text-sm font-semibold text-green-700 transition group-hover:translate-x-1">
                Learn →
              </span>

            </div>


            <h3 className="mt-6 text-xl font-bold text-gray-900 group-hover:text-green-700">
              Farmer Learning
            </h3>


            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
              Learn practical modern dairy farming practices
              through simple educational videos and guides.
            </p>


            <div className="mt-5 flex flex-wrap gap-2">

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🏠 Modern cow sheds
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🌾 Silage
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🥬 Feeding
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🐄 Dairy management
              </span>

            </div>

          </Link>


          {/* =================================================
              MARKETPLACE
          ================================================= */}

          <Link
            href="/dashboard/marketplace"
            className="group rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl">
                🤝
              </div>

              <span className="text-sm font-semibold text-green-700 transition group-hover:translate-x-1">
                Explore →
              </span>

            </div>


            <h3 className="mt-6 text-xl font-bold text-gray-900 group-hover:text-green-700">
              Marketplace
            </h3>


            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
              Find veterinarians, feed suppliers, farm builders,
              milk buyers and other agricultural services.
            </p>


            <div className="mt-5 flex flex-wrap gap-2">

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🩺 Veterinarians
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🌱 Agrovet
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🌾 Feed suppliers
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🏗️ Farm builders
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                🥛 Milk buyers
              </span>

            </div>

          </Link>

        </div>


        {/* ===================================================
            FARM MANAGEMENT
        =================================================== */}

        <div className="mb-5">

          <h3 className="text-xl font-bold text-gray-900">
            Farm Management
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage your farm records and operations.
          </p>

        </div>


        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">


          {/* FARM */}

          <DashboardCard
            icon="🌱"
            title="My Farm"
            description="Manage your farm information."
            href="/dashboard/farm"
          />


          {/* COWS */}

          <DashboardCard
            icon="🐄"
            title="My Cows"
            description="Track animals, breeds and health."
            href="/dashboard/cows"
          />


          {/* MILK */}

          <DashboardCard
            icon="🥛"
            title="Milk Production"
            description="Track and analyze your daily milk production."
            href="/dashboard/milk"
          />


          {/* HEALTH */}

          <DashboardCard
            icon="❤️"
            title="Health Management"
            description="Track diseases, treatments and veterinary care."
            href="/dashboard/health"
          />


          {/* BREEDING */}

          <DashboardCard
            icon="🧬"
            title="Breeding"
            description="Track mating, insemination, pregnancy and breeding history."
            href="/dashboard/breeding"
          />


          {/* FEED */}

          <DashboardCard
            icon="🥬"
            title="Feed Management"
            description="Track feed usage, quantities and feeding costs."
            href="/dashboard/feed"
          />


          {/* EXPENSES */}

          <DashboardCard
            icon="💰"
            title="Expenses"
            description="Track farm expenses, spending and operating costs."
            href="/dashboard/expenses"
          />


          {/* INCOME */}

          <DashboardCard
            icon="💵"
            title="Income"
            description="Track milk sales, livestock sales and other farm income."
            href="/dashboard/income"
          />


          {/* ANALYTICS */}

          <DashboardCard
            icon="📊"
            title="Analytics"
            description="Understand your farm performance, trends and key metrics."
            href="/dashboard/analytics"
          />

        </div>

      </section>

    </main>
  );
}


/* ===========================================================
   DASHBOARD CARD COMPONENT
=========================================================== */

function DashboardCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {

  return (

    <Link
      href={href}
      className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
    >

      {/* ICON */}

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
        {icon}
      </div>


      {/* TITLE */}

      <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-green-700">
        {title}
      </h3>


      {/* DESCRIPTION */}

      <p className="mt-2 text-sm leading-6 text-gray-600">
        {description}
      </p>


      {/* LINK */}

      <div className="mt-5 text-sm font-semibold text-green-700">
        Open →
      </div>

    </Link>

  );
}