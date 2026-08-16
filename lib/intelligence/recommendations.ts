import type {
  FarmKPIs,
} from "./types";

import type {
  FarmAnomaly,
} from "./anomalies";

import type {
  FarmInsight,
} from "./insights";


export type RecommendationPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";


export type FarmRecommendation = {
  id: string;

  priority:
    RecommendationPriority;

  category:
    | "production"
    | "feed"
    | "finance"
    | "health"
    | "breeding"
    | "general";

  title: string;

  action: string;

  reason: string;

  metric?: string;

  value?: number;

  unit?: string;
};


export function generateFarmRecommendations(
  kpis: FarmKPIs,
  insights: FarmInsight[],
  anomalies: FarmAnomaly[]
): FarmRecommendation[] {

  const recommendations:
    FarmRecommendation[] = [];


  /*
   * =========================================================
   * 1. MILK PRODUCTION
   * =========================================================
   */

  const milkDrop =
    anomalies.find(
      (anomaly) =>
        anomaly.type ===
        "milk_drop"
    );


  if (milkDrop) {

    recommendations.push({

      id:
        "review-milk-production",

      priority:
        "high",

      category:
        "production",

      title:
        "Investigate the milk production decline",

      action:
        "Review the affected cow's feed intake, health records, water access, lactation stage and recent breeding activity. Compare today's production with previous records.",

      reason:
        `Milk production has fallen by ${Math.abs(milkDrop.changePercent).toFixed(1)}% compared with the previous comparison period.`,

      metric:
        "Milk Production",

      value:
        milkDrop.changePercent,

      unit:
        "%",

    });

  }


  /*
   * =========================================================
   * 2. LOW / ZERO MILK RECORDING
   * =========================================================
   */

  if (
    kpis.totalCows > 0 &&
    kpis.totalMilkLitres === 0
  ) {

    recommendations.push({

      id:
        "record-milk-production",

      priority:
        "medium",

      category:
        "production",

      title:
        "Start recording daily milk production",

      action:
        "Record morning and evening milk production for every lactating cow. Consistent records will allow Ensinyo to measure productivity and identify production declines early.",

      reason:
        "The farm has cows recorded but no milk production is available in the current intelligence period.",

      metric:
        "Milk Production",

      value:
        0,

      unit:
        "L",

    });

  }


  /*
   * =========================================================
   * 3. FEED EFFICIENCY
   * =========================================================
   */

  if (
    kpis.feedCostPerMilkLitre > 20
  ) {

    recommendations.push({

      id:
        "review-feed-efficiency",

      priority:
        kpis.feedCostPerMilkLitre >= 30
          ? "high"
          : "medium",

      category:
        "feed",

      title:
        "Review feed efficiency",

      action:
        "Review the current ration, feed prices, quantities supplied and milk yield. Compare feed costs against milk production and the nutritional requirements of each cow.",

      reason:
        `Feed cost is currently about KSh ${kpis.feedCostPerMilkLitre.toFixed(2)} per litre of milk.`,

      metric:
        "Feed Cost / Milk Litre",

      value:
        kpis.feedCostPerMilkLitre,

      unit:
        "KSh/L",

    });

  }


  /*
   * =========================================================
   * 4. FEED COST INCREASE
   * =========================================================
   */

  const feedCostIncrease =
    anomalies.find(
      (anomaly) =>
        anomaly.type ===
        "feed_cost_increase"
    );


  if (feedCostIncrease) {

    recommendations.push({

      id:
        "control-feed-cost",

      priority:
        feedCostIncrease.changePercent >= 50
          ? "high"
          : "medium",

      category:
        "feed",

      title:
        "Investigate rising feed costs",

      action:
        "Review recent feed purchases, quantities, prices and feed types to identify where costs are increasing. Compare supplier prices and cost per kilogram.",

      reason:
        `Feed expenditure has increased by ${feedCostIncrease.changePercent.toFixed(1)}% compared with the previous comparison period.`,

      metric:
        "Feed Cost",

      value:
        feedCostIncrease.changePercent,

      unit:
        "%",

    });

  }


  /*
   * =========================================================
   * 5. GENERAL EXPENSES
   * =========================================================
   */

  const expenseIncrease =
    anomalies.find(
      (anomaly) =>
        anomaly.type ===
        "expense_increase"
    );


  if (expenseIncrease) {

    recommendations.push({

      id:
        "review-expenses",

      priority:
        expenseIncrease.changePercent >= 50
          ? "high"
          : "medium",

      category:
        "finance",

      title:
        "Review increasing farm expenses",

      action:
        "Review the expense breakdown and identify the categories responsible for the increase before making spending decisions.",

      reason:
        `Farm expenses have increased by ${expenseIncrease.changePercent.toFixed(1)}% compared with the previous comparison period.`,

      metric:
        "Expenses",

      value:
        expenseIncrease.changePercent,

      unit:
        "%",

    });

  }


  /*
   * =========================================================
   * 6. PROFITABILITY
   * =========================================================
   */

  if (
    kpis.netIncome < 0
  ) {

    recommendations.push({

      id:
        "restore-profitability",

      priority:
        "urgent",

      category:
        "finance",

      title:
        "Address negative farm profitability",

      action:
        "Review major expense categories and income sources immediately. Identify the largest contributors to the negative net position and determine whether costs can be reduced without compromising animal health or production.",

      reason:
        `Recorded farm expenses currently exceed income by KSh ${Math.abs(kpis.netIncome).toLocaleString()}.`,

      metric:
        "Net Income",

      value:
        kpis.netIncome,

      unit:
        "KSh",

    });

  }


  /*
   * =========================================================
   * 7. VERY LOW PROFIT MARGIN
   * =========================================================
   */

  if (
    kpis.totalIncome > 0 &&
    kpis.profitMargin >= 0 &&
    kpis.profitMargin < 10
  ) {

    recommendations.push({

      id:
        "improve-profit-margin",

      priority:
        "high",

      category:
        "finance",

      title:
        "Improve farm profit margin",

      action:
        "Review feed, veterinary, breeding and other operating expenses against farm income. Focus on the largest cost categories and identify opportunities to improve revenue per productive animal.",

      reason:
        `The current recorded profit margin is only ${kpis.profitMargin.toFixed(1)}%.`,

      metric:
        "Profit Margin",

      value:
        kpis.profitMargin,

      unit:
        "%",

    });

  }


  /*
   * =========================================================
   * 8. HEALTH
   * =========================================================
   */

  const healthSpike =
    anomalies.find(
      (anomaly) =>
        anomaly.type ===
        "health_event_spike"
    );


  if (healthSpike) {

    recommendations.push({

      id:
        "review-health-events",

      priority:
        "high",

      category:
        "health",

      title:
        "Review recent health events",

      action:
        "Review affected cows, diagnoses, treatments, medications and veterinary notes. Look for recurring conditions that may indicate a broader herd-management issue.",

      reason:
        `${healthSpike.currentValue} health events have been recorded in the available farm data.`,

      metric:
        "Health Events",

      value:
        healthSpike.currentValue,

      unit:
        "events",

    });

  }


  /*
   * =========================================================
   * 9. HEALTH COST MONITORING
   * =========================================================
   */

  if (
    kpis.healthEvents > 0 &&
    kpis.healthCosts > 0
  ) {

    const averageHealthCost =
      kpis.healthCosts /
      kpis.healthEvents;


    if (
      averageHealthCost >= 3000
    ) {

      recommendations.push({

        id:
          "monitor-health-costs",

        priority:
          "medium",

        category:
          "health",

        title:
          "Monitor veterinary costs",

        action:
          "Review veterinary charges, medications and treatment frequency. Track health costs per cow to identify recurring or unusually expensive cases.",

        reason:
          `Average recorded health cost is KSh ${averageHealthCost.toFixed(2)} per health event.`,

        metric:
          "Average Health Cost",

        value:
          averageHealthCost,

        unit:
          "KSh/event",

      });

    }

  }


  /*
   * =========================================================
   * 10. BREEDING COST
   * =========================================================
   */

  const breedingCostIssue =
    anomalies.find(
      (anomaly) =>
        anomaly.type ===
        "breeding_cost_increase"
    );


  if (breedingCostIssue) {

    recommendations.push({

      id:
        "review-breeding-cost",

      priority:
        "medium",

      category:
        "breeding",

      title:
        "Review breeding costs",

      action:
        "Review breeding method, semen or service costs, veterinary charges and breeding outcomes. Compare the cost of breeding against successful pregnancies and calvings.",

      reason:
        "The recorded average cost per breeding event is high.",

      metric:
        "Average Breeding Cost",

      value:
        breedingCostIssue.currentValue,

      unit:
        "KSh",

    });

  }


  /*
   * =========================================================
   * 11. BREEDING PERFORMANCE
   * =========================================================
   */

  if (
    kpis.totalCows > 0 &&
    kpis.pregnancyRate < 50
  ) {

    recommendations.push({

      id:
        "review-pregnancy-rate",

      priority:
        "high",

      category:
        "breeding",

      title:
        "Review reproductive performance",

      action:
        "Review breeding dates, breeding methods, pregnancy checks, reproductive health and the timing of insemination or mating for cows that have not become pregnant.",

      reason:
        `The recorded pregnancy rate is ${kpis.pregnancyRate.toFixed(1)}%.`,

      metric:
        "Pregnancy Rate",

      value:
        kpis.pregnancyRate,

      unit:
        "%",

    });

  }


  /*
   * =========================================================
   * 12. USE INSIGHTS TO PRIORITIZE
   * =========================================================
   *
   * We intentionally use the insights here.
   * This creates the beginning of the chain:
   *
   * KPI → Trend → Anomaly → Insight → Recommendation
   *
   */

  const warningInsights =
    insights.filter(
      (insight) =>
        insight.severity ===
          "warning" ||
        insight.severity ===
          "critical"
    );


  if (
    warningInsights.length > 0 &&
    recommendations.length === 0
  ) {

    recommendations.push({

      id:
        "review-warning-insights",

      priority:
        "medium",

      category:
        "general",

      title:
        "Review farm warning indicators",

      action:
        "Review the warning indicators highlighted by the intelligence engine and inspect the underlying farm records before making management decisions.",

      reason:
        `${warningInsights.length} warning or critical farm insight${warningInsights.length === 1 ? "" : "s"} ${warningInsights.length === 1 ? "was" : "were"} detected.`,

    });

  }


  /*
   * =========================================================
   * 13. NO CRITICAL PROBLEMS
   * =========================================================
   */

  if (
    recommendations.length === 0
  ) {

    recommendations.push({

      id:
        "continue-monitoring",

      priority:
        "low",

      category:
        "general",

      title:
        "Continue monitoring the farm",

      action:
        "Continue recording milk, feed, health, breeding, income and expense data consistently. More historical data will allow Ensinyo to identify trends, anomalies and opportunities with greater confidence.",

      reason:
        "No major actionable issue has been detected from the current intelligence data.",

    });

  }


  return recommendations;
}