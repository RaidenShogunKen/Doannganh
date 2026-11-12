const vietnamDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' });

export function dateInVietnam(date = new Date()) {
  return vietnamDate.format(date);
}

export function addCalendarMonths(date: string, months: number): string {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months + 1, 0);
  result.setUTCDate(Math.min(originalDay, result.getUTCDate()));
  return result.toISOString().slice(0, 10);
}
