const features = [
  {
    icon: "",
    title: "Manage Your Cows",
    description:
      "Keep simple digital records for every cow, including milk production, health, breeding and pregnancy.",
  },
  {
    icon: "",
    title: "Track Your Feed",
    description:
      "Know what feed you have, what your cows consume and how much your feeding is costing.",
  },
  {
    icon: "",
    title: "Understand Your Farm",
    description:
      "Turn your daily farm records into simple insights about production, costs and profitability.",
  },
  {
    icon: "",
    title: "Ask Your AI Assistant",
    description:
      "Get practical, data-driven guidance based on your farm records and trusted dairy knowledge.",
  },
  {
    icon: "",
    title: "Manage Your Finances",
    description:
      "Track milk income, farm expenses, costs per litre and your overall farm performance.",
  },
  {
    icon: "",
    title: "Find Farm Services",
    description:
      "Connect with veterinarians, agrovets, feed suppliers, builders and milk buyers around you.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-xl">
              
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">Ensinyo</h1>
              <p className="text-xs text-gray-500">Dairy AI</p>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-gray-600 transition hover:text-green-600"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-gray-600 transition hover:text-green-600"
            >
              How It Works
            </a>

            <a
              href="#marketplace"
              className="text-sm text-gray-600 transition hover:text-green-600"
            >
              Marketplace
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 sm:block"
            >
              Login
            </a>

            <a
              href="/register"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <span></span>
              Built for farmers
            </div>

            <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              Manage your farm.
              <span className="block text-green-600">
                Understand your cows.
              </span>
              Grow smarter.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Ensinyo Dairy AI helps farmers manage cows, milk production,
              feeding, health and finances in one simple platform while
              providing intelligent insights to help you make better decisions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="rounded-xl bg-green-600 px-6 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                Start Your Farm →
              </a>

              <a
                href="#features"
                className="rounded-xl border border-gray-300 px-6 py-3.5 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <span>✓ Simple to use</span>
              <span>✓ Mobile friendly</span>
              <span>✓ Built for farmers</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-2xl">
              <div className="rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">My Farm</p>
                    <h3 className="text-xl font-bold">Welcome back </h3>
                  </div>

                  <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Healthy
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs text-gray-500">Cows</p>
                    <p className="mt-1 text-2xl font-bold">12</p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs text-gray-500">Milk</p>
                    <p className="mt-1 text-2xl font-bold">86L</p>
                  </div>

                  <div className="rounded-xl bg-yellow-50 p-4">
                    <p className="text-xs text-gray-500">Feed</p>
                    <p className="mt-1 text-2xl font-bold">1.2T</p>
                  </div>

                  <div className="rounded-xl bg-purple-50 p-4">
                    <p className="text-xs text-gray-500">Profit</p>
                    <p className="mt-1 text-2xl font-bold">KSh 2.1k</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Milk Production</p>
                      <p className="text-xs text-gray-500">
                        Last 7 days
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-green-600">
                      +8.4%
                    </span>
                  </div>

                  <div className="mt-6 flex h-32 items-end gap-2">
                    {[45, 60, 52, 72, 65, 82, 95].map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-md bg-green-500"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-green-600 p-4 text-white">
                  <div className="flex items-start gap-3">
                    <span className="text-xl"></span>

                    <div>
                      <p className="font-semibold">AI Farm Insight</p>
                      <p className="mt-1 text-sm text-green-50">
                        Milk production is improving this week. Keep monitoring
                        feed intake and water availability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-6 -top-6 hidden rounded-2xl bg-green-600 p-4 text-3xl shadow-lg sm:block">
              
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-4 text-3xl shadow-lg sm:block">
              
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
              Everything in one place
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Your farm, organized simply.
            </h2>

            <p className="mt-4 text-gray-600">
              From your first cow record to understanding your farm&apos;s
              profitability, Ensinyo brings your daily farm operations together.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
              Simple workflow
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Start managing your farm in minutes.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              {
                number: "01",
                title: "Create your farm",
                text: "Create your account and enter the basic details about your farm.",
              },
              {
                number: "02",
                title: "Add your cows",
                text: "Create a digital record for each cow and start tracking its history.",
              },
              {
                number: "03",
                title: "Record daily data",
                text: "Record milk, feed, health events, income and expenses as they happen.",
              },
              {
                number: "04",
                title: "Make better decisions",
                text: "Use your dashboard and AI assistant to understand what is happening on your farm.",
              },
            ].map((step) => (
              <div key={step.number} className="relative">
                <div className="text-4xl font-bold text-green-100">
                  {step.number}
                </div>

                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section id="marketplace" className="bg-green-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                Coming together
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Connect farmers with the services they need.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-gray-600">
                Ensinyo will connect farmers with trusted agricultural service
                providers — from veterinarians and agrovets to feed suppliers,
                dairy builders and milk buyers.
              </p>

              <a
                href="/marketplace"
                className="mt-7 inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Explore Marketplace →
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ["", "Veterinarians"],
                ["", "Agrovets"],
                ["", "Feed Suppliers"],
                ["", "Farm Builders"],
                ["", "Milk Buyers"],
                ["", "Farm Equipment"],
              ].map(([icon, title]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
                >
                  <div className="text-2xl">{icon}</div>
                  <p className="mt-3 font-semibold">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="text-4xl">  </div>

          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Your farm has data. Let&apos;s turn it into better decisions.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-gray-300">
            Start building your digital farm today. Record what matters,
            understand your performance and grow with better information.
          </p>

          <a
            href="/register"
            className="mt-8 inline-block rounded-xl bg-green-500 px-7 py-3.5 font-semibold text-white transition hover:bg-green-400"
          >
            Create Your Farm →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 py-8 text-gray-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold text-white">Ensinyo Dairy AI</span>
            <span className="ml-2">
              — Smart farming for better decisions.
            </span>
          </div>

          <p>Built for farmers. Built with data. </p>
        </div>
      </footer>
    </main>
  );
}