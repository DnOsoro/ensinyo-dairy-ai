"use client";

type DeleteIncomeButtonProps = {
  formId: string;
};

export default function DeleteIncomeButton({ formId }: DeleteIncomeButtonProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income record?"
    );

    if (confirmed) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.requestSubmit();
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
    >
      Delete
    </button>
  );
}