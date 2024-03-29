import {GraphFamily} from "../backend/graph";
import * as GedcomX from "gedcomx-js";
import {Fact, FamilyView, GDate, Person, setReferenceAge} from "./gedcomx-js-extensions";
import {ResourceReference} from "gedcomx-js";
import {PersonFactTypes} from "./types";
import {strings} from "../main";
import GedcomXDate from "gedcomx-date";

test("Graph Family", () => {
  let graphFamily = new GraphFamily();
  graphFamily.setParent1(new ResourceReference({resource: "#1"}));
  graphFamily.setParent2(new ResourceReference({resource: "#2"}));
  graphFamily.setChildren([
    new ResourceReference({resource: "#3"}),
    new ResourceReference({resource: "#4"})
  ])
  expect(graphFamily.members).toHaveLength(4);

  let familyView = new FamilyView();
  familyView.setParent1(new ResourceReference({resource: "#1"}));
  familyView.setParent2(new ResourceReference({resource: "#2"}));
  familyView.setChildren([
    new ResourceReference({resource: "#3"}),
    new ResourceReference({resource: "#4"})
  ])
  graphFamily = new GraphFamily(familyView);
  expect(graphFamily.members).toHaveLength(4);

  let gedcomXFamilyView = new GedcomX.FamilyView();
  gedcomXFamilyView.setParent1(new ResourceReference({resource: "#1"}));
  gedcomXFamilyView.setParent2(new ResourceReference({resource: "#2"}));
  gedcomXFamilyView.setChildren([
    new ResourceReference({resource: "#3"}),
    new ResourceReference({resource: "#4"})
  ])
  graphFamily = new GraphFamily(gedcomXFamilyView.toJSON());
  expect(graphFamily.members).toHaveLength(4);
})

test("Family View", () => {
  let fv1 = new FamilyView();
  fv1.setParent1(new ResourceReference().setResource("#1"))
    .setParent2(new ResourceReference().setResource("#2"))
    .setChildren([new ResourceReference().setResource("#3")]);

  let fv2 = new FamilyView();
  fv2.setParent1(new ResourceReference().setResource("#1"))
    .setParent2(new ResourceReference().setResource("#2"))
    .setChildren([new ResourceReference().setResource("#3")]);

  expect(fv1.equals(fv2)).toBeTruthy();
})

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
    .addNameForm(new GedcomX.NameForm().setFullText("John Doe"))
    .setLang(strings.getLanguage()));
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

test("toDateObject works", () => {
  let gDate = new GDate();
  let date = gDate.toDateObject();
  expect(date).toBeUndefined();

  gDate.setFormal("");
  date = gDate.toDateObject();
  expect(date).toBeUndefined();

  gDate.setFormal("+2000");
  date = gDate.toDateObject();
  expect(date).toBeDefined();
  expect(date.valueOf()).toBe(Date.UTC(2000, 0));

  gDate.setFormal("+2022-01-05T22:05:31");
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(2022, 0, 5, 22, 5, 31));

  gDate.setFormal("+1970-01-01")
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(1970,0,1))

  gDate.setFormal("+1600-12-31T23:59:59");
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(1600, 11, 31, 23, 59, 59));

  gDate.setFormal("+1970")
  date = gDate.toDateObject();
  expect(date.getTime()).toBe(0);

  gDate.setFormal("+0000");
  date = gDate.toDateObject();
  expect(date.getTime()).toBe(Date.UTC(0, 0));

  gDate.setFormal("-0006");
  date = gDate.toDateObject();
  expect(date.getTime())
    .toBe(Date.UTC(-6, 0));
})

test("toString works", () => {
  strings.setLanguage("en");

  let date = new GDate();
  expect(date.toString()).toBe("")

  date.setFormal("+2022")
  expect(date.toString()).toBe("2022")

  date.setFormal("+2022-01")
  expect(date.toString()).toBe("January 2022")

  date.setFormal("+2022-01-25")
  expect(date.toString()).toBe("01/25/2022")

  date.setFormal("+2022-01-25T05")
  expect(GedcomXDate(date.formal).toFormalString()).toBe("+2022-01-25T05Z")
  expect(date.toString()).toBe("01/25/2022, 05 AM")

  date.setFormal("+2022-01-25T05:05")
  expect(date.toString()).toBe("01/25/2022, 05:05 AM")

  date.setFormal("+2022-01-25T05:06:06")
  expect(date.toString()).toBe("01/25/2022, 05:06:06 AM")

  date.setFormal("A+2022-01")
  expect(date.toString()).toBe("circa January 2022")

  date.setFormal("+2022/+2025")
  expect(date.toString()).toBe("since 2022 until 2025")

  date.setFormal("A+2022/+2025")
  expect(date.toString()).toBe("circa since 2022 until 2025")

  date.setFormal("+2022/")
  expect(date.toString()).toBe("since 2022")

  date.setFormal("A+2022-01-04/")
  expect(date.toString()).toBe("circa since 01/04/2022")

  date.setFormal("/+2025")
  expect(date.toString()).toBe("until 2025")

  date.setFormal("A/+2025")
  expect(date.toString()).toBe("circa until 2025")

  date.setFormal("+2022/P3Y")
  expect(date.toString()).toBe("since 2022 until 2025")

  date.setFormal("R3/+1972-02/P0Y2M")
  expect(date.toString()).toBe("3 times since February 1972 until August 1972")
})

it("is not extracted", () => {
  let person = new Person();
  expect(person.extracted).toBeFalsy();
  expect(person.isExtracted()).toBeFalsy();

  person.setExtracted(false);
  expect(person.extracted).toBeFalsy();
  expect(person.isExtracted()).toBeFalsy();
})
