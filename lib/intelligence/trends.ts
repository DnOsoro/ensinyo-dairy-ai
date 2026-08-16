import type {
  FarmIntelligenceData,
} from "./types";

import {
  aggregateFarmWindow,
} from "./aggregation";

import {
  getComparisonWindows,
} from "./date-windows";


export type TrendDirection =
  | "up"
  | "down"
  | "stable"
  | "new_data"
  | "no_data";


export type FarmTrend = {
  metric: string;

  period:
    | "7_days"
    | "30_days";

  current: number;

  previous: number;

  changePercent:
    | number
    | null;

  direction:
    TrendDirection;
};


function calculateChange(
  current: number,
  previous: number
): number | null {

  /*
   * No previous data means
   * we cannot calculate a real
   * percentage change.
   */

  if (previous === 0) {

    if (current === 0) {
      return 0;
    }

    return null;
  }


  return (
    ((current - previous) /
      previous) *
    100
  );
}


function getDirection(
  current: number,
  previous: number,
  changePercent:
    | number
    | null
): TrendDirection {

  /*
   * Nothing recorded in either
   * period.
   */

  if (
    current === 0 &&
    previous === 0
  ) {
    return "no_data";
  }


  /*
   * Current data exists but there
   * is no historical baseline.
   */

  if (
    previous === 0 &&
    current > 0
  ) {
    return "new_data";
  }


  if (
    changePercent === null
  ) {
    return "new_data";
  }


  if (changePercent > 5) {
    return "up";
  }


  if (changePercent < -5) {
    return "down";
  }


  return "stable";
}


function createTrend(
  metric: string,
  period:
    | "7_days"
    | "30_days",
  current: number,
  previous: number
): FarmTrend {

  const changePercent =
    calculateChange(
      current,
      previous
    );


  return {
    metric,

    period,

    current,

    previous,

    changePercent,

    direction:
      getDirection(
        current,
        previous,
        changePercent
      ),
  };
}


export function calculateFarmTrends(
  data: FarmIntelligenceData
): FarmTrend[] {

  const trends: FarmTrend[] = [];


  /*
   * =========================================================
   * 7-DAY COMPARISON
   * =========================================================
   */

  const sevenDayWindows =
    getComparisonWindows(7);


  const current7 =
    aggregateFarmWindow(
      data,
      sevenDayWindows.current.start,
      sevenDayWindows.current.end
    );


  const previous7 =
    aggregateFarmWindow(
      data,
      sevenDayWindows.previous.start,
      sevenDayWindows.previous.end
    );


  trends.push(
    createTrend(
      "Milk Production",
      "7_days",
      current7.totalMilkLitres,
      previous7.totalMilkLitres
    )
  );


  trends.push(
    createTrend(
      "Feed Cost",
      "7_days",
      current7.totalFeedCost,
      previous7.totalFeedCost
    )
  );


  trends.push(
    createTrend(
      "Income",
      "7_days",
      current7.totalIncome,
      previous7.totalIncome
    )
  );


  trends.push(
    createTrend(
      "Expenses",
      "7_days",
      current7.totalExpenses,
      previous7.totalExpenses
    )
  );


  /*
   * =========================================================
   * 30-DAY COMPARISON
   * =========================================================
   */

  const thirtyDayWindows =
    getComparisonWindows(30);


  const current30 =
    aggregateFarmWindow(
      data,
      thirtyDayWindows.current.start,
      thirtyDayWindows.current.end
    );


  const previous30 =
    aggregateFarmWindow(
      data,
      thirtyDayWindows.previous.start,
      thirtyDayWindows.previous.end
    );


  trends.push(
    createTrend(
      "Milk Production",
      "30_days",
      current30.totalMilkLitres,
      previous30.totalMilkLitres
    )
  );


  trends.push(
    createTrend(
      "Feed Cost",
      "30_days",
      current30.totalFeedCost,
      previous30.totalFeedCost
    )
  );


  trends.push(
    createTrend(
      "Income",
      "30_days",
      current30.totalIncome,
      previous30.totalIncome
    )
  );


  trends.push(
    createTrend(
      "Expenses",
      "30_days",
      current30.totalExpenses,
      previous30.totalExpenses
    )
  );


  return trends;
}
