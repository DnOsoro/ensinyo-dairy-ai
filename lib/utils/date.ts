export function getTodayDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());
}

export function isFutureDate(date: string): boolean {
  if (!date) {
    return false;
  }

  return date > getTodayDate();
}