"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Farm = {
  id: string;
  farm_name: string;
};

export default function CowForm({
  farms,
}: {
  farms: Farm[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [farmId, setFarmId] = useState(
    farms.length === 1 ? farms[0].id : ""
  );

  const [tagNumber, setTagNumber] = useState("");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [color, setColor] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [status, setStatus] = useState("Active");
  const [pregnancyStatus, setPregnancyStatus] =
    useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    // ----------------------------------------
    // Validate farm
    // ----------------------------------------

    if (!farmId) {
      setError("Please select a farm.");
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // Validate tag number
    // ----------------------------------------

    if (!tagNumber.trim()) {
      setError("Please enter the cow's tag number.");
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // Validate sex
    // ----------------------------------------

    if (!sex) {
      setError("Please select the cow's sex.");
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // Validate weight
    // ----------------------------------------

    const weight =
      weightKg.trim() === ""
        ? null
        : Number(weightKg);

    if (
      weight !== null &&
      (!Number.isFinite(weight) || weight < 0)
    ) {
      setError("Please enter a valid weight.");
      setLoading(false);
      return;
    }

    try {
      // ----------------------------------------
      // Get authenticated user
      // ----------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // ----------------------------------------
      // Verify farm belongs to current user
      // ----------------------------------------

      const { data: farm, error: farmError } =
        await supabase
          .from("farms")
          .select("id")
          .eq("id", farmId)
          .eq("owner_id", user.id)
          .single();

      if (farmError || !farm) {
        setError(
          "You do not have permission to use this farm."
        );
        setLoading(false);
        return;
      }

      // ----------------------------------------
      // Create cow
      // ----------------------------------------

      const { error: insertError } =
        await supabase
          .from("cows")
          .insert({
            farm_id: farmId,

            tag_number:
              tagNumber.trim(),

            name:
              name.trim() || null,

            breed:
              breed || null,

            sex:
              sex,

            date_of_birth:
              dateOfBirth || null,

            color:
              color.trim() || null,

            weight_kg:
              weight,

            status:
              status || "Active",

            pregnancy_status:
              pregnancyStatus || null,

            notes:
              notes.trim() || null,

            updated_at:
              new Date().toISOString(),
          });

      if (insertError) {
        console.error(
          "Cow creation error:",
          insertError
        );

        setError(insertError.message);
        setLoading(false);
        return;
      }

      // ----------------------------------------
      // Success
      // ----------------------------------------

      router.push("/dashboard/cows");
      router.refresh();

    } catch (err) {
      console.error(
        "Unexpected cow error:",
        err
      );

      setError(
        "Something went wrong while registering the cow."
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

        {/* FARM */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Farm
          </label>

          <select
            value={farmId}
            onChange={(e) =>
              setFarmId(e.target.value)
            }
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Select farm
            </option>

            {farms.map((farm) => (
              <option
                key={farm.id}
                value={farm.id}
              >
                {farm.farm_name}
              </option>
            ))}
          </select>
        </div>

        {/* TAG NUMBER */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tag number
          </label>

          <input
            type="text"
            required
            value={tagNumber}
            onChange={(e) =>
              setTagNumber(e.target.value)
            }
            placeholder="e.g. ENS-001"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />

          <p className="mt-1 text-xs text-gray-500">
            The identification number attached to the cow.
          </p>
        </div>

        {/* NAME */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Cow name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Daisy"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* BREED */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Breed
          </label>

          <select
            value={breed}
            onChange={(e) =>
              setBreed(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Select breed
            </option>

            <option value="Friesian">
              Friesian
            </option>

            <option value="Ayrshire">
              Ayrshire
            </option>

            <option value="Guernsey">
              Guernsey
            </option>

            <option value="Jersey">
              Jersey
            </option>

            <option value="Brown Swiss">
              Brown Swiss
            </option>

            <option value="Crossbreed">
              Crossbreed
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        {/* SEX */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Sex
          </label>

          <select
            value={sex}
            onChange={(e) =>
              setSex(e.target.value)
            }
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Select sex
            </option>

            <option value="Female">
              Female
            </option>

            <option value="Male">
              Male
            </option>
          </select>
        </div>

        {/* DATE OF BIRTH */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Date of birth
          </label>

          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) =>
              setDateOfBirth(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* COLOR */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Color
          </label>

          <input
            type="text"
            value={color}
            onChange={(e) =>
              setColor(e.target.value)
            }
            placeholder="e.g. Black and white"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* WEIGHT */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Weight (kg)
          </label>

          <input
            type="number"
            min="0"
            step="0.1"
            value={weightKg}
            onChange={(e) =>
              setWeightKg(e.target.value)
            }
            placeholder="e.g. 420"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* STATUS */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="Active">
              Active
            </option>

            <option value="Sick">
              Sick
            </option>

            <option value="Dry">
              Dry
            </option>

            <option value="Sold">
              Sold
            </option>

            <option value="Deceased">
              Deceased
            </option>
          </select>
        </div>

        {/* PREGNANCY */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Pregnancy status
          </label>

          <select
            value={pregnancyStatus}
            onChange={(e) =>
              setPregnancyStatus(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              Not recorded
            </option>

            <option value="Not pregnant">
              Not pregnant
            </option>

            <option value="Pregnant">
              Pregnant
            </option>

            <option value="Unknown">
              Unknown
            </option>
          </select>
        </div>

        {/* NOTES */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            rows={4}
            placeholder="Additional information about this cow..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* BUTTON */}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Registering cow..."
          : "Register Cow"}
      </button>

    </form>
  );
}