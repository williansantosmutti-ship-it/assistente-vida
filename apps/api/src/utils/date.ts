export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function parseMonthParam(month?: string) {
  if (!month) {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  }

  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  }

  const start = new Date(year, monthIndex - 1, 1);
  return { from: startOfMonth(start), to: endOfMonth(start) };
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second)
  };
}

function offsetMs(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

export function zonedTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  utc = new Date(utc.getTime() - offsetMs(utc, timeZone));
  return new Date(utc.getTime() - offsetMs(utc, timeZone));
}

export function timeInZone(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function dateKeyInZone(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function todayRangeInZone(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const from = zonedTimeToUtc(timeZone, parts.year, parts.month, parts.day, 0, 0, 0);
  const to = zonedTimeToUtc(timeZone, parts.year, parts.month, parts.day, 23, 59, 59);
  return { from, to };
}
