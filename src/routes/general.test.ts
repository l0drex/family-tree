import { formToFormalDate } from "./general";
import { updateObject } from "./utils";

test("it can update dates", () => {
  let formData = new FormData();
  formData.set("mode", "single")
  formData.set("start-date", "2020-01-22")
  expect(formToFormalDate(formData).getFormal()).toBe("+2020-01-22")

  formData.set("approximate", "")
  expect(formToFormalDate(formData).getFormal()).toBe("A+2020-01-22")

  formData.set("start-time", "08:22")
  expect(formToFormalDate(formData).getFormal()).toBe("A+2020-01-22T08:22")

  formData.set("start-tz-sign", "+")
  formData.set("start-tz", "02:00")
  expect(formToFormalDate(formData).getFormal()).toBe("A+2020-01-22T08:22+02:00")

  formData.set("mode", "range")
  expect(formToFormalDate(formData).getFormal()).toBe("A+2020-01-22T08:22+02:00/")

  formData.set("end-date", "2020-02-13")
  expect(formToFormalDate(formData).getFormal()).toBe("A+2020-01-22T08:22+02:00/+2020-02-13")

  formData.set("mode", "recurring");
  formData.set("count", "1")
  expect(formToFormalDate(formData).getFormal()).toBe("R/A+2020-01-22T08:22+02:00/+2020-02-13")

  formData.set("count", "7")
  expect(formToFormalDate(formData).getFormal()).toBe("R7/A+2020-01-22T08:22+02:00/+2020-02-13")
})

test("Constructing functional dict works", () => {
  let formData = new FormData();
  let received = updateObject(formData);

  received["testxyz"] = "xyz";
  console.assert(received.get("testxyz") === "xyz", "get not working");
  console.assert(received.has("testxyz") === true, "has not working");
})
