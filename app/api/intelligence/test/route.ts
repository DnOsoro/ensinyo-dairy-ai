import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFarmIntelligence } from "@/lib/intelligence";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: farms, error: farmError } =
      await supabase
        .from("farms")
        .select("id, farm_name")
        .eq("owner_id", user.id)
        .order("farm_name");

    if (farmError) {
      return NextResponse.json(
        { error: farmError.message },
        { status: 500 }
      );
    }

    if (!farms || farms.length === 0) {
      return NextResponse.json({
        message: "No farm found",
      });
    }

    const intelligence =
      await getFarmIntelligence(farms[0].id);

    if (!intelligence) {
      return NextResponse.json(
        {
          error: "Unable to load farm intelligence",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      farm: intelligence.farm,
      kpis: intelligence.kpis,
    });
  } catch (error) {
    console.error(
      "Intelligence test error:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}