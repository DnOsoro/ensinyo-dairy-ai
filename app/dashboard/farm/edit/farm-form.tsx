"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Farm = {
  id: string;
  farm_name: string;
  location: string | null;
  county: string | null;
  country: string | null;
  farm_type: string | null;
  total_acres: number | null;
  farming_system: string | null;
  main_activity: string | null;
};

export default function FarmForm({
  farm,
}: {
  farm: Farm | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [farmName, setFarmName] = useState(
    farm?.farm_name ?? ""
  );

  const [location, setLocation] = useState(
    farm?.location ?? ""
  );

  const [county, setCounty] = useState(
    farm?.county ?? ""
  );

  const [country, setCountry] = useState(
    farm?.country ?? "Kenya"
  );

  const [farmType, setFarmType] = useState(
    farm?.farm_type ?? ""
  );

  const [totalAcres, setTotalAcres] = useState(
    farm?.total_acres?.toString() ?? ""
  );

  const [farmingSystem, setFarmingSystem] = useState(
    farm?.farming_system ?? ""
  );

  const [mainActivity, setMainActivity] = useState(
    farm?.main_activity ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      // --------------------------------------------------
      // 1. Get currently authenticated user
      // --------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Authentication error:", userError);
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // --------------------------------------------------
      // 2. Validate farm name
      // --------------------------------------------------

      if (!farmName.trim()) {
        setError("Please enter your farm name.");
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // 3. Convert farm size to number
      // --------------------------------------------------

      const acres =
        totalAcres.trim() === ""
          ? null
          : Number(totalAcres);

      if (
        acres !== null &&
        (!Number.isFinite(acres) || acres < 0)
      ) {
        setError(
          "Please enter a valid farm size in acres."
        );
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // 4. Prepare farm data
      // --------------------------------------------------

      const farmData = {
        farm_name: farmName.trim(),

        location:
          location.trim() || null,

        county:
          county.trim() || null,

        country:
          country.trim() || "Kenya",

        farm_type:
          farmType || null,

        total_acres:
          acres,

        farming_system:
          farmingSystem || null,

        main_activity:
          mainActivity || null,

        updated_at:
          new Date().toISOString(),
      };

      console.log("Saving farm:", farmData);

      // --------------------------------------------------
      // 5. UPDATE existing farm
      // --------------------------------------------------

      if (farm) {
        const { error: updateError } = await supabase
          .from("farms")
          .update(farmData)
          .eq("id", farm.id)
          .eq("owner_id", user.id);

        if (updateError) {
          console.error(
            "Farm update error:",
            updateError
          );

          setError(updateError.message);
          setLoading(false);
          return;
        }

        console.log("Farm updated successfully.");
      }

      // --------------------------------------------------
      // 6. CREATE new farm
      // --------------------------------------------------

      else {
        const { error: insertError } = await supabase
          .from("farms")
          .insert({
            ...farmData,
            owner_id: user.id,
          });

        if (insertError) {
          console.error(
            "Farm creation error:",
            insertError
          );

          setError(insertError.message);
          setLoading(false);
          return;
        }

        console.log("Farm created successfully.");
      }

      // --------------------------------------------------
      // 7. Return to farm dashboard
      // --------------------------------------------------

      router.push("/dashboard/farm");
      router.refresh();

    } catch (err) {
      console.error(
        "Unexpected farm error:",
        err
      );

      setError(
        "Something went wrong while saving the farm."
      );

      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
    >
      <div className="space-y-6">

        {/* FARM NAME */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Farm name
          </label>

          <input
            type="text"
            required
            value={farmName}
            onChange={(e) =>
              setFarmName(e.target.value)
            }
            placeholder="e.g. Ensinyo Dairy Farm"
            autoComplete="organization"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* LOCATION */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Location / Village
          </label>

          <input
            type="text"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            placeholder="e.g. Ensinyo"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* COUNTY */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            County
          </label>

          <input
            type="text"
            value={county}
            onChange={(e) =>
              setCounty(e.target.value)
            }
            placeholder="e.g. Kisii"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* COUNTRY */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Country
          </label>

          <input
            type="text"
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
            placeholder="Kenya"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* FARM TYPE */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Farm type
          </label>

          <select
            value={farmType}
            onChange={(e) =>
              setFarmType(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Select farm type
            </option>

            <option value="Dairy">
              Dairy
            </option>

            <option value="Crop">
              Crop
            </option>

            <option value="Mixed">
              Mixed farming
            </option>

            <option value="Livestock">
              Livestock
            </option>
          </select>
        </div>

        {/* FARM SIZE */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Total farm size (acres)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={totalAcres}
            onChange={(e) =>
              setTotalAcres(e.target.value)
            }
            placeholder="e.g. 10"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* FARMING SYSTEM */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Farming system
          </label>

          <select
            value={farmingSystem}
            onChange={(e) =>
              setFarmingSystem(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Select farming system
            </option>

            <option value="Zero grazing">
              Zero grazing
            </option>

            <option value="Semi-zero grazing">
              Semi-zero grazing
            </option>

            <option value="Free range">
              Free range
            </option>

            <option value="Mixed">
              Mixed
            </option>
          </select>
        </div>

        {/* MAIN ACTIVITY */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Main activity
          </label>

          <select
            value={mainActivity}
            onChange={(e) =>
              setMainActivity(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Select main activity
            </option>

            <option value="Dairy farming">
              Dairy farming
            </option>

            <option value="Crop farming">
              Crop farming
            </option>

            <option value="Dairy and crop farming">
              Dairy and crop farming
            </option>

            <option value="Livestock farming">
              Livestock farming
            </option>
          </select>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SAVE BUTTON */}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Saving..."
          : farm
          ? "Update farm"
          : "Save farm"}
      </button>

    </form>
  );
}