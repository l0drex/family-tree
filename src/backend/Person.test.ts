import * as GedcomX from "gedcomx-js";
import {Fact, GDate, Person, setReferenceAge} from "./gedcomx-extensions";
import {PersonFactTypes} from "./gedcomx-enums";
import {strings} from "../main";

test("Age calculated correct", () => {
  setReferenceAge(0, 0);
  let person = new Person();
  person.addFact(new Fact()
    .setType(PersonFactTypes.GenerationNumber)
    .setValue(0));
  expect(person.getAgeAt(new Date())).toBe(0);

  setReferenceAge(20, 0, true);
  expect(person.getAgeAt(new Date())).toBe(20);

  setReferenceAge(0, 10, true);
  expect(person.getAgeAt(new Date())).toBe(250);

  setReferenceAge(20, 10, true);
  expect(person.getAgeAt(new Date())).toBe(270);
})

test("living calculated correctly", () => {
  setReferenceAge(20, 10);
  let person = new Person();
  expect(person.isLiving).toBeTruthy();

  person
    .addFact(new Fact()
      .setType(PersonFactTypes.Death)
      .setDate(new GDate()
        .setFormal("+2000")));
  expect(person.getLiving()).toBeFalsy();
})

test("get full name returns the correct name", () => {
  let person = new Person();
  expect(person.fullName).toBe("?");

  person = new Person();
  person.addName(new GedcomX.Name()
    .addNameForm(new GedcomX.NameForm().setFullText("Maximilian Mustermann")))
  expect(person.fullName).toBe("Maximilian Mustermann");


  strings.setLanguage("en");

  person.addName(new GedcomX.Name()
    .addNameForm(new GedcomX.NameForm().setFullText("John Doe")))
    .setLang(strings.getLanguage());
  expect(person.fullName).toBe("John Doe");

  let preferredName = new GedcomX.Name()
    .addNameForm(new GedcomX.NameForm().setFullText("Max Mustermann"))
    .setPreferred(true);
  person.addName(preferredName);
  expect(person.fullName).toBe("Max Mustermann");

  preferredName.addNameForm(new GedcomX.NameForm()
    .setLang("en")
    .setFullText("John Smith"))
  person.setNames([preferredName])
  expect(person.fullName).toBe("John Smith");
})
