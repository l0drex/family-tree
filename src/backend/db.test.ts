import * as data from "./test-data.json";
import "fake-indexeddb/auto";
import {db} from "./db";
import * as GedcomX from "gedcomx-js";
import {FamilyView} from "./gedcomx-extensions";
import {unique} from "../main";

db.load(data);

test("loads data", async () => {
  await expect(db.persons.count()).resolves.toBe(16 + 1);  // persons + unknown persons
  await expect(db.relationships.count()).resolves.toBe(26);
  await expect(db.couples.count()).resolves.toBe(6);
  await expect(db.parentChilds.count()).resolves.toBe(20);
});

test("finds person", async () => {
  await expect(db.persons.where("id").equals("1").first()).resolves.toBeInstanceOf(GedcomX.Person);
  await expect(db.persons.where("id").equals("13").first()).resolves.toBeInstanceOf(GedcomX.Person);
})

test("finds children", async () => {
  await expect(db.getChildrenOf("7")).resolves.toHaveLength(0);
  await expect(db.getChildrenOf("13")).resolves.toHaveLength(2);
  await expect(db.getChildrenOf("3")).resolves.toHaveLength(3);

  await expect(db.getChildrenOf("#3")).resolves.toHaveLength(3);
  await expect(db.getChildrenOf(new GedcomX.ResourceReference().setResource("#3"))).resolves.toHaveLength(3);
  await expect(db.getChildrenOf({resource: "#3"} as GedcomX.ResourceReference)).resolves.toHaveLength(3);
})

test("finds couples children", async () => {
  let children = await db.getChildrenOfBoth("1", "13");
  expect(children).toHaveLength(2);
  let childIds = children.map(c => c.resource.substring(1));
  expect(childIds).toContain("6")
  expect(childIds).toContain("7")

  children = await db.getChildrenOfBoth("14", "3");
  expect(children).toHaveLength(3);

  children = await db.getChildrenOfBoth("3", "14");
  expect(children).toHaveLength(3);

  children = await db.getChildrenOfBoth("3", "2");
  expect(children).toHaveLength(0);

  let resource1 = new GedcomX.ResourceReference().setResource("#14");
  let resource2 = new GedcomX.ResourceReference().setResource("#3");
  children = await db.getChildrenOfBoth(resource1, resource2);
  expect(children).toHaveLength(3);

  children = await db.getChildrenOfBoth(resource2, resource1);
  expect(children).toHaveLength(3);

  let resourceO1 = {resource: "#14"} as GedcomX.ResourceReference;
  let resourceO2 = {resource: "#3"} as GedcomX.ResourceReference;
  children = await db.getChildrenOfBoth(resourceO1, resourceO2);
  expect(children).toHaveLength(3);
})

test("finds parents", async () => {
  await expect(db.getParentsOf("13")).resolves.toHaveLength(0);
  await expect(db.getParentsOf("2")).resolves.toHaveLength(0);
  await expect(db.getParentsOf("6")).resolves.toHaveLength(2);
  await expect(db.getParentsOf("11")).resolves.toHaveLength(2);
})

test("finds families as child", async () => {
  let person = await db.personWithId("5");

  let families = await db.getFamiliesAsChild(person);
  expect(families).toHaveLength(1);

  let family = families[0];
  expect(family.parent1.resource).toBe("#14");
  expect(family.parent2.resource).toBe("#3");
  expect(family.children).toHaveLength(3);

  person = await db.personWithId("1");
  families = await db.getFamiliesAsChild(person);
  expect(families).toHaveLength(1);
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));

  person = await db.personWithId("15");
  families = await db.getFamiliesAsChild(person);
  expect(families).toHaveLength(0);
})

test("finds families as parent", async () => {
  let person = await db.personWithId("3");
  await expect(db.getFamiliesAsParent(person)).resolves.toHaveLength(2);

  person = await db.personWithId("1");
  let families = await db.getFamiliesAsParent(person);
  expect(families).toHaveLength(1);
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));

  person = await db.personWithId("7");
  families = await db.getFamiliesAsParent(person);
  expect(families).toHaveLength(0);
})

test("returned families are equal", async () => {
  let parent = await db.personWithId("1");
  let parentFamilies = db.getFamiliesAsParent(parent);

  let child = await db.personWithId("6");
  let childFamilies = db.getFamiliesAsChild(child);

  let fs = await Promise.all([parentFamilies, childFamilies]);
  let families = fs.flat(1)
    .map(f => new FamilyView(f.toJSON()));

  expect(unique(families)).toHaveLength(1);
})

test("finds ancestors", async () => {
  let ancestors = await db.getAncestors("1");
  expect(ancestors).toHaveLength(7);

  ancestors = await db.getAncestors("15");
  expect(ancestors).toHaveLength(1);
})

test("finds descendants", async () => {
  let descendants = await db.getDescendants("14");
  expect(descendants).toHaveLength(6);

  descendants = await db.getDescendants("7");
  expect(descendants).toHaveLength(1);
})
