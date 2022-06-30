import {graphModel, loadData} from "./ModelGraph";
import * as data from "./test-data.json";

test("builds view graph", () => {
  // load the data
  loadData(data);
  expect(graphModel.getPersons().length).toBe(2);
  expect(graphModel.getRelationships().length).toBe(1);
})
