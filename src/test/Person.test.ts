import * as GedcomX from "gedcomx-js";
import {Fact, Person} from "gedcomx-js"
import {PersonFactTypes, setReferenceAge} from "../backend/gedcomx-extensions";

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

test("isDead calculated correctly", () => {
  setReferenceAge(20, 10);
  let person = new Person()
    .addFact(new Fact()
      .setType(PersonFactTypes.Generation)
      .setValue(0));
  expect(person.isDead()).toBeTruthy();

  person = new Person()
    .addFact(new Fact()
      .setType(PersonFactTypes.Birth)
      .setDate(new GedcomX.Date()
        .setFormal("+1900")));
  expect(person.isDead()).toBeTruthy();

  person = new Person()
    .addFact(new Fact()
      .setType(PersonFactTypes.Death)
      .setDate(new GedcomX.Date()
        .setFormal("+2000")));
  expect(person.isDead()).toBeTruthy();
})
