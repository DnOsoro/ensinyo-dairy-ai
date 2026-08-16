export type DateWindow = {
  start: string;
  end: string;
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCurrentWindow(
  days: number
): DateWindow {
  const end = new Date();

  const start = new Date(end);

  start.setDate(
    start.getDate() - (days - 1)
  );

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export function getPreviousWindow(
  days: number
): DateWindow {
  const currentEnd = new Date();

  const previousEnd =
    new Date(currentEnd);

  previousEnd.setDate(
    previousEnd.getDate() - days
  );

  const previousStart =
    new Date(previousEnd);

  previousStart.setDate(
    previousStart.getDate() - (days - 1)
  );

  return {
    start: formatDate(previousStart),
    end: formatDate(previousEnd),
  };
}

export function getComparisonWindows(
  days: number
) {
  return {
    current: getCurrentWindow(days),
    previous: getPreviousWindow(days),
  };
}