export type gedcomxDate = SimpleDate | DateRange | RecurringDate | ApproximateDate | ApproximateDateRange;

/**
 * ±YYYY[-MM[-DD[Thh:[mm[:ss]][±hh[:mm]|Z]]]]
 */
// year is in range -9999 to +9999, 4 digits, left padded with zeros
export type SimpleDate = `${"+" | "-"}${number}${Month | ""}`;
// month is in range 1 to 12
type Month = `-${number}${Day | ""}`;
// starting at 01
type Day = `-${number}${Time | ""}`;
type Time = `T${Hour | ""}${Timezone | ""}`;

// hour between 00 and 23, two digits (24 if minute and second are 0)
type Hour = `${number}${Minute | ""}`;
// minute between 00 and 59, two digits
type Minute = `:${number}${Second | ""}`;
// second between 00 and 59, two digits
type Second = `:${number}`;
type Timezone = `${TimezoneOffset | "Z"}`;
// numbers have two digits
type TimezoneOffset = `${"+" | "-"}${Hour}`;

/**
 * The initial [P] designates the value is a duration. The part including time components MUST be preceded by [T].
 *
 * In the format representations for a duration, a digit is represented by the letter [n]. Letters have specific meaning, are literal, and represent the following units:
 * - [Y] The number of years
 * - [M] The number of months or minutes (determined by context)
 * - [D] The number of days
 * - [H] The number of hours
 * - [S] The number of seconds
 * PnnnnYnnMnnDTnnHnnMnnS (n is a digit)
 */

type YearDuration = `${number}Y` | "";
type MonthDuration = `${number}M` | "";
type DayDuration = `${number}D` | "";
type DateDuration = `${YearDuration}${MonthDuration}${DayDuration}`;

type HourDuration = `${number}H` | "";
type MinuteDuration = `${number}M` | "";
type SecondDuration = `${number}S` | "";
type TimeDuration = `T${HourDuration}${MinuteDuration}${SecondDuration}`;
export type Duration = `P${DateDuration}${TimeDuration | ""}`;

type DateRange = `${ClosedDateRange | OpenEndedDateRange}`;
export type ClosedDateRange = `${SimpleDate}/${SimpleDate}` | `${SimpleDate}/${Duration}`;
export type OpenEndedDateRange = `/${SimpleDate}` | `${SimpleDate}/`;

export type ApproximateDate = `A${SimpleDate}`;
export type ApproximateDateRange = `A${DateRange}`;

export type RecurringDate = `R${number | ""}/${SimpleDate}/${SimpleDate | Duration}`;
