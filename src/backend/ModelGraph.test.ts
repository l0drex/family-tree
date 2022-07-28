import {graphModel, loadData} from "./ModelGraph";
import * as data from "./test-data.json";
import {ViewMode} from "./ViewGraph";
import {RelationshipTypes} from "./gedcomx-enums";

test("loads data", () => {
  // load the data
  loadData(data);

  expect(graphModel.getPersons().length)
    .toBe(16 + 1);  // persons + unknown persons
  expect(graphModel.getRelationships().length)
    .toBe(26);
  expect(graphModel.getRelationships().filter(r => r.getType() === RelationshipTypes.Couple).length)
    .toBe(6);
  expect(graphModel.getRelationships().filter(r => r.getType() === RelationshipTypes.ParentChild).length)
    .toBe(20);
})

test.each([
  [ViewMode.DEFAULT,
    2 + 2 + 2 + 2 + 2 + 1,  // persons + couples
    2 * 2 + 5 + 1],  // 2 * couples + parent-child / 2
  [ViewMode.ALL, 17 + 6, 2 * 6 + 20 / 2],
  [ViewMode.DESCENDANTS, 4+2, 5],
  [ViewMode.ANCESTORS, 12+6, 17]
])("Builds view graph: %s", (viewMode: ViewMode, nodes: number, links: number) => {
  loadData(data);
  let viewGraph = graphModel.buildViewGraph("1", viewMode);
  expect(viewGraph.nodes.length).toBe(nodes);
  expect(viewGraph.links.length).toBe(links);
})

test.each([
  [ViewMode.DEFAULT, "15", 4+2, 5],
  [ViewMode.DEFAULT, "7", 4+2, 5],
  [ViewMode.ANCESTORS, "15", 2, 1],
  [ViewMode.DESCENDANTS, "7", 2, 1]
])("Build in edge case: %s", (viewMode: ViewMode, id: string, nodes: number, links: number) => {
  loadData(data);
  let viewGraph = graphModel.buildViewGraph(id, viewMode);
  expect(viewGraph.nodes.length).toBe(nodes);
  expect(viewGraph.links.length).toBe(links);
})
