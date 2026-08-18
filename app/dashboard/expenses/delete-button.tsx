"use client";

import { useState } from "react";

type DeleteButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  recordId: string;
};

export default function DeleteButton({
  action,
  recordId,
}: DeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      event.preventDefault();
      return;
    }

    setDeleting(true);
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input
        type="hidden"
        name="record_id"
        value={recordId}
      />

      <button
        type="submit"
        disabled={deleting}
        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}