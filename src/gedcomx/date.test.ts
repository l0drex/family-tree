import {
  ApproximateDateString,
  ApproximateDateRangeString,
  ClosedDateRangeString,
  DurationString,
  OpenEndedDateRangeString,
  RecurringDateString,
  SimpleDateString
} from "./date";
import GedcomXDate, {Approximate, Duration, Range, Recurring, Simple} from "gedcomx-date";

it("allows all example simple dates", () => {
  let year: SimpleDateString = "-1321"
  let parsed = GedcomXDate<Simple>(year);
  expect(parsed.getYear()).toBe(-1321);

  let month: SimpleDateString = "+0186-03"
  parsed = GedcomXDate<Simple>(month);
  expect(parsed.getYear()).toBe(186);
  expect(parsed.getMonth()).toBe(3);

  let day: SimpleDateString = "+1492-07-27"
  parsed = GedcomXDate<Simple>(day);
  expect(parsed.getYear()).toBe(1492);
  expect(parsed.getMonth()).toBe(7);
  expect(parsed.getDay()).toBe(27);

  let time: SimpleDateString = "+1889-05-17T14:23"
  parsed = GedcomXDate<Simple>(time);
  expect(parsed.getYear()).toBe(1889);
  expect(parsed.getMonth()).toBe(5);
  expect(parsed.getDay()).toBe(17);
  expect(parsed.getHours()).toBe(14);
  expect(parsed.getMinutes()).toBe(23);

  let timezone: SimpleDateString = "+1964-11-14T10-07:00"
  parsed = GedcomXDate<Simple>(timezone);
  expect(parsed.getYear()).toBe(1964);
  expect(parsed.getMonth()).toBe(11);
  expect(parsed.getDay()).toBe(14);
  expect(parsed.getHours()).toBe(10);
  expect(parsed.getTZHours()).toBe(-7);
  expect(parsed.getTZMinutes()).toBe(0);

  let timezoneZ: SimpleDateString = "+1752-01-18T22:14:03Z"
  parsed = GedcomXDate<Simple>(timezoneZ);
  expect(parsed.getYear()).toBe(1752);
  expect(parsed.getMonth()).toBe(1);
  expect(parsed.getDay()).toBe(18);
  expect(parsed.getHours()).toBe(22);
  expect(parsed.getMinutes()).toBe(14);
  expect(parsed.getSeconds()).toBe(3);
  expect(parsed.getTZHours()).toBe(0);
  expect(parsed.getTZMinutes()).toBe(0);
});

it("allows all example durations", () => {
  function Duration(duration: string) {
    return GedcomXDate<Range>(`+1492/${duration}`).getDuration();
  }

  let years: DurationString = "P17Y6M2D";
  let parsed = Duration(years);
  expect(parsed.getYears()).toBe(17);
  expect(parsed.getMonths()).toBe(6);
  expect(parsed.getDays()).toBe(2);

  let days: DurationString = "P186D";
  parsed = Duration(days);
  expect(parsed.getDays()).toBe(186);

  let lapsedTime: DurationString = "PT5H17M";
  parsed = Duration(lapsedTime);
  expect(parsed.getHours()).toBe(5);
  expect(parsed.getMinutes()).toBe(17);

  let complex: DurationString = "P1000Y18M72DT56H10M1S";
  parsed = Duration(complex);
  expect(parsed.getYears()).toBe(1000);
  expect(parsed.getMonths()).toBe(18);
  expect(parsed.getDays()).toBe(72);
  expect(parsed.getHours()).toBe(56);
  expect(parsed.getMinutes()).toBe(10);
  expect(parsed.getSeconds()).toBe(1);
});

it("allows all example closed date ranges", () => {
  let years: ClosedDateRangeString = "+1752/+1823"
  let parsed = GedcomXDate<Range>(years);
  expect(parsed.getStart().getYear()).toBe(1752);
  expect(parsed.getEnd().getYear()).toBe(1823);

  let months: ClosedDateRangeString = "+1825-04-13/+1825-11-26";
  parsed = GedcomXDate<Range>(months);
  expect(parsed.getStart().getYear()).toBe(1825);
  expect(parsed.getStart().getMonth()).toBe(4);
  expect(parsed.getStart().getDay()).toBe(13);
  expect(parsed.getEnd().getYear()).toBe(1825);
  expect(parsed.getEnd().getMonth()).toBe(11);
  expect(parsed.getEnd().getDay()).toBe(26);

  let duration: ClosedDateRangeString = "+1933-02-19/P74Y";
  parsed = GedcomXDate<Range>(duration);
  expect(parsed.getStart().getYear()).toBe(1933);
  expect(parsed.getStart().getMonth()).toBe(2);
  expect(parsed.getStart().getDay()).toBe(19);
  expect(parsed.getDuration().getYears()).toBe(74);
})

it("allows all example open-ended date ranges", () => {
  let startYear: OpenEndedDateRangeString = "/+0000";
  let parsed = GedcomXDate<Range>(startYear);
  expect(parsed.getEnd().getYear()).toBe(0);

  let endYear: OpenEndedDateRangeString = "/-1287";
  parsed = GedcomXDate<Range>(endYear);
  expect(parsed.getEnd().getYear()).toBe(-1287);

  let startMonth = "-0001-04/";
  parsed = GedcomXDate<Range>(startMonth);
  expect(parsed.getStart().getYear()).toBe(-1);
  expect(parsed.getStart().getMonth()).toBe(4);

  let endMonth: OpenEndedDateRangeString = "/+1887-03";
  parsed = GedcomXDate<Range>(endMonth);
  expect(parsed.getEnd().getYear()).toBe(1887);
  expect(parsed.getEnd().getMonth()).toBe(3);

  let startDay: OpenEndedDateRangeString = "+1976-07-11/";
  parsed = GedcomXDate<Range>(startDay);
  expect(parsed.getStart().getYear()).toBe(1976);
  expect(parsed.getStart().getMonth()).toBe(7);
  expect(parsed.getStart().getDay()).toBe(11);
})

it("allows all example approximate dates", () => {
  let year: ApproximateDateString = "A+1680";
  let parsed = GedcomXDate<Approximate>(year);
  expect(parsed.getYear()).toBe(1680);
  expect(parsed.isApproximate()).toBe(true);

  let yearNeg: ApproximateDateString = "A-1400";
  parsed = GedcomXDate<Approximate>(yearNeg);
  expect(parsed.getYear()).toBe(-1400);
  expect(parsed.isApproximate()).toBe(true);

  let days: ApproximateDateString = "A+2014-08-19";
  parsed = GedcomXDate<Approximate>(days);
  expect(parsed.getYear()).toBe(2014);
  expect(parsed.getMonth()).toBe(8);
  expect(parsed.getDay()).toBe(19);
  expect(parsed.isApproximate()).toBe(true);

  let minutes: ApproximateDateString = "A+1980-05-18T18:53Z";
  parsed = GedcomXDate<Approximate>(minutes);
  expect(parsed.getYear()).toBe(1980);
  expect(parsed.getMonth()).toBe(5);
  expect(parsed.getDay()).toBe(18);
  expect(parsed.getHours()).toBe(18);
  expect(parsed.getMinutes()).toBe(53);
  expect(parsed.getTZHours()).toBe(0);
  expect(parsed.getTZMinutes()).toBe(0);
  expect(parsed.isApproximate()).toBe(true);
})

it("allows all example approximate date ranges", () => {
  let range1: ApproximateDateRangeString = "A+1752/+1823"
  let parsed = GedcomXDate<Range>(range1);
  expect(parsed.getStart().getYear()).toBe(1752);
  expect(parsed.getEnd().getYear()).toBe(1823);
  expect(parsed.isApproximate()).toBe(true)

  let range2: ApproximateDateRangeString = "A+1825-04-13/+1825-11-26"
  parsed = GedcomXDate<Range>(range2);
  expect(parsed.getStart().getYear()).toBe(1825);
  expect(parsed.getStart().getMonth()).toBe(4);
  expect(parsed.getStart().getDay()).toBe(13);
  expect(parsed.getEnd().getYear()).toBe(1825);
  expect(parsed.getEnd().getMonth()).toBe(11);
  expect(parsed.getEnd().getDay()).toBe(26);
  expect(parsed.isApproximate()).toBe(true)

  let range3: ApproximateDateRangeString = "A+1633-02-19/P74Y"
  parsed = GedcomXDate<Range>(range3);
  expect(parsed.getStart().getYear()).toBe(1633);
  expect(parsed.getStart().getMonth()).toBe(2);
  expect(parsed.getStart().getDay()).toBe(19);
  expect(parsed.getDuration().getYears()).toBe(74);
  expect(parsed.isApproximate()).toBe(true)

  let range4: ApproximateDateRangeString = "A/+1887-03"
  parsed = GedcomXDate<Range>(range4);
  expect(parsed.getEnd().getYear()).toBe(1887);
  expect(parsed.getEnd().getMonth()).toBe(3);
  expect(parsed.isApproximate()).toBe(true)

  let range5: ApproximateDateRangeString = "A+1976-07-11/"
  parsed = GedcomXDate<Range>(range5);
  expect(parsed.getStart().getYear()).toBe(1976);
  expect(parsed.getStart().getMonth()).toBe(7);
  expect(parsed.getStart().getDay()).toBe(11);
  expect(parsed.isApproximate()).toBe(true)

  let range6: ApproximateDateRangeString = "A/-1287"
  parsed = GedcomXDate<Range>(range6);
  expect(parsed.getEnd().getYear()).toBe(-1287);
  expect(parsed.isApproximate()).toBe(true)

  let range7: ApproximateDateRangeString = "A/+0000"
  parsed = GedcomXDate<Range>(range7);
  expect(parsed.getEnd().getYear()).toBe(0);
  expect(parsed.isApproximate()).toBe(true)

  let range8: ApproximateDateRangeString = "A-0001-04/"
  parsed = GedcomXDate<Range>(range8);
  expect(parsed.getStart().getYear()).toBe(-1);
  expect(parsed.getStart().getMonth()).toBe(4);
  expect(parsed.isApproximate()).toBe(true)
})

it("allows all example recurring dates", () => {
  let weeks: RecurringDateString = "R4/+1776-04-02/+1776-04-09";
  let parsed = GedcomXDate<Recurring>(weeks);
  expect(parsed.getCount()).toBe(4);
  expect(parsed.getStart().getYear()).toBe(1776);
  expect(parsed.getStart().getMonth()).toBe(4);
  expect(parsed.getStart().getDay()).toBe(2);
  expect(parsed.getEnd().getYear()).toBe(1776);
  expect(parsed.getEnd().getMonth()).toBe(4);
  expect(parsed.getEnd().getDay()).toBe(30);

  let dragonYear: RecurringDateString = "R/+2000/P12Y";
  parsed = GedcomXDate<Recurring>(dragonYear);
  expect(parsed.getCount()).toBe(Infinity);
  expect(parsed.getStart().getYear()).toBe(2000);
  expect(parsed.getDuration().getYears()).toBe(12);

  let usCensus: RecurringDateString = "R100/+1830/+1840"
  parsed = GedcomXDate<Recurring>(usCensus);
  expect(parsed.getCount()).toBe(100);
  expect(parsed.getStart().getYear()).toBe(1830);
  expect(parsed.getEnd().getYear()).toBe(2830);
})
