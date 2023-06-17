import config from "../config";
import {PersonFactTypes} from "./gedcomx-enums";
import {Fact, GDate} from "./gedcomx-extensions";

test("toString works", () => {
  config.browserLang = "en";
  let fact = new Fact().setType(PersonFactTypes.Birth);
  expect(fact.toString()).toBe("Birth")

  fact.setDate(new GDate().setFormal("+2022-01-25T06:55"))
  expect(fact.toString()).toBe("Birth on 01/25/2022 at 06:55 AM")
})
