import * as GedcomX from "gedcomx-js";
import {Fact, Person, Name, NameForm} from "gedcomx-js"
import {PersonFactTypes, setReferenceAge} from "./gedcomx-extensions";

test("Age calculated correct", () => {
  setReferenceAge(0, 0);
  let person = new Person()
    .addFact(new Fact()
      .setType(PersonFactTypes.Generation)
      .setValue(0));
  expect(person.getAgeToday()).toBe(0);

  setReferenceAge(20, 0);
  expect(person.getAgeToday()).toBe(20);

  setReferenceAge(0, 10);
  expect(person.getAgeToday()).toBe(250);

  setReferenceAge(20, 10);
  expect(person.getAgeToday()).toBe(270);
})

test("living calculated correctly", () => {
  setReferenceAge(20, 10);
  let person = new Person();
  expect(person.getLiving()).toBeTruthy();

  person.addFact(new Fact()
      .setType(PersonFactTypes.Generation)
      .setValue(0));
  expect(person.getLiving()).toBeFalsy();

  person = new Person()
    .addFact(new Fact()
      .setType(PersonFactTypes.Birth)
      .setDate(new GedcomX.Date()
        .setFormal("+1900")));
  expect(person.getLiving()).toBeFalsy();

  person = new Person()
    .addFact(new Fact()
      .setType(PersonFactTypes.Death)
      .setDate(new GedcomX.Date()
        .setFormal("+2000")));
  expect(person.getLiving()).toBeFalsy();
})

test("get full name returns a name", () => {
  let person = new Person();
  expect(person.getFullName()).toBe("?");

  person.addName(new Name()
    .addNameForm(new NameForm().setFullText("Maximilian Mustermann")))
  expect(person.getFullName()).toBe("Maximilian Mustermann");

  person.addName(new Name()
    .addNameForm(new NameForm().setFullText("Max Mustermann"))
    .setPreferred(true));
  expect(person.getFullName()).toBe("Max Mustermann");
})
