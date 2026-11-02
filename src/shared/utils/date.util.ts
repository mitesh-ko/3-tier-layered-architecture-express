import {
  differenceInDays,
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  lastDayOfMonth,
  endOfMonth,
  startOfMonth,
  startOfDay,
  endOfDay,
  nextSunday,
  nextMonday,
  nextFriday,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  addMonths,
  addYears,
  subDays,
  subHours,
  subMinutes,
  subSeconds,
  subMonths,
  subYears,
  isPast,
  isFuture,
  isBefore,
  isAfter,
  isEqual,
  isValid,
  getUnixTime,
  fromUnixTime,
  getTime,
  format,
  formatDistanceToNow,
  formatISO,
} from 'date-fns';

// Re-export core date-fns functions for convenient, standardized access across the app
export {
  differenceInDays,
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  lastDayOfMonth,
  endOfMonth,
  startOfMonth,
  startOfDay,
  endOfDay,
  nextSunday,
  nextMonday,
  nextFriday,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  addMonths,
  addYears,
  subDays,
  subHours,
  subMinutes,
  subSeconds,
  subMonths,
  subYears,
  isPast,
  isFuture,
  isBefore,
  isAfter,
  isEqual,
  isValid,
  getUnixTime,
  fromUnixTime,
  getTime,
  format,
  formatDistanceToNow,
  formatISO,
};

/**
 * Date & Time Utility powered by date-fns
 * Standardizes UTC formatting, calendar calculations, safe addition/subtraction, and comparisons.
 */
export class DateUtil {
  /**
   * Get current UTC Date instance
   */
  public static nowUTC(): Date {
    return new Date();
  }

  /**
   * Format any date into standard ISO 8601 UTC string (e.g. 2026-10-25T02:15:00.000Z)
   */
  public static toUTCISOString(date: Date | string | number = new Date()): string {
    const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
    if (!isValid(d)) {
      throw new Error(`Invalid date provided to toUTCISOString: ${String(date)}`);
    }
    return d.toISOString();
  }

  /**
   * Add hours to a date using date-fns
   */
  public static addHours(date: Date | number, hours: number): Date {
    return addHours(date, hours);
  }

  /**
   * Add days to a date using date-fns
   */
  public static addDays(date: Date | number, days: number): Date {
    return addDays(date, days);
  }

  /**
   * Add minutes to a date using date-fns
   */
  public static addMinutes(date: Date | number, minutes: number): Date {
    return addMinutes(date, minutes);
  }

  /**
   * Subtract hours from a date using date-fns
   */
  public static subHours(date: Date | number, hours: number): Date {
    return subHours(date, hours);
  }

  /**
   * Subtract days from a date using date-fns
   */
  public static subDays(date: Date | number, days: number): Date {
    return subDays(date, days);
  }

  /**
   * Check if date is before another date using date-fns
   */
  public static isBefore(date: Date | number, dateToCompare: Date | number): boolean {
    return isBefore(date, dateToCompare);
  }

  /**
   * Check if date is after another date using date-fns
   */
  public static isAfter(date: Date | number, dateToCompare: Date | number): boolean {
    return isAfter(date, dateToCompare);
  }

  /**
   * Calculate how many calendar days are left until a target date
   * Returns negative number if the date has already passed.
   */
  public static daysLeft(targetDate: Date | string | number, fromDate: Date = new Date()): number {
    const target = typeof targetDate === 'object' && targetDate instanceof Date ? targetDate : new Date(targetDate);
    return differenceInCalendarDays(target, fromDate);
  }

  /**
   * Get the last day of the month for a given date (defaults to current month)
   */
  public static lastDateOfMonth(date: Date = new Date()): Date {
    return lastDayOfMonth(date);
  }

  /**
   * Get the exact end of the month (YYYY-MM-DD 23:59:59.999)
   */
  public static endOfCurrentMonth(date: Date = new Date()): Date {
    return endOfMonth(date);
  }

  /**
   * Get the Date of the upcoming Sunday
   */
  public static dateOnNextSunday(date: Date = new Date()): Date {
    return nextSunday(date);
  }

  /**
   * Format date with custom format string (e.g. 'yyyy-MM-dd HH:mm:ss')
   */
  public static format(date: Date | number, formatStr: string): string {
    return format(date, formatStr);
  }

  /**
   * Human-readable relative time (e.g. "about 2 hours ago", "in 3 days")
   */
  public static timeAgo(date: Date | number): string {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  /**
   * Check if date is in the past
   */
  public static isPast(date: Date | string | number): boolean {
    const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
    return isPast(d);
  }

  /**
   * Check if date is in the future
   */
  public static isFuture(date: Date | string | number): boolean {
    const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
    return isFuture(d);
  }

  /**
   * Convert date to Unix epoch seconds using date-fns getUnixTime
   */
  public static toUnixSeconds(date: Date | string | number = new Date()): number {
    const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
    return getUnixTime(d);
  }

  /**
   * Convert Unix epoch seconds to Date instance using date-fns fromUnixTime
   */
  public static fromUnixSeconds(seconds: number): Date {
    return fromUnixTime(seconds);
  }

  /**
   * Milliseconds timestamp using date-fns getTime
   */
  public static toTimestamp(date: Date | string | number = new Date()): number {
    const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
    return getTime(d);
  }
}
