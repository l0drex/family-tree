import {Date, Fact} from "gedcomx-js";
import {PersonFactTypes} from "./gedcomx-extensions";

test("toString works", () => {
  let fact = new Fact().setType(PersonFactTypes.Birth);
  expect(fact.toString()).toBe("born")

  fact.setDate(new Date().setFormal("+2022"))
  expect(fact.toString()).toBe("born in 2022")

  fact.setDate(new Date().setFormal("+2022-05"))
  expect(fact.toString("en")).toBe("born in May 2022")

  fact.setDate(new Date().setFormal("+2022-01-25"))
  expect(fact.toString()).toBe("born on 25.01.2022")
})
