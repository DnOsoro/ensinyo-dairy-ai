import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const learningResources = [
  {
    title: "Modern Cow Shed Design",
    description:
      "Learn how to design a comfortable, clean and practical dairy cow shed.",
    category: "Housing",
    icon: "🏠",
    url: "",
  },
  {
    title: "How to Make Quality Silage",
    description:
      "Learn the basic steps for preparing and storing silage for your dairy cows.",
    category: "Feed",
    icon: "🌽",
    url: "",
  },
  {
    title: "Better Dairy Cow Feeding",
    description:
      "Understand the basics of balanced feeding and how good nutrition affects milk production.",
    category: "Nutrition",
    icon: "🥬",
    url: "",
  },
  {
    title: "Managing a Healthy Dairy Herd",
    description:
      "Learn practical ways to maintain cow health and identify problems early.",
    category: "Animal Health",
    icon: "❤️",
    url: "",
  },
  {
    title: "Dairy Cow Breeding Basics",
    description:
      "Understand heat detection, insemination, pregnancy and basic breeding management.",
    category: "Breeding",
    icon: "🧬",
    url: "",
  },
  {
    title: "Improving Milk Production",
    description:
      "Learn practical management practices that can help improve milk production and farm efficiency.",
    category: "Milk Production",
    icon: "🥛",
    url: "",
  },
];

export default async function FarmerLearningPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg text-gray-700 transition hover:bg-gray-50"
              aria-label="Back to dashboard"
            >
              ←
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-2xl">
                🎓
              </div>

              <div>

                <h1 className="text-xl font-bold text-gray-900">
                  Farmer Learning
                </h1>

                <p className="text-sm text-gray-500">
                  Learn practical modern dairy farming
                </p>

              </div>

            </div>

          </div>

          <Link
            href="/dashboard"
            className="hidden text-sm font-semibold text-green-700 sm:block"
          >
            Dashboard →
          </Link>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* INTRO */}

        <div className="mb-10 max-w-3xl">

          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Learn. Improve. Grow.
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Practical knowledge for better dairy farming
          </h2>

          <p className="mt-3 text-gray-600 leading-7">
            Learn simple and practical dairy farming techniques through
            educational videos and resources prepared for farmers.
          </p>

        </div>


        {/* ===================================================
            LEARNING RESOURCES
        =================================================== */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {learningResources.map((resource) => (

            <article
              key={resource.title}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
            >

              {/* ICON */}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl">
                {resource.icon}
              </div>


              {/* CATEGORY */}

              <div className="mt-5">

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  {resource.category}
                </span>

              </div>


              {/* TITLE */}

              <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-green-700">
                {resource.title}
              </h3>


              {/* DESCRIPTION */}

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {resource.description}
              </p>


              {/* VIDEO LINK */}

              <div className="mt-6">

                {resource.url ? (

                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                  >
                    Watch video →
                  </a>

                ) : (

                  <span className="inline-flex items-center rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500">
                    Video coming soon
                  </span>

                )}

              </div>

            </article>

          ))}

        </div>

      </section>

    </main>
  );
}