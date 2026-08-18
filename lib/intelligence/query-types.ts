export type FarmQueryIntent =
  | "milk_production"
  | "milk_projection"
  | "feed"
  | "finance"
  | "health"
  | "breeding"
  | "cow_profile"
  | "farm_summary";

export type FarmQueryPeriod =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "all_time";

export type FarmQuery = {
  intent: FarmQueryIntent;

  period: FarmQueryPeriod;

  cowId?: string;

  cowName?: string;

  cowCount?: number;

  rawQuestion: string;
};

export type FarmQueryResult = {
  success: boolean;

  question: string;

  intent: FarmQueryIntent;

  period: FarmQueryPeriod;

  answer: string;

  data?: Record<string, unknown>;
};