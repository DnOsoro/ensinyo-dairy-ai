import { createClient } from "@/lib/supabase/server";
import { FarmIntelligenceData } from "./types";

export async function getFarmIntelligenceData(
  farmId: string
): Promise<FarmIntelligenceData | null> {
  const supabase = await createClient();

  const [
    farmResult,
    cowsResult,
    milkResult,
    feedResult,
    healthResult,
    breedingResult,
    expensesResult,
    incomeResult,
  ] = await Promise.all([
    supabase
      .from("farms")
      .select(`
        id,
        farm_name,
        location,
        county,
        country
      `)
      .eq("id", farmId)
      .single(),

    supabase
      .from("cows")
      .select(`
        id,
        tag_number,
        name,
        breed,
        sex,
        status,
        pregnancy_status,
        date_of_birth,
        weight_kg
      `)
      .eq("farm_id", farmId),

    supabase
      .from("milk_records")
      .select(`
        id,
        cow_id,
        record_date,
        morning_litres,
        evening_litres,
        total_litres,
        lactation_number
      `)
      .eq("farm_id", farmId),

    supabase
      .from("feed_records")
      .select(`
        id,
        feed_date,
        feed_type,
        quantity_kg,
        cost_ksh
      `)
      .eq("farm_id", farmId),

    supabase
      .from("health_records")
      .select(`
        id,
        cow_id,
        event_date,
        event_type,
        diagnosis,
        treatment,
        cost_ksh
      `)
      .in(
        "cow_id",
        (
          await supabase
            .from("cows")
            .select("id")
            .eq("farm_id", farmId)
        ).data?.map((cow) => cow.id) ?? []
      ),

    supabase
      .from("breeding_records")
      .select(`
        id,
        cow_id,
        breeding_date,
        breeding_method,
        expected_calving_date,
        actual_calving_date,
        pregnancy_status,
        calving_outcome,
        calf_count,
        cost_ksh
      `)
      .in(
        "cow_id",
        (
          await supabase
            .from("cows")
            .select("id")
            .eq("farm_id", farmId)
        ).data?.map((cow) => cow.id) ?? []
      ),

    supabase
      .from("expenses")
      .select(`
        id,
        expense_date,
        category,
        description,
        amount_ksh
      `)
      .eq("farm_id", farmId),

    supabase
      .from("income")
      .select(`
        id,
        income_date,
        category,
        description,
        amount_ksh
      `)
      .eq("farm_id", farmId),
  ]);

  if (farmResult.error || !farmResult.data) {
    console.error(
      "Intelligence farm loading error:",
      farmResult.error
    );

    return null;
  }

  return {
    farm: {
      id: farmResult.data.id,
      name: farmResult.data.farm_name,
      location: farmResult.data.location,
      county: farmResult.data.county,
      country: farmResult.data.country,
    },

    cows: cowsResult.data ?? [],

    milkRecords: milkResult.data ?? [],

    feedRecords: (feedResult.data ?? []).map((record) => ({
      ...record,
      cost_ksh: record.cost_ksh ?? 0,
    })),

    healthRecords: (healthResult.data ?? []).map((record) => ({
      ...record,
      cost_ksh: record.cost_ksh ?? 0,
    })),

    breedingRecords: (breedingResult.data ?? []).map((record) => ({
      ...record,
      cost_ksh: record.cost_ksh ?? 0,
    })),

    expenses: expensesResult.data ?? [],

    income: incomeResult.data ?? [],
  };
}