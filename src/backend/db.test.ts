import "fake-indexeddb/auto";
import {db} from "./db";
import * as GedcomX from "gedcomx-js";
import {FamilyView} from "./gedcomx-extensions";
import {unique} from "../main";
import getTestData from "./TestData";

beforeAll(async () => {
  return db.load(getTestData());
})

test("loads data", async () => {
  await expect(db.persons.count()).resolves.toBe(17);
  await expect(db.relationships.count()).resolves.toBe(22);
  await expect(db.couples.count()).resolves.toBe(6);
  await expect(db.parentChilds.count()).resolves.toBe(16);
});

test("finds person", async () => {
  await expect(db.personWithId("husband")).resolves.toBeInstanceOf(GedcomX.Person);
  await expect(db.personWithId("grandmother2")).resolves.toBeInstanceOf(GedcomX.Person);

  await expect(db.personWithId(undefined)).rejects.toThrow("Could not parse resource!");
  await expect(db.personWithId("")).rejects.toThrow("Could not parse resource!");
})

test("finds children", async () => {
  await expect(db.getChildrenOf("daughter")).resolves.toHaveLength(0);
  await expect(db.getChildrenOf("husband")).resolves.toHaveLength(2);
  await expect(db.getChildrenOf("father")).resolves.toHaveLength(3);

  await expect(db.getChildrenOf("#father")).resolves.toHaveLength(3);
  await expect(db.getChildrenOf(new GedcomX.ResourceReference().setResource("#father"))).resolves.toHaveLength(3);
  await expect(db.getChildrenOf({resource: "#father"} as GedcomX.ResourceReference)).resolves.toHaveLength(3);
})

test("finds couples children", async () => {
  let children = await db.getChildrenOfBoth("husband", "wife");
  expect(children).toHaveLength(2);
  let childIds = children.map(c => c.resource.substring(1));
  expect(childIds).toContain("son")
  expect(childIds).toContain("daughter")

  children = await db.getChildrenOfBoth("father", "mother");
  expect(children).toHaveLength(3);

  children = await db.getChildrenOfBoth("mother", "father");
  expect(children).toHaveLength(3);

  children = await db.getChildrenOfBoth("father", "daughter");
  expect(children).toHaveLength(0);

  let resource1 = new GedcomX.ResourceReference().setResource("#father");
  let resource2 = new GedcomX.ResourceReference().setResource("#mother");
  children = await db.getChildrenOfBoth(resource1, resource2);
  expect(children).toHaveLength(3);

  children = await db.getChildrenOfBoth(resource2, resource1);
  expect(children).toHaveLength(3);

  let resourceO1 = {resource: "#father"} as GedcomX.ResourceReference;
  let resourceO2 = {resource: "#mother"} as GedcomX.ResourceReference;
  children = await db.getChildrenOfBoth(resourceO1, resourceO2);
  expect(children).toHaveLength(3);
})

test("finds parents", async () => {
  await expect(db.getParentsOf("grandfather")).resolves.toHaveLength(0);
  await expect(db.getParentsOf("wife")).resolves.toHaveLength(0);
  await expect(db.getParentsOf("son")).resolves.toHaveLength(2);
  await expect(db.getParentsOf("cousin")).resolves.toHaveLength(2);
})

test("finds families as child", async () => {
  let person = await db.personWithId("sister");

  let families = await db.getFamiliesAsChild(person);
  expect(families).toHaveLength(1);

  let family = families[0];
  expect(family.parent1.resource).toBe("#mother");
  expect(family.parent2.resource).toBe("#father");
  expect(family.children).toHaveLength(3);

  person = await db.personWithId("husband");
  families = await db.getFamiliesAsChild(person);
  expect(families).toHaveLength(1);
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));

  person = await db.personWithId("grandmother");
  families = await db.getFamiliesAsChild(person);
  expect(families).toHaveLength(0);
})

test("finds families as parent", async () => {
  let person = await db.personWithId("mother");
  await expect(db.getFamiliesAsParent(person)).resolves.toHaveLength(2);

  person = await db.personWithId("husband");
  let families = await db.getFamiliesAsParent(person);
  expect(families).toHaveLength(1);
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));

  person = await db.personWithId("son");
  families = await db.getFamiliesAsParent(person);
  expect(families).toHaveLength(0);
})

test("returned families are equal", async () => {
  let parent = await db.personWithId("husband");
  let parentFamilies = db.getFamiliesAsParent(parent);

  let child = await db.personWithId("daughter");
  let childFamilies = db.getFamiliesAsChild(child);

  let fs = await Promise.all([parentFamilies, childFamilies]);
  let families = fs.flat(1)
    .map(f => new FamilyView(f.toJSON()));

  expect(unique(families)).toHaveLength(1);
})

test("finds ancestors", async () => {
  let ancestors = await db.getAncestors("husband");
  expect(ancestors).toHaveLength(5);

  ancestors = await db.getAncestors("grandmother");
  expect(ancestors).toHaveLength(1);
})

test("finds descendants", async () => {
  let descendants = await db.getDescendants("grandmother");
  expect(descendants).toHaveLength(9);

  descendants = await db.getDescendants("cousin");
  expect(descendants).toHaveLength(1);
})

it("finds person with name", async () => {
  await expect(db.personWithName("Random Guy").then(p => p.getId())).resolves.toBe("random");
})
