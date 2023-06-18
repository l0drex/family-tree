import * as GedcomX from "gedcomx-js";
import {
  Address,
  Agent,
  Attribution, Coverage,
  Fact,
  Gender,
  Name,
  NameForm,
  Note, OnlineAccount,
  Person,
  PlaceReference,
  Relationship,
  ResourceReference,
  Root, SourceCitation, SourceDescription, SourceReference, TextValue,
  Document
} from "gedcomx-js";
import {faker} from "@faker-js/faker";
import {
  Confidence, DocumentTypes,
  GenderTypes,
  NameTypes,
  PersonFactTypes,
  RelationshipFactTypes,
  RelationshipTypes
} from "./gedcomx-enums";

let testData: Root;

export default function getTestData(): object {
  if (!testData) testData = extensiveData();

  return testData.toJSON();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extensiveData() {
  const lastName = faker.person.lastName();
  const marriageDate = new GedcomX.Date().setFormal(faker.date.past({years: 10}).toISOString());
  const womanFirstName = faker.person.firstName("female");

  return new Root()
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName({
        lastName: lastName,
        sex: "male"
      }))))
      .setGender(new Gender().setType(GenderTypes.Male))
      .addFact(new Fact().setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date().setFormal(faker.date.birthdate({min: 30, max: 40, mode: "age"}).toISOString())))
      .addFact(new Fact().setType(PersonFactTypes.MaritalStatus)
        .setValue("Married")
        .setPlace(new PlaceReference().setOriginal(faker.location.city()))
        .setDate(marriageDate))
      .addFact(new Fact().setType(PersonFactTypes.Occupation)
        .setValue(faker.person.jobTitle()))
      .addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .setConfidence(Confidence.High)
      .setId("p1"))
    .addPerson(new Person()
      .addName(new Name()
        .addNameForm(new NameForm()
          .setFullText(faker.person.fullName({firstName: womanFirstName, lastName: lastName, sex: "female"})))
        .setType(NameTypes.MarriedName))
      .addName(new Name()
        .addNameForm(new NameForm()
          .setFullText(faker.person.fullName({firstName: womanFirstName, sex: "female"})))
        .setType(NameTypes.BirthName))
      .setGender(new Gender().setType(GenderTypes.Female))
      .addFact(new Fact().setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date().setFormal(faker.date.birthdate({min: 30, max: 40, mode: "age"}).toISOString())))
      .addFact(new Fact().setType(PersonFactTypes.MaritalStatus)
        .setValue("Married")
        .setPlace(new PlaceReference().setOriginal(faker.location.city()))
        .setDate(marriageDate))
      .addFact(new Fact().setType(PersonFactTypes.Occupation)
        .setValue(faker.person.jobTitle()))
      .addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .setConfidence(Confidence.High)
      .setId("p2"))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.Couple)
      .setPerson1(new ResourceReference().setResource("#p1"))
      .setPerson2(new ResourceReference().setResource("#p2"))
      .addFact(new Fact().setType(RelationshipFactTypes.Marriage).setDate(marriageDate)))
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName({lastName: lastName}))))
      .addFact(new Fact().setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date().setFormal(faker.date.birthdate({min: 0, max: 10, mode: "age"}).toISOString())))
      .setConfidence(Confidence.High)
      .addSource(new SourceReference()
        .setDescription("#s1")
        .setAttribution(new Attribution()
          .setCreator(new ResourceReference().setResource("#a1"))
          .setContributor(new ResourceReference().setResource("#a2"))
          .setModified(Date.parse(faker.date.past().toString()))
          .setChangeMessage(faker.lorem.sentence())))
      .setId("p3"))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.ParentChild)
      .setPerson1(new ResourceReference().setResource("#p1"))
      .setPerson2(new ResourceReference().setResource("#p3")))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.ParentChild)
      .setPerson1(new ResourceReference().setResource("#p2"))
      .setPerson2(new ResourceReference().setResource("#p3")))
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName({lastName: lastName, sex: "male"}))))
      .setGender(new Gender().setType(GenderTypes.Male))
      .addFact(new Fact()
        .setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date()
          .setFormal(faker.date.birthdate({mode: "age", min: 70}).toISOString())))
      .addFact(new Fact()
        .setType(PersonFactTypes.Death)
        .setDate(new GedcomX.Date()
          .setFormal(faker.date.birthdate({min: 3, max: 10, mode: "age"}).toISOString())))
      .setConfidence(Confidence.Low)
      .setId("p4"))
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName({lastName: lastName, sex: "female"}))))
      .setGender(new Gender().setType(GenderTypes.Female))
      .addFact(new Fact()
        .setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date()
          .setFormal(faker.date.birthdate({mode: "age", min: 70}).toISOString())))
      .setConfidence(Confidence.Medium)
      .setId("p5"))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.Couple)
      .setPerson1(new ResourceReference().setResource("#p4"))
      .setPerson2(new ResourceReference().setResource("#p5")))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.ParentChild)
      .setPerson1(new ResourceReference().setResource("#p4"))
      .setPerson2(new ResourceReference().setResource("#p1")))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.ParentChild)
      .setPerson1(new ResourceReference().setResource("#p5"))
      .setPerson2(new ResourceReference().setResource("#p1")))
    .addSourceDescription(new SourceDescription()
      .addTitle(new TextValue().setValue(faker.lorem.words(3)))
      .addCitation(new SourceCitation().setValue(faker.lorem.text()))
      .addDescription(new TextValue().setValue(faker.lorem.text()))
      .addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .addCoverage(new Coverage().setSpatial(new PlaceReference().setOriginal(faker.location.city())))
      .setId("s1"))
    .addAgent(new Agent()
      .addName(new TextValue().setValue(faker.person.fullName()))
      .addEmail(new ResourceReference().setResource(faker.internet.email()))
      .setHomepage(new ResourceReference().setResource(faker.internet.url()))
      .addAccount(new OnlineAccount()
        .setServiceHomepage(new ResourceReference().setResource(faker.internet.url()))
        .setAccountName(faker.internet.userName()))
      .addPhone(new ResourceReference().setResource(faker.phone.number()))
      .addAddress(new Address().setValue(faker.address.streetAddress(true)))
      .setId("a1"))
    .addAgent(new Agent()
      .setPerson(new ResourceReference().setResource("#p1"))
      .setId("a2"))
    .addDocument(new Document()
      .setType(DocumentTypes.Analysis)
      .setExtracted(true)
      .setText(faker.lorem.paragraphs(3))
      .setConfidence(Confidence.High)
      .addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .setId("d1"))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function minimalData() {
  return new Root()
    .addPerson(new Person()
      .addName(new Name().addNameForm(new NameForm().setFullText(faker.person.fullName())))
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
