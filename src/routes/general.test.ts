import { formToFormal } from "./general";

test("it can update dates", () => {
  let formData = new FormData();
  formData.set("mode", "single")
  formData.set("start-date", "2020-01-22")
  expect(formToFormal(formData).getFormal()).toBe("+2020-01-22")

  formData.set("approximate", "")
  expect(formToFormal(formData).getFormal()).toBe("A+2020-01-22")

  formData.set("start-time", "08:22")
  expect(formToFormal(formData).getFormal()).toBe("A+2020-01-22T08:22")

  formData.set("start-tz-sign", "+")
  formData.set("start-tz", "02:00")
  expect(formToFormal(formData).getFormal()).toBe("A+2020-01-22T08:22+02:00")

  formData.set("mode", "range")
  expect(formToFormal(formData).getFormal()).toBe("A+2020-01-22T08:22+02:00/")

  formData.set("end-date", "2020-02-13")
  expect(formToFormal(formData).getFormal()).toBe("A+2020-01-22T08:22+02:00/+2020-02-13")

  formData.set("mode", "recurring");
  formData.set("count", "1")
  expect(formToFormal(formData).getFormal()).toBe("R/A+2020-01-22T08:22+02:00/+2020-02-13")

  formData.set("count", "7")
  expect(formToFormal(formData).getFormal()).toBe("R7/A+2020-01-22T08:22+02:00/+2020-02-13")
})
