import {
  ApproximateDate,
  ApproximateDateRange,
  ClosedDateRange,
  Duration,
  OpenEndedDateRange,
  RecurringDate,
  SimpleDate
} from "./date";

it("allows all example simple dates", () => {
  let year: SimpleDate = "-1321"
  let month: SimpleDate = "+0186-03"
  let day: SimpleDate = "+1492-07-27"
  let time: SimpleDate = "+1889-05-17T14:23"
  let timezone: SimpleDate = "+1964-11-14T10-07:00"
  let timezoneZ: SimpleDate = "+1752-01-18T22:14:03Z"
});

it("allows all example durations", () => {
  let years: Duration = "P17Y6M2D";
  let days: Duration = "P186D";
  let lapsedTime: Duration = "PT5H17M";
  let complex: Duration = "P1000Y18M72DT56H10M1S";
});

it("allows all example closed date ranges", () => {
  let years: ClosedDateRange = "+1752/+1823"
  let months: ClosedDateRange = "+1825-04-13/+1825-11-26"
  let duration: ClosedDateRange = "+1933-02-19/P74Y";
})

it("allows all example open-ended date ranges", () => {
  let startYear: OpenEndedDateRange = "/+0000";
  let endYear: OpenEndedDateRange = "/-1287";
  let startMonth = "-0001-04/";
  let endMonth: OpenEndedDateRange = "/+1887-03";
  let startDay: OpenEndedDateRange = "+1976-07-11/";
})

it("allows all example approximate dates", () => {
  let year: ApproximateDate = "A+1680";
  let yearNeg: ApproximateDate = "A-1400";
  let days: ApproximateDate = "A+2014-08-19";
  let minutes: ApproximateDate = "A+1980-05-18T18:53Z";
})

it("allows all example approximate date ranges", () => {
  let range1: ApproximateDateRange = "A+1752/+1823"
  let range2: ApproximateDateRange = "A+1825-04-13/+1825-11-26"
  let range3: ApproximateDateRange = "A+1633-02-19/P74Y"
  let range4: ApproximateDateRange = "A/+1887-03"
  let range5: ApproximateDateRange = "A+1976-07-11/"
  let range6: ApproximateDateRange = "A/-1287"
  let range7: ApproximateDateRange = "A/+0000"
  let range8: ApproximateDateRange = "A-0001-04/"
})

it("allows all example recurring dates", () => {
  let weeks: RecurringDate = "R4/+1776-04-02/+1776-04-09";
  let dragonYear: RecurringDate = "R/+2000/P12Y";
  let usCensus: RecurringDate = "R100/+1830/+1840"
})
