import {Date as GDate} from "gedcomx-js";
require("./gedcomx-extensions")

test("toDateObject works", () => {
  let gDate = new GDate();
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
  console.debug(dateExpected)
  expect(date.getTime())
    .toBe(dateExpected.getTime());
})

test("toString works", () => {
  let date = new GDate();
  expect(date.toString()).toBe("")

  date.setFormal("+2022")
  expect(date.toString("en")).toBe("2022")

  date.setFormal("+2022-01")
  expect(date.toString("en")).toBe("January 2022")

  date.setFormal("+2022-01-25")
  expect(date.toString("en")).toBe("01/25/2022")

  date.setFormal("+2022-01-25T05:22")
  expect(date.toString("en")).toBe("1/25/2022, 5:22:00 AM")
})
