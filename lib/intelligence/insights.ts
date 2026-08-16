import type {
  FarmKPIs,
} from "./types";

import type {
  FarmTrend,
} from "./trends";

import type {
  FarmAnomaly,
} from "./anomalies";


export type InsightSeverity =
  | "info"
  | "positive"
  | "warning"
  | "critical";


export type FarmInsight = {
  id: string;

  severity: InsightSeverity;

  title: string;

  message: string;

  category:
    | "production"
    | "finance"
    | "feed"
    | "health"
    | "breeding"
    | "general";

  metric?: string;

  value?: number;

  unit?: string;
};


export function generateFarmInsights(
  kpis: FarmKPIs,
  trends: FarmTrend[],
  anomalies: FarmAnomaly[]
): FarmInsight[] {

  const insights: FarmInsight[] = [];


  /*
   * =========================================================
   * PRODUCTION
   * =========================================================
   */

  if (
    kpis.averageDailyMilkLitres > 0
  ) {

    insights.push({

      id:
        "milk-production-summary",

      severity:
        "info",

      title:
        "Milk production recorded",

      message:
        `Your farm is currently recording an average of ${kpis.averageDailyMilkLitres.toFixed(1)} litres of milk per day.`,

      category:
        "production",

      metric:
        "Average Daily Milk",

      value:
        kpis.averageDailyMilkLitres,

      unit:
        "L/day",

    });

  }


  /*
   * =========================================================
   * MILK TREND
   * =========================================================
   */

  const milkTrend =
    trends.find(
      (trend) =>
        trend.metric ===
        "Milk Production"
    );


  /*
   * IMPORTANT:
   *
   * changePercent can be null when there is
   * no previous-period data.
   *
   * We must not claim that production
   * increased or decreased when there is
   * no valid historical comparison.
   */

  if (
    milkTrend &&
    milkTrend.changePercent !== null &&
    milkTrend.previous > 0 &&
    milkTrend.changePercent <= -10
  ) {

    insights.push({

      id:
        "milk-production-decline",

      severity:
        "warning",

      title:
        "Milk production is declining",

      message:
        `Milk production has decreased by ${Math.abs(milkTrend.changePercent).toFixed(1)}% compared with the previous period. Review feeding, animal health and lactation performance.`,

      category:
        "production",

      metric:
        "Milk Production",

      value:
        milkTrend.current,

      unit:
        "L",

    });

  }


  /*
   * =========================================================
   * FINANCE
   * =========================================================
   */

  if (
    kpis.netIncome > 0
  ) {

    insights.push({

      id:
        "positive-net-income",

      severity:
        "positive",

      title:
        "Positive farm cash position",

      message:
        `Recorded income currently exceeds recorded expenses by KSh ${kpis.netIncome.toLocaleString()}.`,

      category:
        "finance",

      metric:
        "Net Income",

      value:
        kpis.netIncome,

      unit:
        "KSh",

    });

  }


  if (
    kpis.netIncome < 0
  ) {

    insights.push({

      id:
        "negative-net-income",

      severity:
        "critical",

      title:
        "Farm expenses exceed income",

      message:
        `Recorded farm expenses currently exceed income by KSh ${Math.abs(kpis.netIncome).toLocaleString()}. Review major expense categories and recent income sources.`,

      category:
        "finance",

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
   * FEED
   * =========================================================
   */

  if (
    kpis.totalFeedKg > 0
  ) {

    insights.push({

      id:
        "feed-efficiency",

      severity:
        kpis.feedCostPerMilkLitre <= 20
          ? "positive"
          : "warning",

      title:
        "Feed efficiency",

      message:
        `The farm has recorded ${kpis.totalFeedKg.toFixed(1)} kg of feed at a cost of KSh ${kpis.totalFeedCost.toLocaleString()}, equivalent to approximately KSh ${kpis.feedCostPerMilkLitre.toFixed(2)} per litre of milk produced.`,

      category:
        "feed",

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
   * HEALTH
   * =========================================================
   */

  if (
    kpis.healthEvents === 0
  ) {

    insights.push({

      id:
        "no-health-events",

      severity:
        "positive",

      title:
        "No health events recorded",

      message:
        "No animal health events have been recorded in the available farm data for the current analysis period.",

      category:
        "health",

    });

  }


  if (
    kpis.healthEvents > 0
  ) {

    insights.push({

      id:
        "health-events-recorded",

      severity:
        kpis.healthEvents >= 3
          ? "warning"
          : "info",

      title:
        "Animal health activity recorded",

      message:
        `${kpis.healthEvents} health event${kpis.healthEvents === 1 ? "" : "s"} ${kpis.healthEvents === 1 ? "has" : "have"} been recorded, with associated health costs of KSh ${kpis.healthCosts.toLocaleString()}.`,

      category:
        "health",

      metric:
        "Health Events",

      value:
        kpis.healthEvents,

      unit:
        "events",

    });

  }


  /*
   * =========================================================
   * BREEDING
   * =========================================================
   */

  if (
    kpis.pregnantCows > 0
  ) {

    insights.push({

      id:
        "pregnancy-status",

      severity:
        "positive",

      title:
        "Pregnancy activity",

      message:
        `${kpis.pregnantCows} cow${kpis.pregnantCows === 1 ? "" : "s"} currently recorded as pregnant, giving a recorded pregnancy rate of ${kpis.pregnancyRate.toFixed(1)}%.`,

      category:
        "breeding",

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
   * ANOMALY-BASED INSIGHTS
   * =========================================================
   */

  for (
    const anomaly of anomalies
  ) {

    insights.push({

      id:
        `anomaly-${anomaly.type}`,

      severity:
        anomaly.severity === "critical"
          ? "critical"
          : anomaly.severity === "warning"
            ? "warning"
            : "info",

      title:
        anomaly.title,

      message:
        anomaly.description,

      category:
        anomaly.type === "milk_drop"
          ? "production"
          : anomaly.type === "feed_cost_increase" ||
              anomaly.type === "high_feed_cost_per_litre"
            ? "feed"
            : anomaly.type === "expense_increase" ||
                anomaly.type === "profitability_drop"
              ? "finance"
              : anomaly.type === "health_event_spike"
                ? "health"
                : "breeding",

      metric:
        anomaly.metric,

      value:
        anomaly.currentValue,

      unit:
        "%",

    });

  }


  return insights;
}