import "fake-indexeddb/auto";
import {db} from "./db";
import {ViewGraph, ViewMode} from "./ViewGraph";
import * as GedcomX from "gedcomx-js";
import {Person} from "../gedcomx/gedcomx-js-extensions";
import getTestData from "./TestData";

beforeAll(async () => {
  return db.load(getTestData());
})

test.each([
  [ViewMode.DEFAULT, 2],  // 2 * couples + parent-child / 2
  [ViewMode.ALL, 6],
  [ViewMode.DESCENDANTS, 1],
  [ViewMode.ANCESTORS, 4]
])("Finds families: %s", async (viewMode: ViewMode, numberOfFamilies) => {
  let viewGraph = new ViewGraph();
  const startPerson = await db.personWithId("husband");
  let families = await viewGraph.getFamilyViews(viewMode, startPerson);

  expect(families).toHaveLength(numberOfFamilies);
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));
  families.forEach(f => expect(f).toBeDefined());
})

test.each([
  [ViewMode.DEFAULT, "grandmother", 1],
  [ViewMode.DEFAULT, "son", 1],
  [ViewMode.ANCESTORS, "grandmother", 0],
  [ViewMode.DESCENDANTS, "son", 0]
])("Finds families in edge case: %s", async (viewMode: ViewMode, id: string, numberOfFamilies: number) => {
  let viewGraph = new ViewGraph();
  const startPerson = (await db.personWithId(id));
  let families = await viewGraph.getFamilyViews(viewMode, startPerson);

  expect(families).toHaveLength(numberOfFamilies);
  families.forEach(f => expect(f).toBeDefined());
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));
})

test.each([
  [ViewMode.DEFAULT,
    8 + 3,
    10],
  [ViewMode.ALL, 18 + 6, 20],
  [ViewMode.DESCENDANTS, 4 + 2, 5],
  [ViewMode.ANCESTORS, 10 + 6, 15]
])("Builds view graph: %s", async (viewMode: ViewMode, nodes: number, links: number) => {
  let viewGraph = new ViewGraph();
  let person = await db.personWithId("husband").then(p => new Person(p));
  await viewGraph.load(person, viewMode);
  expect(viewGraph.nodes.length).toBe(nodes);
  expect(viewGraph.links.length).toBe(links);
})

test.each([
  [ViewMode.DEFAULT, "grandmother", 4 + 4, 7],
  [ViewMode.DEFAULT, "son", 4 + 2, 5],
  [ViewMode.ANCESTORS, "grandmother", 1 + 1, 1],
  [ViewMode.DESCENDANTS, "son", 1 + 1, 1]
])("Build in edge case: %s", async (viewMode: ViewMode, id: string, nodes: number, links: number) => {
  let viewGraph = new ViewGraph();
  let person = await db.personWithId(id).then(p => new Person(p));
  await viewGraph.load(person, viewMode);
  expect(viewGraph.nodes.length).toBe(nodes);
  expect(viewGraph.links.length).toBe(links);
})

test("shows family", async () => {
  let viewGraph = new ViewGraph();
  viewGraph.reset();

  const startPerson = await db.personWithId("uncle");
  viewGraph.startPerson = startPerson;

  let family = (await db.getFamiliesAsParent(startPerson))[0];
  await viewGraph.showFamily(family);

  expect(viewGraph.nodes.length).toBe(5);
  expect(viewGraph.links.length).toBe(4);

  await viewGraph.showFamily(family);

  expect(viewGraph.nodes.length).toBe(5);
  expect(viewGraph.links.length).toBe(4);

  let person = await db.personWithId("grandmother").then(p => new Person(p));
  await viewGraph.load(person, ViewMode.DEFAULT);
  await viewGraph.showFamily(family);

  expect(viewGraph.nodes.length).toBe(8 + 2);
  expect(viewGraph.links.length).toBe(9);
});

test("hides family", async () => {
  let viewGraph = new ViewGraph();
  viewGraph.reset();

  const startPerson = await db.personWithId("uncle");
  viewGraph.startPerson = startPerson;

  let family = (await db.getFamiliesAsParent(startPerson))[0];
  await viewGraph.showFamily(family);
  await viewGraph.hideFamily(family);

  expect(viewGraph.nodes.length).toBe(2);
  expect(viewGraph.links.length).toBe(1);
  let person = await db.personWithId("grandmother").then(p => new Person(p));

  await viewGraph.load(person, ViewMode.DEFAULT);
  await viewGraph.showFamily(family);
  await viewGraph.hideFamily(family);

  expect(viewGraph.nodes.length).toBe(8);
  expect(viewGraph.links.length).toBe(7);
})

test("no unnecessary recalculations", async () => {
  let viewGraph = new ViewGraph();
  viewGraph.reset();

  let person = await db.personWithId("husband").then(p => new Person(p));

  await viewGraph.load(person, ViewMode.DEFAULT);
  expect(viewGraph.nodes.length).toBe(11);
  expect(viewGraph.links.length).toBe(10);
})
