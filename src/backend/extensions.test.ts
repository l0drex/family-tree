import {GraphFamily} from "./graph";
import * as GedcomX from "gedcomx-js";
import {FamilyView} from "./gedcomx-extensions";
import {ResourceReference} from "gedcomx-js";

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
