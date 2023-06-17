import {Name, NameForm, Note, Person, Relationship, ResourceReference, Root} from "gedcomx-js";
import {faker} from "@faker-js/faker";
import {RelationshipTypes} from "./gedcomx-enums";

let testData: Root;

export default function getTestData(): object {
  if (!testData) testData = minimalData();

  return testData.toJSON();
}

function extensiveData() {

}

function minimalData() {
  return new Root()
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName())))
      //.addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .setId("p1"))
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName())))
      .setId("p2"))
    .addRelationship(new Relationship()
      .setPerson1(new ResourceReference().setResource("#p1"))
      .setPerson2(new ResourceReference().setResource("#p2"))
      .setType(RelationshipTypes.Couple))
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName())))
      .setId("p3"))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.ParentChild)
      .setPerson1(new ResourceReference().setResource("#p1"))
      .setPerson2(new ResourceReference().setResource("#p3")))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.ParentChild)
      .setPerson1(new ResourceReference().setResource("#p2"))
      .setPerson2(new ResourceReference().setResource("#p3")));
}
