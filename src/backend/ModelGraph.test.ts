import {graphModel, loadData} from "./ModelGraph";
import * as data from "./test-data.json";
import {RelationshipTypes} from "./gedcomx-extensions";

test("loads data", () => {
  // load the data
  loadData(data);
  expect(graphModel.getPersons().length).toBe(16+1);
  expect(graphModel.getRelationships().length).toBe(26);
  expect(graphModel.getRelationships().filter(r => r.getType() === RelationshipTypes.Couple).length).toBe(6);
  expect(graphModel.getRelationships().filter(r => r.getType() === RelationshipTypes.ParentChild).length)
    .toBe(20);
})
