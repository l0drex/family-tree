import * as data from "./test-data.json";
import "fake-indexeddb/auto";
import {db} from "./db";
import viewGraph, {ViewGraph, ViewMode} from "./ViewGraph";
import * as GedcomX from "gedcomx-js";

db.load(data);

test.each([
  [ViewMode.DEFAULT, 2],  // 2 * couples + parent-child / 2
  [ViewMode.ALL, 6],
  [ViewMode.DESCENDANTS, 1],
  [ViewMode.ANCESTORS, 4]
])("Finds families: %s", async (viewMode: ViewMode, numberOfFamilies) => {
  let viewGraph = new ViewGraph();
  const startPerson = (await db.personWithId("1"));
  let families = await viewGraph.getFamilyViews(viewMode, startPerson);

  expect(families).toHaveLength(numberOfFamilies);
  families.forEach(f => expect(f).toBeInstanceOf(GedcomX.FamilyView));
  families.forEach(f => expect(f).toBeDefined());
})

test.each([
  [ViewMode.DEFAULT, "15", 1],
  [ViewMode.DEFAULT, "7", 1],
  [ViewMode.ANCESTORS, "15", 0],
  [ViewMode.DESCENDANTS, "7", 0]
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
    2 + 2 + 2 + 2 + 2 + 1,  // persons + couples
    2 * 2 + 5 + 1],  // 2 * couples + parent-child / 2
  [ViewMode.ALL, 17 + 6, 2 * 6 + 20 / 2],
  [ViewMode.DESCENDANTS, 4 + 2, 5],
  [ViewMode.ANCESTORS, 12 + 6, 17]
])("Builds view graph: %s", async (viewMode: ViewMode, nodes: number, links: number) => {
  let viewGraph = new ViewGraph();
  await viewGraph.load("1", viewMode);
  expect(viewGraph.nodes.length).toBe(nodes);
  expect(viewGraph.links.length).toBe(links);
})

test.each([
  [ViewMode.DEFAULT, "15", 4 + 2, 5],
  [ViewMode.DEFAULT, "7", 4 + 2, 5],
  [ViewMode.ANCESTORS, "15", 2, 1],
  [ViewMode.DESCENDANTS, "7", 2, 1]
])("Build in edge case: %s", async (viewMode: ViewMode, id: string, nodes: number, links: number) => {
  let viewGraph = new ViewGraph();
  await viewGraph.load(id, viewMode);
  expect(viewGraph.nodes.length).toBe(nodes);
  expect(viewGraph.links.length).toBe(links);
})

test("shows family", async () => {
  viewGraph.reset();
  const startPerson = await db.personWithId("10");
  viewGraph.startPerson = startPerson;

  let family = (await db.getFamiliesAsParent(startPerson))[0];
  await viewGraph.showFamily(family);

  expect(viewGraph.nodes.length).toBe(5);
  expect(viewGraph.links.length).toBe(4);

  await viewGraph.showFamily(family);

  expect(viewGraph.nodes.length).toBe(5);
  expect(viewGraph.links.length).toBe(4);
});

test("hides family", async () => {
  viewGraph.reset();
  const startPerson = await db.personWithId("10");
  viewGraph.startPerson = startPerson;

  let family = (await db.getFamiliesAsParent(startPerson))[0];
  await viewGraph.showFamily(family);
  await viewGraph.hideFamily(family);

  expect(viewGraph.nodes.length).toBe(2);
  expect(viewGraph.links.length).toBe(1);
})
