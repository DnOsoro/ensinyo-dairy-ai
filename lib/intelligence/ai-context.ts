import type {
  FarmIntelligenceData,
  FarmKPIs,
} from "./types";

import type {
  FarmTrend,
} from "./trends";

import type {
  FarmAnomaly,
} from "./anomalies";

import type {
  FarmInsight,
} from "./insights";

import type {
  FarmRecommendation,
} from "./recommendations";


export type FarmAIContext = {
  farm: FarmIntelligenceData["farm"];

  summary: {
    totalCows: number;
    activeCows: number;
    pregnantCows: number;

    totalMilkLitres: number;
    averageDailyMilkLitres: number;

    totalFeedKg: number;
    totalFeedCost: number;
    feedCostPerKg: number;
    feedCostPerMilkLitre: number;

    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    profitMargin: number;

    healthEvents: number;
    healthCosts: number;

    breedingEvents: number;
    breedingCosts: number;

    upcomingCalvings: number;
    pregnancyRate: number;
  };

  cows: FarmIntelligenceData["cows"];

  milkRecords: FarmIntelligenceData["milkRecords"];

  feedRecords: FarmIntelligenceData["feedRecords"];

  healthRecords: FarmIntelligenceData["healthRecords"];

  breedingRecords: FarmIntelligenceData["breedingRecords"];

  expenses: FarmIntelligenceData["expenses"];

  income: FarmIntelligenceData["income"];

  trends: FarmTrend[];

  anomalies: FarmAnomaly[];

  insights: FarmInsight[];

  recommendations: FarmRecommendation[];
};


export function buildFarmAIContext(
  data: FarmIntelligenceData,
  kpis: FarmKPIs,
  trends: FarmTrend[],
  anomalies: FarmAnomaly[],
  insights: FarmInsight[],
  recommendations: FarmRecommendation[]
): FarmAIContext {

  return {
    /*
     * =========================================================
     * FARM
     * =========================================================
     */

    farm: data.farm,


    /*
     * =========================================================
     * FARM SUMMARY
     *
     * These are trusted values calculated by the deterministic
     * intelligence engine.
     * =========================================================
     */

    summary: {
      totalCows:
        kpis.totalCows,

      activeCows:
        kpis.activeCows,

      pregnantCows:
        kpis.pregnantCows,

      totalMilkLitres:
        kpis.totalMilkLitres,

      averageDailyMilkLitres:
        kpis.averageDailyMilkLitres,

      totalFeedKg:
        kpis.totalFeedKg,

      totalFeedCost:
        kpis.totalFeedCost,

      feedCostPerKg:
        kpis.feedCostPerKg,

      feedCostPerMilkLitre:
        kpis.feedCostPerMilkLitre,

      totalIncome:
        kpis.totalIncome,

      totalExpenses:
        kpis.totalExpenses,

      netIncome:
        kpis.netIncome,

      profitMargin:
        kpis.profitMargin,

      healthEvents:
        kpis.healthEvents,

      healthCosts:
        kpis.healthCosts,

      breedingEvents:
        kpis.breedingEvents,

      breedingCosts:
        kpis.breedingCosts,

      upcomingCalvings:
        kpis.upcomingCalvings,

      pregnancyRate:
        kpis.pregnancyRate,
    },


    /*
     * =========================================================
     * RAW FARM RECORDS
     * =========================================================
     */

    cows:
      data.cows,

    milkRecords:
      data.milkRecords,

    feedRecords:
      data.feedRecords,

    healthRecords:
      data.healthRecords,

    breedingRecords:
      data.breedingRecords,

    expenses:
      data.expenses,

    income:
      data.income,


    /*
     * =========================================================
     * DERIVED INTELLIGENCE
     * =========================================================
     */

    trends,

    anomalies,

    insights,

    recommendations,
  };
}