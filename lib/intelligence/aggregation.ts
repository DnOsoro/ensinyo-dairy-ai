import {
  getComparisonWindows,
} from "./date-windows";

import type {
  FarmIntelligenceData,
} from "./types";

function isBetween(
  date: string,
  start: string,
  end: string
) {
  return date >= start && date <= end;
}

export function aggregateFarmWindow(
  data: FarmIntelligenceData,
  start: string,
  end: string
) {
  const milkRecords =
    data.milkRecords.filter((record) =>
      isBetween(
        record.record_date,
        start,
        end
      )
    );

  const feedRecords =
    data.feedRecords.filter((record) =>
      isBetween(
        record.feed_date,
        start,
        end
      )
    );

  const expenses =
    data.expenses.filter((record) =>
      isBetween(
        record.expense_date,
        start,
        end
      )
    );

  const income =
    data.income.filter((record) =>
      isBetween(
        record.income_date,
        start,
        end
      )
    );

  const healthRecords =
    data.healthRecords.filter((record) =>
      isBetween(
        record.event_date,
        start,
        end
      )
    );

  const breedingRecords =
    data.breedingRecords.filter((record) =>
      isBetween(
        record.breeding_date,
        start,
        end
      )
    );

  const totalMilkLitres =
    milkRecords.reduce(
      (sum, record) =>
        sum + (record.total_litres ?? 0),
      0
    );

  const totalFeedKg =
    feedRecords.reduce(
      (sum, record) =>
        sum + (record.quantity_kg ?? 0),
      0
    );

  const totalFeedCost =
    feedRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  const totalIncome =
    income.reduce(
      (sum, record) =>
        sum + (record.amount_ksh ?? 0),
      0
    );

  const totalExpenses =
    expenses.reduce(
      (sum, record) =>
        sum + (record.amount_ksh ?? 0),
      0
    );

  const totalHealthCosts =
    healthRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  const totalBreedingCosts =
    breedingRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  const netIncome =
    totalIncome - totalExpenses;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const numberOfDays =
    Math.floor(
      (endDate.getTime() -
        startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const averageDailyMilkLitres =
    totalMilkLitres /
    Math.max(1, numberOfDays);

  return {
    start,
    end,

    milkRecords,
    feedRecords,
    expenses,
    income,
    healthRecords,
    breedingRecords,

    totalMilkLitres,
    averageDailyMilkLitres,

    totalFeedKg,
    totalFeedCost,

    totalIncome,
    totalExpenses,
    netIncome,

    totalHealthCosts,
    totalBreedingCosts,

    healthEvents:
      healthRecords.length,

    breedingEvents:
      breedingRecords.length,
  };
}

export function getFarmWindowAggregates(
  data: FarmIntelligenceData
) {
  const sevenDayWindows =
    getComparisonWindows(7);

  const thirtyDayWindows =
    getComparisonWindows(30);

  return {
    sevenDays: {
      current: aggregateFarmWindow(
        data,
        sevenDayWindows.current.start,
        sevenDayWindows.current.end
      ),

      previous: aggregateFarmWindow(
        data,
        sevenDayWindows.previous.start,
        sevenDayWindows.previous.end
      ),
    },

    thirtyDays: {
      current: aggregateFarmWindow(
        data,
        thirtyDayWindows.current.start,
        thirtyDayWindows.current.end
      ),

      previous: aggregateFarmWindow(
        data,
        thirtyDayWindows.previous.start,
        thirtyDayWindows.previous.end
      ),
    },
  };
}