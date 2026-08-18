"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MilkActions({
  recordId,
}: {
  recordId: string;
}) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this milk record? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("milk_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error(
        "Milk record deletion error:",
        error
      );

      window.alert(
        "We could not delete this milk record. Please try again."
      );

      setDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">

      <a
        href={`/dashboard/milk/${recordId}/edit`}
        onClick={(event) => event.stopPropagation()}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Edit
      </a>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

    </div>
  );
}