import GedcomX, {setReferenceAge} from "./gedcomx-extensions";
import config from "../config";
import {PersonFactTypes} from "./gedcomx-enums";

test("Age calculated correct", () => {
  setReferenceAge(0, 0);
  let person = new GedcomX.Person()
    .addFact(new GedcomX.Fact()
      .setType(PersonFactTypes.Generation)
      .setValue(0));
  expect(person.getAgeToday()).toBe(0);

  setReferenceAge(20, 0, true);
  expect(person.getAgeToday()).toBe(20);

  setReferenceAge(0, 10, true);
  expect(person.getAgeToday()).toBe(250);

  setReferenceAge(20, 10, true);
  expect(person.getAgeToday()).toBe(270);
})

test("living calculated correctly", () => {
  setReferenceAge(20, 10);
  let person = new GedcomX.Person();
  expect(person.getLiving()).toBeTruthy();

  person = new GedcomX.Person()
    .addFact(new GedcomX.Fact()
      .setType(PersonFactTypes.Death)
      .setDate(new GedcomX.Date()
        .setFormal("+2000")));
  expect(person.getLiving()).toBeFalsy();
})

test("get full name returns the correct name", () => {
  let person = new GedcomX.Person();
  expect(person.getFullName()).toBe("?");

  person.addName(new GedcomX.Name()
    .addNameForm(new GedcomX.NameForm().setFullText("Maximilian Mustermann")))
  expect(person.getFullName()).toBe("Maximilian Mustermann");

  config.browserLang = "en";
  person.addName(new GedcomX.Name()
    .setLang("en")
    .addNameForm(new GedcomX.NameForm().setFullText("John Doe")));
  expect(person.getFullName()).toBe("John Doe");

  let preferredName = new GedcomX.Name()
    .addNameForm(new GedcomX.NameForm().setFullText("Max Mustermann"))
    .setPreferred(true);
  person.addName(preferredName);
  expect(person.getFullName()).toBe("Max Mustermann");

  preferredName.addNameForm(new GedcomX.NameForm()
    .setLang("en")
    .setFullText("John Smith"))
  person.setNames([preferredName])
  expect(person.getFullName()).toBe("John Smith");
})
