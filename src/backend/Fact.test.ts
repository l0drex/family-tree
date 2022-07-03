import {Date, Fact} from "gedcomx-js";
import {PersonFactTypes} from "./gedcomx-extensions";
import config from "../config";

test("toString works", () => {
  config.browserLang = "en";
  let fact = new Fact().setType(PersonFactTypes.Birth);
  expect(fact.toString()).toBe("born")

  fact.setDate(new Date().setFormal("+2022-01-25T06:55"))
  expect(fact.toString()).toBe("born on 01/25/2022 at 07:55 AM")
})
