import type { FarmIntelligenceData } from "./types";

import type { FarmQuery, FarmQueryPeriod } from "./query-types";

function getDateRange(period: FarmQueryPeriod) {
  const today = new Date();

  const end = today.toISOString().split("T")[0];

  if (period === "today") {
    return {
      start: end,
      end,
    };
  }

  if (period === "last_7_days") {
    const start = new Date(today);

    start.setDate(start.getDate() - 6);

    return {
      start: start.toISOString().split("T")[0],
      end,
    };
  }

  if (period === "last_30_days") {
    const start = new Date(today);

    start.setDate(start.getDate() - 29);

    return {
      start: start.toISOString().split("T")[0],
      end,
    };
  }

  return null;
}

function findCow(data: FarmIntelligenceData, cowName?: string) {
  if (!cowName) {
    return undefined;
  }

  const search = cowName.toLowerCase();

  return data.cows.find(
    (cow) =>
      cow.name?.toLowerCase() === search ||
      cow.tag_number.toLowerCase() === search
  );
}

export function answerFarmQuery(
  data: FarmIntelligenceData,
  query: FarmQuery
) {
  /*
   * =========================================================
   * DATE WINDOW
   * =========================================================
   */

  const range = getDateRange(query.period);

  /*
   * =========================================================
   * MILK PROJECTION
   * =========================================================
   */

  if (query.intent === "milk_projection") {
    const cowCount = query.cowCount;

    if (!cowCount || cowCount <= 0) {
      return {
        success: false,
        question: query.rawQuestion,
        intent: query.intent,
        period: query.period,
        answer:
          "Please specify the number of cows you would like a milk projection for.",
      };
    }

    // Filter today's milk records to establish a baseline
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Nairobi",
    }).format(new Date());

    let todayRecords = data.milkRecords.filter(
      (record) => record.record_date === todayStr
    );

    // Fall back to all-time recorded milk if no records exist for today
    if (todayRecords.length === 0) {
      todayRecords = data.milkRecords;
    }

    // Calculate total production per unique cow
    const productionByCow = new Map<string, number>();

    for (const record of todayRecords) {
      const current = productionByCow.get(record.cow_id) ?? 0;
      productionByCow.set(
        record.cow_id,
        current + (record.total_litres ?? 0)
      );
    }

    /*
     * We need at least one cow
     * with recorded production.
     */
    if (productionByCow.size === 0) {
      return {
        success: false,
        question: query.rawQuestion,
        intent: query.intent,
        period: query.period,
        answer:
          "I cannot estimate milk production for that herd size because there is no milk production recorded on your farm yet.",
      };
    }

    const totalRecordedMilk = Array.from(productionByCow.values()).reduce(
      (sum, litres) => sum + litres,
      0
    );

    const recordedCows = productionByCow.size;

    const averagePerCow = totalRecordedMilk / recordedCows;

    const estimatedProduction = averagePerCow * cowCount;

    const disclaimer =
      recordedCows === 1
        ? " Note: This calculation is based on production data from a single cow, so actual yield across a larger herd may vary."
        : "";

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `Based on ${recordedCows} cow${
        recordedCows === 1 ? "" : "s"
      } with recorded milk production (averaging ${averagePerCow.toFixed(
        1
      )} litres/cow/day), ${cowCount} cow${
        cowCount === 1 ? "" : "s"
      } could produce approximately ${estimatedProduction.toFixed(
        1
      )} litres per day.${disclaimer}`,
      data: {
        requestedCowCount: cowCount,
        recordedCows,
        totalRecordedMilkLitres: totalRecordedMilk,
        averageMilkPerCowLitres: averagePerCow,
        estimatedDailyMilkLitres: estimatedProduction,
        isEstimate: true,
      },
    };
  }

  /*
   * =========================================================
   * MILK PRODUCTION
   * =========================================================
   */

  if (query.intent === "milk_production") {
    let milkRecords = data.milkRecords;

    if (range) {
      milkRecords = milkRecords.filter(
        (record) =>
          record.record_date >= range.start && record.record_date <= range.end
      );
    }

    const cow = findCow(data, query.cowName);

    if (query.cowName && !cow) {
      return {
        success: false,
        question: query.rawQuestion,
        intent: query.intent,
        period: query.period,
        answer: `I could not find a cow named "${query.cowName}" in this farm's records.`,
      };
    }

    if (cow) {
      milkRecords = milkRecords.filter((record) => record.cow_id === cow.id);
    }

    const totalMilk = milkRecords.reduce(
      (sum, record) => sum + (record.total_litres ?? 0),
      0
    );

    const cowLabel = cow ? cow.name || cow.tag_number : "the farm";

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `${cowLabel} produced ${totalMilk.toFixed(
        1
      )} litres of milk during the selected period.`,
      data: {
        totalMilkLitres: totalMilk,
        cowId: cow?.id ?? null,
        cowName: cow?.name ?? null,
        startDate: range?.start ?? null,
        endDate: range?.end ?? null,
      },
    };
  }

  /*
   * =========================================================
   * FEED
   * =========================================================
   */

  if (query.intent === "feed") {
    let records = data.feedRecords;

    if (range) {
      records = records.filter(
        (record) =>
          record.feed_date >= range.start && record.feed_date <= range.end
      );
    }

    const totalKg = records.reduce(
      (sum, record) => sum + (record.quantity_kg ?? 0),
      0
    );

    const totalCost = records.reduce(
      (sum, record) => sum + (record.cost_ksh ?? 0),
      0
    );

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `The farm used ${totalKg.toFixed(
        1
      )} kg of feed at a total recorded cost of KSh ${totalCost.toLocaleString()}.`,
      data: {
        totalFeedKg: totalKg,
        totalFeedCost: totalCost,
        startDate: range?.start ?? null,
        endDate: range?.end ?? null,
      },
    };
  }

  /*
   * =========================================================
   * FINANCE
   * =========================================================
   */

  if (query.intent === "finance") {
    let income = data.income;

    let expenses = data.expenses;

    if (range) {
      income = income.filter(
        (record) =>
          record.income_date >= range.start &&
          record.income_date <= range.end
      );

      expenses = expenses.filter(
        (record) =>
          record.expense_date >= range.start &&
          record.expense_date <= range.end
      );
    }

    const totalIncome = income.reduce(
      (sum, record) => sum + (record.amount_ksh ?? 0),
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, record) => sum + (record.amount_ksh ?? 0),
      0
    );

    const netIncome = totalIncome - totalExpenses;

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `The farm recorded KSh ${totalIncome.toLocaleString()} in income and KSh ${totalExpenses.toLocaleString()} in expenses, giving a net position of KSh ${netIncome.toLocaleString()}.`,
      data: {
        totalIncome,
        totalExpenses,
        netIncome,
        startDate: range?.start ?? null,
        endDate: range?.end ?? null,
      },
    };
  }

  /*
   * =========================================================
   * HEALTH
   * =========================================================
   */

  if (query.intent === "health") {
    let records = data.healthRecords;

    if (range) {
      records = records.filter(
        (record) =>
          record.event_date >= range.start && record.event_date <= range.end
      );
    }

    const totalEvents = records.length;

    const totalCost = records.reduce(
      (sum, record) => sum + (record.cost_ksh ?? 0),
      0
    );

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `The farm recorded ${totalEvents} health event${
        totalEvents === 1 ? "" : "s"
      } with total health-related costs of KSh ${totalCost.toLocaleString()}.`,
      data: {
        healthEvents: totalEvents,
        healthCosts: totalCost,
        startDate: range?.start ?? null,
        endDate: range?.end ?? null,
      },
    };
  }

  /*
   * =========================================================
   * BREEDING
   * =========================================================
   */

  if (query.intent === "breeding") {
    const pregnantCows = data.cows.filter(
      (cow) => cow.pregnancy_status?.toLowerCase() === "pregnant"
    );

    const breedingEvents = data.breedingRecords.length;

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `The farm currently has ${pregnantCows.length} pregnant cow${
        pregnantCows.length === 1 ? "" : "s"
      } and ${breedingEvents} recorded breeding event${
        breedingEvents === 1 ? "" : "s"
      }.`,
      data: {
        pregnantCows: pregnantCows.length,
        breedingEvents,
      },
    };
  }

  /*
   * =========================================================
   * COW PROFILE
   * =========================================================
   */

  if (query.intent === "cow_profile") {
    const cow = findCow(data, query.cowName);

    if (!cow) {
      return {
        success: false,
        question: query.rawQuestion,
        intent: query.intent,
        period: query.period,
        answer: `I could not find a cow named "${
          query.cowName ?? "that cow"
        }" in this farm's records.`,
      };
    }

    return {
      success: true,
      question: query.rawQuestion,
      intent: query.intent,
      period: query.period,
      answer: `${cow.name || cow.tag_number} is a ${
        cow.breed ?? "recorded"
      } ${cow.sex.toLowerCase()} cow, currently ${cow.status.toLowerCase()} and ${
        cow.pregnancy_status?.toLowerCase() ??
        "with no pregnancy status recorded"
      }.`,
      data: {
        cow,
      },
    };
  }

  /*
   * =========================================================
   * FARM SUMMARY
   * =========================================================
   */

  return {
    success: true,
    question: query.rawQuestion,
    intent: query.intent,
    period: query.period,
    answer: `The farm currently has ${data.cows.length} cow${
      data.cows.length === 1 ? "" : "s"
    }, with ${data.milkRecords.length} milk record${
      data.milkRecords.length === 1 ? "" : "s"
    }, ${data.feedRecords.length} feed record${
      data.feedRecords.length === 1 ? "" : "s"
    }, ${data.healthRecords.length} health event${
      data.healthRecords.length === 1 ? "" : "s"
    }, and ${data.breedingRecords.length} breeding record${
      data.breedingRecords.length === 1 ? "" : "s"
    }.`,
    data: {
      cows: data.cows.length,
      milkRecords: data.milkRecords.length,
      feedRecords: data.feedRecords.length,
      healthRecords: data.healthRecords.length,
      breedingRecords: data.breedingRecords.length,
    },
  };
}