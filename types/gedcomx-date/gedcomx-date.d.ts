// noinspection JSUnusedGlobalSymbols

declare module "gedcomx-date" {
  export type DateType = "single" | "range" | "recurring";

  export interface BaseDate {
    getType(): DateType | "duration"
    toFormalString(): string
    isApproximate(): boolean
  }

  function Simple(str?: string): Simple
  export class Simple<IsApproximate extends boolean = false> implements BaseDate {
    getType(): "single"
    isApproximate(): IsApproximate
    getYear(): number
    getMonth(): number | undefined
    getDay(): number | undefined
    getHours(): number | undefined
    getMinutes(): number | undefined
    getSeconds(): number | undefined
    getTZHours(): number | undefined
    getTZMinutes(): number | undefined

    /**
     * @deprecated use toFormalString(simple) instead
     */
    toFormalString(): string
  }

  function Approximate(str: string): Approximate
  export class Approximate extends Simple<true> {
    toFormalString(): string
  }

  function Duration(str: string): Duration
  export class Duration implements BaseDate {
    getType(): "duration"
    isApproximate(): false
    getYears(): number
    getMonths(): number
    getDays(): number
    getHours(): number
    getMinutes(): number
    getSeconds(): number
    toFormalString(): string
  }

  function GedcomXDate<T extends Simple | Approximate | Range | Recurring>(str: string): T

  namespace GedcomXDate {
    export const version: "0.3.2";

    /**
     * Adds a duration to a date, returning the new date.
     */
    export function addDuration(startDate: Simple, duration: Duration): Simple | Approximate

    /**
     * Takes in a start duration and a multiplier,
     * and returns a new Duration.
     * Rounds using Math.round
     */
    export function multiplyDuration(startDuration: Duration, multiplier: number): Duration
    export function getDuration(startDate: Simple, endDate: Simple): Duration
    export function daysInMonth(month: number, year: number): number
    export function now(): Simple
    export function fromJSDate(date: Date): Simple
  }

  export default GedcomXDate;

  function Range(str: string): Range
  export class Range<T extends "range" | "recurring" = "range"> implements BaseDate {
    getType(): T
    isApproximate(): boolean
    getStart(): Simple | undefined
    getDuration(): Duration | undefined
    getEnd(): Simple | undefined
    toFormalString(): string
  }

  function Recurring(str: string): Recurring
  export class Recurring extends Range<"recurring"> {
    getCount(): number
    getNth(multiplier: number): Simple
    toFormalString(): string
  }
}
