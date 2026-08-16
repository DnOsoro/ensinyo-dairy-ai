import {
  getFarmIntelligenceData,
} from "./farm-data";

import {
  calculateFarmKPIs,
} from "./kpis";

import {
  calculateFarmTrends,
} from "./trends";

import {
  detectFarmAnomalies,
} from "./anomalies";

import {
  generateFarmInsights,
} from "./insights";

import {
  generateFarmRecommendations,
} from "./recommendations";

import {
  buildFarmAIContext,
} from "./ai-context";


export async function getFarmIntelligence(
  farmId: string
) {
  const data =
    await getFarmIntelligenceData(farmId);


  if (!data) {
    return null;
  }


  /*
   * =========================================================
   * 1. KPI ENGINE
   * =========================================================
   */

  const kpis =
    calculateFarmKPIs(data);


  /*
   * =========================================================
   * 2. TREND ENGINE
   * =========================================================
   */

  const trends =
    calculateFarmTrends(data);


  /*
   * =========================================================
   * 3. ANOMALY ENGINE
   * =========================================================
   */

  const anomalies =
    detectFarmAnomalies(
      data,
      kpis,
      trends
    );


  /*
   * =========================================================
   * 4. INSIGHT ENGINE
   * =========================================================
   */

  const insights =
    generateFarmInsights(
      kpis,
      trends,
      anomalies
    );


  /*
   * =========================================================
   * 5. RECOMMENDATION ENGINE
   * ========================================================= */

  const recommendations =
    generateFarmRecommendations(
      kpis,
      insights,
      anomalies
    );


  /*
   * =========================================================
   * 6. AI CONTEXT
   * ========================================================= */

  const aiContext =
    buildFarmAIContext(
      data,
      kpis,
      trends,
      anomalies,
      insights,
      recommendations
    );


  /*
   * =========================================================
   * FINAL INTELLIGENCE OBJECT
   * ========================================================= */

  return {
    farm: data.farm,

    data,

    kpis,

    trends,

    anomalies,

    insights,

    recommendations,

    aiContext,
  };
}