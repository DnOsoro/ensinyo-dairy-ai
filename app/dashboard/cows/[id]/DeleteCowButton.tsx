"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeleteCowButtonProps = {
  cowId: string;
  cowName: string;
};

export default function DeleteCowButton({
  cowId,
  cowName,
}: DeleteCowButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

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
      // Verify cow belongs to user's farm
      // ----------------------------------------

      const { data: cow, error: cowError } =
        await supabase
          .from("cows")
          .select(`
            id,
            farms!inner (
              id,
              owner_id
            )
          `)
          .eq("id", cowId)
          .eq("farms.owner_id", user.id)
          .single();

      if (cowError || !cow) {
        console.error(
          "Cow ownership validation error:",
          cowError
        );

        setError(
          "The cow could not be found or you do not have permission to delete it."
        );

        setLoading(false);
        return;
      }

      // ----------------------------------------
      // Delete cow
      // ----------------------------------------

      const { error: deleteError } = await supabase
        .from("cows")
        .delete()
        .eq("id", cow.id);

      if (deleteError) {
        console.error(
          "Cow deletion error:",
          deleteError
        );

        setError(
          "We couldn't delete this cow. Please try again."
        );

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
        "Unexpected cow deletion error:",
        err
      );

      setError(
        "Something went wrong while deleting this cow."
      );

      setLoading(false);
    }
  }

  if (!showConfirmation) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50"
      >
        Delete Cow
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div>
        <h3 className="font-semibold text-red-900">
          Delete {cowName || "this cow"}?
        </h3>

        <p className="mt-2 text-sm leading-6 text-red-800">
          This action is permanent. Deleting this cow will
          also delete its associated health, milk and
          breeding records.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setShowConfirmation(false);
            setError("");
          }}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Yes, Delete Cow"}
        </button>
      </div>
    </div>
  );
}