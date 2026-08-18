"use client";

import { useMemo } from "react";

type ChartPoint = {
  date: string;
  milk: number;
  income: number;
  expenses: number;
  feedCost: number;
};

type Props = {
  chartData: ChartPoint[];
  expenseByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
};

function shortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
  });
}

function formatCurrency(value: number) {
  return `KSh ${value.toLocaleString("en-KE", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-KE", {
    maximumFractionDigits: 1,
  });
}

function Bar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const width =
    max > 0
      ? Math.max((value / max) * 100, value > 0 ? 3 : 0)
      : 0;

  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-green-600 transition-all"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function AnalyticsCharts({
  chartData,
  expenseByCategory,
  incomeByCategory,
}: Props) {
  const recentData = useMemo(() => {
    return chartData.slice(-14);
  }, [chartData]);

  const maxMilk = Math.max(
    ...recentData.map((item) => item.milk),
    1
  );

  const maxFinancial = Math.max(
    ...recentData.flatMap((item) => [
      item.income,
      item.expenses,
    ]),
    1
  );

  const maxFeedCost = Math.max(
    ...recentData.map(
      (item) => item.feedCost
    ),
    1
  );

  const expenseCategories = Object.entries(
    expenseByCategory
  ).sort((a, b) => b[1] - a[1]);

  const incomeCategories = Object.entries(
    incomeByCategory
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">

      {/* =====================================================
          MILK PRODUCTION
      ===================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

        <div className="flex items-start justify-between">

          <div>
            <h3 className="font-bold text-gray-900">
              Milk Production
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Last 14 days
            </p>
          </div>

          <span className="text-2xl">
            
          </span>

        </div>

        <div className="mt-6 space-y-4">

          {recentData.map((item) => (
            <div
              key={item.date}
              className="flex items-center gap-3"
            >

              <span className="w-16 text-xs text-gray-500">
                {shortDate(item.date)}
              </span>

              <Bar
                value={item.milk}
                max={maxMilk}
              />

              <span className="w-16 text-right text-xs font-medium text-gray-700">
                {formatNumber(item.milk)} L
              </span>

            </div>
          ))}

        </div>

      </div>


      {/* =====================================================
          INCOME VS EXPENSES
      ===================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

        <div className="flex items-start justify-between">

          <div>
            <h3 className="font-bold text-gray-900">
              Income vs Expenses
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Last 14 days
            </p>
          </div>

          <span className="text-2xl">
            
          </span>

        </div>

        <div className="mt-6 space-y-4">

          {recentData.map((item) => (
            <div
              key={item.date}
              className="space-y-2"
            >

              <div className="flex justify-between text-xs">
                <span className="text-gray-500">
                  {shortDate(item.date)}
                </span>

                <span className="font-medium text-gray-700">
                  {formatCurrency(
                    item.income
                  )}
                </span>
              </div>

              <div className="flex gap-2">

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{
                      width: `${
                        item.income > 0
                          ? Math.max(
                              (item.income /
                                maxFinancial) *
                                100,
                              3
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{
                      width: `${
                        item.expenses > 0
                          ? Math.max(
                              (item.expenses /
                                maxFinancial) *
                                100,
                              3
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

              </div>

            </div>
          ))}

          <div className="flex gap-5 pt-2 text-xs">

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Income
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Expenses
            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          FEED COST
      ===================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

        <div className="flex items-start justify-between">

          <div>
            <h3 className="font-bold text-gray-900">
              Feed Cost
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Last 14 days
            </p>
          </div>

          <span className="text-2xl">
            
          </span>

        </div>

        <div className="mt-6 space-y-4">

          {recentData.map((item) => (
            <div
              key={item.date}
              className="flex items-center gap-3"
            >

              <span className="w-16 text-xs text-gray-500">
                {shortDate(item.date)}
              </span>

              <Bar
                value={item.feedCost}
                max={maxFeedCost}
              />

              <span className="w-20 text-right text-xs font-medium text-gray-700">
                {formatCurrency(
                  item.feedCost
                )}
              </span>

            </div>
          ))}

        </div>

      </div>


      {/* =====================================================
          EXPENSE BREAKDOWN
      ===================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

        <div className="flex items-start justify-between">

          <div>
            <h3 className="font-bold text-gray-900">
              Expense Breakdown
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Where your money is going
            </p>
          </div>

          <span className="text-2xl">
            
          </span>

        </div>

        <div className="mt-6 space-y-4">

          {expenseCategories.length === 0 ? (
            <p className="text-sm text-gray-500">
              No expenses recorded yet.
            </p>
          ) : (
            expenseCategories.map(
              ([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between border-b border-gray-100 pb-3"
                >

                  <div>
                    <p className="font-medium text-gray-900">
                      {category}
                    </p>

                    <p className="text-xs text-gray-500">
                      Farm expense
                    </p>
                  </div>

                  <p className="font-semibold text-gray-900">
                    {formatCurrency(amount)}
                  </p>

                </div>
              )
            )
          )}

        </div>

      </div>


      {/* =====================================================
          INCOME BREAKDOWN
      ===================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:col-span-2">

        <div className="flex items-start justify-between">

          <div>
            <h3 className="font-bold text-gray-900">
              Income Sources
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Where your farm income is coming from
            </p>
          </div>

          <span className="text-2xl">
            
          </span>

        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {incomeCategories.length === 0 ? (
            <p className="text-sm text-gray-500">
              No income recorded yet.
            </p>
          ) : (
            incomeCategories.map(
              ([category, amount]) => (
                <div
                  key={category}
                  className="rounded-xl bg-[#f7f8f3] p-5"
                >

                  <p className="text-sm text-gray-500">
                    {category}
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </p>

                </div>
              )
            )
          )}

        </div>

      </div>

    </div>
  );
}