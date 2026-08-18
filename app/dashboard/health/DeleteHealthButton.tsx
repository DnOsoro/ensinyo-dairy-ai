"use client";

import { useFormStatus } from "react-dom";

type DeleteHealthButtonProps = {
  action: (formData: FormData) => void;
  recordId: string;
};

function DeleteButtonContent() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export default function DeleteHealthButton({
  action,
  recordId,
}: DeleteHealthButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Are you sure you want to delete this health record? This action cannot be undone."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="record_id"
        value={recordId}
      />

      <DeleteButtonContent />
    </form>
  );
}
