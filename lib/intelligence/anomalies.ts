import type {
  FarmIntelligenceData,
  FarmKPIs,
} from "./types";

import type {
  FarmTrend,
} from "./trends";


export type AnomalySeverity =
  | "info"
  | "warning"
  | "critical";


export type AnomalyType =
  | "milk_drop"
  | "feed_cost_increase"
  | "expense_increase"
  | "profitability_drop"
  | "health_event_spike"
  | "breeding_cost_increase"
  | "high_feed_cost_per_litre";


export type FarmAnomaly = {
  type: AnomalyType;

  severity: AnomalySeverity;

  title: string;

  description: string;

  metric: string;

  currentValue: number;

  previousValue: number;

  changePercent: number;

  detectedAt: string;
};


function getSeverity(
  changePercent: number
): AnomalySeverity {

  const absoluteChange =
    Math.abs(changePercent);


  if (absoluteChange >= 50) {
    return "critical";
  }


  if (absoluteChange >= 25) {
    return "warning";
  }


  return "info";
}


function createAnomaly(
  type: AnomalyType,
  title: string,
  description: string,
  metric: string,
  currentValue: number,
  previousValue: number,
  changePercent: number
): FarmAnomaly {

  return {

    type,

    severity:
      getSeverity(changePercent),

    title,

    description,

    metric,

    currentValue,

    previousValue,

    changePercent,

    detectedAt:
      new Date().toISOString(),

  };
}


export function detectFarmAnomalies(
  data: FarmIntelligenceData,
  kpis: FarmKPIs,
  trends: FarmTrend[]
): FarmAnomaly[] {

  const anomalies: FarmAnomaly[] = [];


  /*
   * =========================================================
   * MILK PRODUCTION
   * =========================================================
   */

  const milkTrend =
    trends.find(
      (trend) =>
        trend.metric ===
        "Milk Production"
    );


  if (
    milkTrend &&
    milkTrend.changePercent !== null &&
    milkTrend.previous > 0 &&
    milkTrend.changePercent <= -20
  ) {

    anomalies.push(

      createAnomaly(

        "milk_drop",

        "Milk production has dropped",

        "Milk production is significantly lower than the previous comparison period.",

        "Milk Production",

        milkTrend.current,

        milkTrend.previous,

        milkTrend.changePercent

      )

    );

  }


  /*
   * =========================================================
   * FEED COST
   * =========================================================
   */

  const feedTrend =
    trends.find(
      (trend) =>
        trend.metric ===
        "Feed Cost"
    );


  if (
    feedTrend &&
    feedTrend.changePercent !== null &&
    feedTrend.previous > 0 &&
    feedTrend.changePercent >= 25
  ) {

    anomalies.push(

      createAnomaly(

        "feed_cost_increase",

        "Feed costs have increased",

        "Feed expenditure is significantly higher than the previous comparison period.",

        "Feed Cost",

        feedTrend.current,

        feedTrend.previous,

        feedTrend.changePercent

      )

    );

  }


  /*
   * =========================================================
   * GENERAL EXPENSES
   * =========================================================
   */

  const expenseTrend =
    trends.find(
      (trend) =>
        trend.metric ===
        "Expenses"
    );


  if (
    expenseTrend &&
    expenseTrend.changePercent !== null &&
    expenseTrend.previous > 0 &&
    expenseTrend.changePercent >= 25
  ) {

    anomalies.push(

      createAnomaly(

        "expense_increase",

        "Farm expenses have increased",

        "Farm expenses are significantly higher than the previous comparison period.",

        "Expenses",

        expenseTrend.current,

        expenseTrend.previous,

        expenseTrend.changePercent

      )

    );

  }


  /*
   * =========================================================
   * PROFITABILITY
   * =========================================================
   */

  const currentNetIncome =
    kpis.netIncome;


  if (
    currentNetIncome < 0
  ) {

    anomalies.push(

      createAnomaly(

        "profitability_drop",

        "Farm profitability is negative",

        "Recorded farm expenses currently exceed recorded farm income.",

        "Net Income",

        currentNetIncome,

        0,

        -100

      )

    );

  }


  /*
   * =========================================================
   * HEALTH EVENTS
   * =========================================================
   */

  if (
    data.healthRecords.length >= 3
  ) {

    anomalies.push({

      type:
        "health_event_spike",

      severity:
        "warning",

      title:
        "Multiple health events recorded",

      description:
        "Several animal health events have been recorded. Review the affected animals and veterinary records.",

      metric:
        "Health Events",

      currentValue:
        data.healthRecords.length,

      previousValue:
        0,

      changePercent:
        0,

      detectedAt:
        new Date().toISOString(),

    });

  }


  /*
   * =========================================================
   * BREEDING COST
   * =========================================================
   */

  if (
    kpis.breedingCosts > 0 &&
    kpis.breedingEvents > 0
  ) {

    const averageBreedingCost =
      kpis.breedingCosts /
      kpis.breedingEvents;


    if (
      averageBreedingCost >= 5000
    ) {

      anomalies.push({

        type:
          "breeding_cost_increase",

        severity:
          "warning",

        title:
          "Breeding cost per event is high",

        description:
          "The average recorded cost per breeding event is relatively high and should be reviewed.",

        metric:
          "Average Breeding Cost",

        currentValue:
          averageBreedingCost,

        previousValue:
          0,

        changePercent:
          0,

        detectedAt:
          new Date().toISOString(),

      });

    }

  }


  /*
   * =========================================================
   * FEED COST PER LITRE
   * =========================================================
   */

  if (
    kpis.feedCostPerMilkLitre > 20
  ) {

    anomalies.push({

      type:
        "high_feed_cost_per_litre",

      severity:
        "warning",

      title:
        "Feed cost per litre is high",

      description:
        "The farm is spending a relatively high amount on feed for each litre of milk produced.",

      metric:
        "Feed Cost / Milk Litre",

      currentValue:
        kpis.feedCostPerMilkLitre,

      previousValue:
        0,

      changePercent:
        0,

      detectedAt:
        new Date().toISOString(),

    });

  }


  return anomalies;
}