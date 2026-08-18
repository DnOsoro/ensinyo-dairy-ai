"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type DeleteFeedButtonProps = {
  recordId: string;
};

export default function DeleteFeedButton({
  recordId,
}: DeleteFeedButtonProps) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (loading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this feed record? This action cannot be undone."
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to delete this record.");
      setLoading(false);
      return;
    }

    /*
     * Only delete a feed record belonging to a farm
     * owned by the current user.
     */
    const { data: record, error: recordError } =
      await supabase
        .from("feed_records")
        .select(
          `
            id,
            farms!inner (
              owner_id
            )
          `
        )
        .eq("id", recordId)
        .eq("farms.owner_id", user.id)
        .maybeSingle();

    if (recordError || !record) {
      console.error(
        "Feed record ownership verification error:",
        recordError
      );

      setError(
        "You do not have permission to delete this feed record."
      );
      setLoading(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("feed_records")
      .delete()
      .eq("id", recordId);

    if (deleteError) {
      console.error(
        "Feed record deletion error:",
        deleteError
      );

      setError(
        "We could not delete this feed record. Please try again."
      );
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}