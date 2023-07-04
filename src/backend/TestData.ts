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
  Document, Identifiers, PlaceDescription, Conclusion, Subject, EvidenceReference
} from "gedcomx-js";
import {faker} from "@faker-js/faker";
import {
  Confidence, DocumentTypes,
  GenderTypes, IdentifierTypes, KnownResourceTypes,
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
    .addPerson(new Person(getSubject("p1"))
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
      .addFact(new Fact()
        .setType(PersonFactTypes.Death)
        .setDate(new GedcomX.Date()
          .setFormal(faker.date.birthdate({min: 3, max: 10, mode: "age"}).toISOString())))
      .addFact(new Fact().setType(PersonFactTypes.GenerationNumber).setValue(2)))
    .addPerson(new Person(getSubject("p2"))
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
      .addFact(new Fact().setType(PersonFactTypes.GenerationNumber).setValue(2)))
    .addRelationship(new Relationship()
      .setType(RelationshipTypes.Couple)
      .setPerson1(new ResourceReference().setResource("#p1"))
      .setPerson2(new ResourceReference().setResource("#p2"))
      .addFact(new Fact().setType(RelationshipFactTypes.Marriage).setDate(marriageDate)))
    .addPerson(new Person()
      .addFact(new Fact().setType(PersonFactTypes.GenerationNumber).setValue(1))
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
      .addFact(new Fact().setType(PersonFactTypes.GenerationNumber).setValue(3))
      .setId("p4"))
    .addPerson(new Person()
      .addFact(new Fact().setType(PersonFactTypes.GenerationNumber).setValue(3))
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
      .setResourceType(KnownResourceTypes.DigitalArtifact)
      .addCitation(new SourceCitation().setValue(faker.lorem.sentence()))
      .setMediaType("image/jpeg")
      .setAbout(faker.image.urlLoremFlickr())
      .setMediator(new ResourceReference().setResource("#a1"))
      // publisher, authors
      .addSource(new SourceReference().setDescription("#s1"))
      .setAnalysis(new ResourceReference().setResource("#d1"))
      .setComponentOf(new SourceReference().setDescription("#s1"))
      .addTitle(new TextValue().setValue(faker.lorem.words(3)))
      .addNote(new Note().setText(faker.lorem.paragraphs(1)))
      .setAttribution(getAttribution())
      .addRight(new ResourceReference().setResource(faker.internet.url()))
      .addCoverage(new Coverage().setSpatial(new PlaceReference().setOriginal(faker.location.city()).setDescription("#pd1")))
      .addDescription(new TextValue().setValue(faker.lorem.text()))
      .setIdentifiers(getIdentifiers("sd1"))
      .setCreated(faker.date.recent().valueOf())
      .setModified(faker.date.recent().valueOf())
      // published
      .setRepository(new ResourceReference().setResource(faker.internet.url()))
      .setId("s1"))
    .addSourceDescription(new SourceDescription()
      .addCitation(new SourceCitation().setValue(faker.lorem.sentence()))
      .setId("s2"))
    .addAgent(new Agent()
      .addName(new TextValue().setValue(faker.person.fullName()))
      .addName(new TextValue().setValue(faker.person.fullName()))
      .addEmail(new ResourceReference().setResource(faker.internet.email()))
      .setHomepage(new ResourceReference().setResource(faker.internet.url()))
      .addAccount(new OnlineAccount()
        .setServiceHomepage(new ResourceReference().setResource(faker.internet.url()))
        .setAccountName(faker.internet.userName()))
      .addPhone(new ResourceReference().setResource(faker.phone.number()))
      .addAddress(new Address().setValue(faker.location.streetAddress(true)))
      .setIdentifiers(getIdentifiers("a1"))
      .setPerson(new ResourceReference().setResource("#p1"))
      .setId("a1"))
    .addAgent(new Agent()
      .setId("a2"))
    .addDocument(new Document(getConclusion("d1"))
      .setType(DocumentTypes.Analysis)
      .setExtracted(faker.datatype.boolean())
      .setText(faker.lorem.paragraphs(3)))
    .addDocument(new Document()
      .setText(faker.lorem.paragraphs(3))
      .setId("d2"))
    .addPlace(new PlaceDescription(getSubject("pd1"))
      .addName(new TextValue().setValue(faker.location.city()))
      .addName(new TextValue().setValue(faker.location.city()))
      .setLatitude(faker.location.latitude())
      .setLongitude(faker.location.longitude())
      .setJurisdiction(new ResourceReference().setResource("#pd2"))
      .setTemporalDescription(new GedcomX.Date().setFormal(faker.date.past().toISOString())))
    .addPlace(new PlaceDescription()
      .addName(new TextValue().setValue(faker.location.city()))
      .setId("pd2"))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function minimalData() {
  return new Root();
}

function getIdentifiers(id) {
  return new Identifiers()
    .addValue(`#${id}`, IdentifierTypes.Primary)
    .addValue(faker.internet.url(), IdentifierTypes.Authority)
    .addValue(faker.internet.url(), IdentifierTypes.Deprecated);
}

function getSubject(id: string) {
  return new Subject(getConclusion(id))
    .setExtracted(faker.datatype.boolean())
    .addEvidence(new EvidenceReference().setResource("#s1"))
    .addMedia(new SourceReference().setDescription("#s1"))
    .setIdentifiers(getIdentifiers(id))
}

function getAttribution() {
  return new Attribution()
    .setCreator(new ResourceReference().setResource("#a1"))
    .setCreated(faker.date.recent().valueOf())
    .setContributor(new ResourceReference().setResource("#a1"))
    .setModified(faker.date.recent().valueOf())
    .setChangeMessage(faker.lorem.sentence())
}

function getConclusion(id: string) {
  const confidence = faker.helpers.arrayElement([Confidence.Low, Confidence.Medium, Confidence.High]);

  return new Conclusion()
    .addSource(new SourceReference().setDescription("#s1"))
    .setAnalysis(new ResourceReference().setResource("#d1"))
    .addNote(new Note().setText(faker.lorem.paragraphs(1)))
    .setConfidence(confidence)
    .setAttribution(getAttribution())
    .setId(id)
}
