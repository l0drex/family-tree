import GedcomX from "./gedcomx-extensions";
import config from "../config";

test("toDateObject works", () => {
  let gDate = new GedcomX.Date();
  let date = gDate.toDateObject();
  expect(date).toBeUndefined();

  gDate.setFormal("");
  date = gDate.toDateObject();
  expect(date).toBeUndefined();

  gDate.setFormal("2000");
  date = gDate.toDateObject();
  expect(date).toBeUndefined();

  gDate.setFormal("+2000");
  date = gDate.toDateObject();
  expect(date.getTime()).toBe(Date.UTC(2000, 0));

  gDate.setFormal("+2022-01-05T22:05:31");
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(2022, 0, 5, 22, 5, 31));

  gDate.setFormal("+1970-01-01")
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(1970,0,1))

  gDate.setFormal("+1600-12-31T23:59:59");
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(1600, 11, 31, 23, 59, 59));

  gDate.setFormal("+0000");
  date = gDate.toDateObject();
  let dateExpected = new Date("0000");
  expect(date.getTime())
    .toBe(dateExpected.getTime());

  gDate.setFormal("-0006");
  date = gDate.toDateObject();
  dateExpected = new Date("-6");
  expect(date.getTime())
    .toBe(dateExpected.getTime());
})

test("toString works", () => {
  config.browserLang = "en";

  let date = new GedcomX.Date();
  expect(date.toString()).toBe("")

  date.setFormal("+2022")
  expect(date.toString()).toBe("in 2022")

  date.setFormal("+2022-01")
  expect(date.toString()).toBe("in January 2022")

  date.setFormal("+2022-01-25")
  expect(date.toString()).toBe("on 01/25/2022")

  date.setFormal("+2022-01-25T05")
  expect(date.toString()).toBe("on 01/25/2022 at 05 AM")

  date.setFormal("+2022-01-25T05:05")
  expect(date.toString()).toBe("on 01/25/2022 at 05:05 AM")

  date.setFormal("+2022-01-25T05:06:06")
  expect(date.toString()).toBe("on 01/25/2022 at 05:06:06 AM")
})
