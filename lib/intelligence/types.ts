export type IntelligencePeriod = {
  startDate: string;
  endDate: string;
};

export type FarmIntelligenceData = {
  farm: {
    id: string;
    name: string;
    location: string | null;
    county: string | null;
    country: string | null;
  };

  cows: Array<{
    id: string;
    tag_number: string;
    name: string | null;
    breed: string | null;
    sex: string;
    status: string;
    pregnancy_status: string | null;
    date_of_birth: string | null;
    weight_kg: number | null;
  }>;

  milkRecords: Array<{
    id: string;
    cow_id: string;
    record_date: string;
    morning_litres: number;
    evening_litres: number;
    total_litres: number;
    lactation_number: number | null;
  }>;

  feedRecords: Array<{
    id: string;
    feed_date: string;
    feed_type: string;
    quantity_kg: number;
    cost_ksh: number;
  }>;

  healthRecords: Array<{
    id: string;
    cow_id: string;
    event_date: string;
    event_type: string;
    diagnosis: string | null;
    treatment: string | null;
    cost_ksh: number;
  }>;

  breedingRecords: Array<{
    id: string;
    cow_id: string;
    breeding_date: string;
    breeding_method: string | null;
    expected_calving_date: string | null;
    actual_calving_date: string | null;
    pregnancy_status: string | null;
    calving_outcome: string | null;
    calf_count: number | null;
    cost_ksh: number;
  }>;

  expenses: Array<{
    id: string;
    expense_date: string;
    category: string;
    description: string | null;
    amount_ksh: number;
  }>;

  income: Array<{
    id: string;
    income_date: string;
    category: string;
    description: string | null;
    amount_ksh: number;
  }>;
};

export type FarmKPIs = {
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