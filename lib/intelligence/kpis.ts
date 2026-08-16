import {
  FarmIntelligenceData,
  FarmKPIs,
} from "./types";

export function calculateFarmKPIs(
  data: FarmIntelligenceData
): FarmKPIs {
  const totalCows = data.cows.length;

  const activeCows = data.cows.filter(
    (cow) =>
      cow.status?.toLowerCase() === "active"
  ).length;

  const pregnantCows = data.cows.filter(
    (cow) =>
      cow.pregnancy_status?.toLowerCase() ===
      "pregnant"
  ).length;

  const totalMilkLitres =
    data.milkRecords.reduce(
      (sum, record) =>
        sum + (record.total_litres ?? 0),
      0
    );

  const uniqueMilkDays =
    new Set(
      data.milkRecords.map(
        (record) => record.record_date
      )
    ).size;

  const averageDailyMilkLitres =
    uniqueMilkDays > 0
      ? totalMilkLitres / uniqueMilkDays
      : 0;

  const totalFeedKg =
    data.feedRecords.reduce(
      (sum, record) =>
        sum + (record.quantity_kg ?? 0),
      0
    );

  const totalFeedCost =
    data.feedRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  const feedCostPerKg =
    totalFeedKg > 0
      ? totalFeedCost / totalFeedKg
      : 0;

  const totalIncome =
    data.income.reduce(
      (sum, record) =>
        sum + (record.amount_ksh ?? 0),
      0
    );

  const totalExpenses =
    data.expenses.reduce(
      (sum, record) =>
        sum + (record.amount_ksh ?? 0),
      0
    );

  const netIncome =
    totalIncome - totalExpenses;

  const profitMargin =
    totalIncome > 0
      ? (netIncome / totalIncome) * 100
      : 0;

  const healthEvents =
    data.healthRecords.length;

  const healthCosts =
    data.healthRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  const breedingEvents =
    data.breedingRecords.length;

  const breedingCosts =
    data.breedingRecords.reduce(
      (sum, record) =>
        sum + (record.cost_ksh ?? 0),
      0
    );

  const upcomingCalvings =
    data.breedingRecords.filter(
      (record) =>
        record.expected_calving_date &&
        !record.actual_calving_date
    ).length;

  const pregnancyRate =
    totalCows > 0
      ? (pregnantCows / totalCows) * 100
      : 0;

  const feedCostPerMilkLitre =
    totalMilkLitres > 0
      ? totalFeedCost / totalMilkLitres
      : 0;

  return {
    totalCows,
    activeCows,
    pregnantCows,

    totalMilkLitres,
    averageDailyMilkLitres,

    totalFeedKg,
    totalFeedCost,
    feedCostPerKg,
    feedCostPerMilkLitre,

    totalIncome,
    totalExpenses,
    netIncome,
    profitMargin,

    healthEvents,
    healthCosts,

    breedingEvents,
    breedingCosts,

    upcomingCalvings,

    pregnancyRate,
  };
}