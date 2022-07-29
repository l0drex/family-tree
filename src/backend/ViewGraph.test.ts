import * as data from "./test-data.json";
import viewGraph from "./ViewGraph";
import {graphModel, loadData} from "./ModelGraph";

test("shows family", () => {
  loadData(data);
  viewGraph.reset();
  let family = graphModel.getFamiliesAsParent(graphModel.getPersonById("10"))[0]
  viewGraph.showFamily(family);
  expect(viewGraph.nodes.length).toBe(5);
  expect(viewGraph.links.length).toBe(4)
});

test("hides family", () => {
  loadData(data);
  viewGraph.reset();
  viewGraph.startPerson = graphModel.getPersonById("10");

  let family = graphModel.getFamiliesAsParent(graphModel.getPersonById("10"))[0]
  viewGraph.showFamily(family);
  viewGraph.hideFamily(family);


  expect(viewGraph.nodes.length).toBe(2);
  expect(viewGraph.links.length).toBe(1);
})
