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

  const fullName = user.user_metadata?.full_name || "Farmer";
  const firstName = fullName.split(" ")[0];

  return (
    <main className="min-h-screen bg-[var(--background)]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-8">

          {/* BRAND */}

          <Link href="/dashboard" className="group">
            <h1 className="text-xl font-bold tracking-tight text-green-900 transition group-hover:text-green-700 sm:text-2xl">
              Ensinyo
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Dairy Intelligence Platform
            </p>
          </Link>


          {/* USER SECTION */}

          <div className="flex items-center gap-3 sm:gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {fullName}
              </p>
              <p className="text-xs text-gray-500">
                {user.email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-900 text-sm font-bold text-white">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <LogoutButton />

          </div>

        </div>
      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* ===================================================
            WELCOME
        =================================================== */}

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Farm overview
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Welcome, {firstName}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Manage your farm, understand your data and make better decisions.
          </p>
        </div>


        {/* ===================================================
            ENSINYO INTELLIGENCE — PRIMARY FEATURE
        =================================================== */}

        <Link
          href="/dashboard/intelligence"
          className="group mb-10 block overflow-hidden rounded-3xl bg-green-900 p-6 text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-8"
        >

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

            {/* LEFT */}

            <div className="max-w-2xl">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sm font-bold tracking-wide text-white ring-1 ring-white/15">
                  AI
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-200">
                    Farm intelligence
                  </p>

                  <h3 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Ensinyo Intelligence
                  </h3>
                </div>

              </div>


              <p className="mt-5 max-w-2xl text-sm leading-7 text-green-50 sm:text-base">
                Ask questions about your cows, milk, feed,
                health, breeding and finances — and get answers
                based on your farm&apos;s actual data.
              </p>


              <div className="mt-6 flex flex-wrap gap-2">

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
                  Cows
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
                  Milk
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
                  Feed
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
                  Health
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
                  Breeding
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
                  Finances
                </span>

              </div>

            </div>


            {/* RIGHT */}

            <div className="shrink-0">

              <div className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-green-900 shadow-sm transition group-hover:bg-green-50 sm:px-6">
                Ask Ensinyo
              </div>

            </div>

          </div>

        </Link>


        {/* ===================================================
            EXPLORE ENSINYO
        =================================================== */}

        <div className="mb-5">

          <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
            Discover
          </p>

          <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            Explore Ensinyo
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Learn better farming practices and connect with agricultural services.
          </p>

        </div>


        <div className="mb-10 grid gap-6 md:grid-cols-2">

          {/* =================================================
              FARMER LEARNING
          ================================================= */}

          <Link
            href="/dashboard/learning"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xs font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-100">
                Learn
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
              through simple educational guides and videos.
            </p>


            <div className="mt-5 flex flex-wrap gap-2">

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Modern cow sheds
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Silage
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Feeding
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Dairy management
              </span>

            </div>

          </Link>


          {/* =================================================
              MARKETPLACE
          ================================================= */}

          <Link
            href="/dashboard/marketplace"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xs font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-100">
                Market
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
                Veterinarians
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Agrovet
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Feed suppliers
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Farm builders
              </span>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                Milk buyers
              </span>

            </div>

          </Link>

        </div>


        {/* ===================================================
            FARM MANAGEMENT
        =================================================== */}

        <div className="mb-5">

          <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
            Operations
          </p>

          <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            Farm Management
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Manage your farm records and operations.
          </p>

        </div>


        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <DashboardCard
            title="My Farm"
            description="Manage your farm details and general setup."
            href="/dashboard/farm"
          />

          <DashboardCard
            title="My Cows"
            description="Track individual animals, breeds, and herd health."
            href="/dashboard/cows"
          />

          <DashboardCard
            title="Milk Production"
            description="Log daily yields and analyze milk output trends."
            href="/dashboard/milk"
          />

          <DashboardCard
            title="Health Management"
            description="Record health issues, treatments, and vet visits."
            href="/dashboard/health"
          />

          <DashboardCard
            title="Breeding"
            description="Track inseminations, pregnancy status, and calf history."
            href="/dashboard/breeding"
          />

          <DashboardCard
            title="Feed Management"
            description="Monitor daily feed consumption and ration costs."
            href="/dashboard/feed"
          />

          <DashboardCard
            title="Expenses"
            description="Record input purchases and operational costs."
            href="/dashboard/expenses"
          />

          <DashboardCard
            title="Income"
            description="Track revenue from milk sales and livestock."
            href="/dashboard/income"
          />

          <DashboardCard
            title="Analytics"
            description="Evaluate farm financial and operational KPIs."
            href="/dashboard/analytics"
          />

        </div>

      </section>

    </main>
  );
}


/* ===========================================================
   REUSABLE DASHBOARD CARD COMPONENT
=========================================================== */

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-green-700 transition group-hover:translate-x-0.5">
        <span>Open</span>
        <span>→</span>
      </div>
    </Link>
  );
}