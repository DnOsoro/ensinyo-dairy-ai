import type {
  FarmQuery,
  FarmQueryIntent,
  FarmQueryPeriod,
} from "./query-types";


function detectIntent(
  question: string
): FarmQueryIntent {

  const q = question.toLowerCase();


  /*
   * COW PROFILE
   */

  if (
    q.includes("tell me about") ||
    q.includes("details about") ||
    q.includes("information about") ||
    q.includes("profile of") ||
    q.includes("who is")
  ) {
    return "cow_profile";
  }


  /*
   * MILK PRODUCTION
   */

  if (
    q.includes("milk") ||
    q.includes("litres") ||
    q.includes("liters") ||
    q.includes("production")
  ) {
    return "milk_production";
  }


  /*
   * FEED
   */

  if (
    q.includes("feed") ||
    q.includes("fodder") ||
    q.includes("ration") ||
    q.includes("feeding")
  ) {
    return "feed";
  }


  /*
   * FINANCE
   */

  if (
    q.includes("income") ||
    q.includes("revenue") ||
    q.includes("sales") ||
    q.includes("expense") ||
    q.includes("expenses") ||
    q.includes("cost") ||
    q.includes("profit") ||
    q.includes("money")
  ) {
    return "finance";
  }


  /*
   * HEALTH
   */

  if (
    q.includes("health") ||
    q.includes("sick") ||
    q.includes("disease") ||
    q.includes("treatment") ||
    q.includes("vet") ||
    q.includes("veterinary")
  ) {
    return "health";
  }


  /*
   * BREEDING
   */

  if (
    q.includes("pregnant") ||
    q.includes("pregnancy") ||
    q.includes("breeding") ||
    q.includes("calving") ||
    q.includes("calf")
  ) {
    return "breeding";
  }


  /*
   * FARM SUMMARY
   */

  return "farm_summary";
}


function detectPeriod(
  question: string
): FarmQueryPeriod {

  const q = question.toLowerCase();


  if (
    q.includes("today") ||
    q.includes("this day")
  ) {
    return "today";
  }


  if (
    q.includes("7 days") ||
    q.includes("seven days") ||
    q.includes("this week") ||
    q.includes("last week")
  ) {
    return "last_7_days";
  }


  if (
    q.includes("30 days") ||
    q.includes("thirty days") ||
    q.includes("this month") ||
    q.includes("last month")
  ) {
    return "last_30_days";
  }


  return "all_time";
}


function detectCowName(
  question: string
): string | undefined {

  /*
   * Initial parser deliberately keeps
   * cow-name detection simple.
   *
   * The query engine will later match
   * this against actual cows in the farm.
   */

  const match =
    question.match(
      /(?:about|of|for|did)\s+([A-Za-z][A-Za-z0-9_-]*)/i
    );


  if (!match) {
    return undefined;
  }


  const candidate =
    match[1]?.trim();


  if (!candidate) {
    return undefined;
  }


  /*
   * Avoid interpreting common question
   * words as cow names.
   */

  const ignoredWords = [
    "the",
    "my",
    "our",
    "a",
    "an",
    "how",
    "what",
    "which",
    "much",
    "many",
  ];


  if (
    ignoredWords.includes(
      candidate.toLowerCase()
    )
  ) {
    return undefined;
  }


  return candidate;
}


export function parseFarmQuery(
  question: string
): FarmQuery {

  const cleanQuestion =
    question.trim();


  return {
    intent:
      detectIntent(cleanQuestion),

    period:
      detectPeriod(cleanQuestion),

    cowName:
      detectCowName(cleanQuestion),

    rawQuestion:
      cleanQuestion,
  };
}