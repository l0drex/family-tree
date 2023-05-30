import GedcomX from "./gedcomx-extensions";
import config from "../config";
import {PersonFactTypes} from "./gedcomx-enums";

test("toString works", () => {
  config.browserLang = "en";
  let fact = new GedcomX.Fact().setType(PersonFactTypes.Birth);
  expect(fact.toString()).toBe("Birth")

  fact.setDate(new GedcomX.Date().setFormal("+2022-01-25T06:55"))
  expect(fact.toString()).toBe("Birth on 01/25/2022 at 06:55 AM")
})
