import * as GedcomX from "gedcomx-js";
import {
  Address,
  Agent,
  Attribution,
  Conclusion,
  Coverage,
  Document, EventRole,
  EvidenceReference,
  Fact,
  Gender,
  Identifiers,
  Name,
  NameForm,
  NamePart,
  Note,
  OnlineAccount,
  Person,
  PlaceDescription,
  PlaceReference, Qualifier,
  Relationship,
  ResourceReference,
  Root,
  SourceCitation,
  SourceDescription,
  SourceReference,
  Subject,
  TextValue
} from "gedcomx-js";
import {faker} from "@faker-js/faker";
import {
  Confidence,
  DocumentTypes, EventRoleTypes, EventTypes,
  GenderTypes,
  IdentifierTypes,
  KnownResourceTypes, NamePartQualifier,
  NamePartTypes,
  NameTypes, FactQualifier,
  PersonFactTypes,
  RelationshipFactTypes,
  RelationshipTypes
} from "../gedcomx/types";

let testData: Root;

export default function getTestData(): object {
  if (!testData) testData = extensiveData();

  return testData.toJSON();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extensiveData() {
  const marriageDate = new GedcomX.Date().setFormal(faker.date.past({years: 10}).toISOString());

  return new Root()
    .setDescription("#s1")
    .setAttribution(getAttribution())
    .addPerson(getPerson("husband", "male")
      .setPrivate(true)
      .addName(new Name(getConclusion("husbandName"))
        .setType(NameTypes.Nickname)
        .setDate(marriageDate)
        .addNameForm(new NameForm()
          .setFullText("Husband")
          .setLang("en")
          .addPart(new NamePart()
            .setType(NamePartTypes.Given)
            .setValue("Husband")
            .addQualifier(new Qualifier()
              .setName(NamePartQualifier.Occupational))))
        .addNameForm(new NameForm()
          .setFullText("Ehemann")
          .setLang("de")
          .addPart(new NamePart()
            .setType(NamePartTypes.Given)
            .setValue("Ehemann")
            .addQualifier(new Qualifier()
              .setName(NamePartQualifier.Occupational)))))
      .addFact(new Fact().setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date().setFormal(faker.date.birthdate({min: 30, max: 40, mode: "age"}).toISOString())))
      .addFact(new Fact().setType(PersonFactTypes.MaritalStatus)
        .setValue("Married")
        .setPlace(new PlaceReference().setOriginal(faker.location.city()))
        .setDate(marriageDate))
      .addFact(new Fact().setType(PersonFactTypes.Occupation)
        .setValue(faker.person.jobTitle())
        .addQualifier(new Qualifier()
          .setName(FactQualifier.Age)
          .setValue(faker.number.int({min: 20, max: 40}).toString())))
      .addFact(new Fact()
        .setType(PersonFactTypes.Death)
        .setDate(new GedcomX.Date()
          .setFormal(faker.date.birthdate({min: 3, max: 10, mode: "age"}).toISOString()))
        .addQualifier(new Qualifier()
          .setName(FactQualifier.Cause)
          .setValue(faker.lorem.word())))
      .addFact(new Fact(getConclusion("husbandsGenerationFact"))
        .setType(PersonFactTypes.GenerationNumber).setValue(2))
      .addFact(new Fact()
        .setType(PersonFactTypes.NumberOfMarriage).setValue(1)
        .addNote(new Note().setText(faker.lorem.sentence()))
        .addSource(new SourceReference().setDescription("#s1"))
        .setAttribution(new Attribution()
          .setCreator(new ResourceReference().setResource("#a1")))))
    .addPerson(getPerson("wife", "female")
      .addFact(new Fact().setType(PersonFactTypes.Birth)
        .setDate(new GedcomX.Date().setFormal(faker.date.birthdate({min: 30, max: 40, mode: "age"}).toISOString())))
      .addFact(new Fact().setType(PersonFactTypes.MaritalStatus)
        .setValue("Married")
        .setPlace(new PlaceReference().setOriginal(faker.location.city()))
        .setDate(marriageDate))
      .addFact(new Fact().setType(PersonFactTypes.Occupation)
        .setValue(faker.person.jobTitle()))
      .addFact(new Fact().setType(PersonFactTypes.GenerationNumber).setValue(2)))
    .addRelationship(getCouple("husband", "wife")
      .addFact(new Fact().setType(RelationshipFactTypes.Marriage).setDate(marriageDate)))
    .addPerson(getPerson("son", "male"))
    .addRelationship(getParentChild("husband", "son"))
    .addRelationship(getParentChild("wife", "son"))
    .addPerson(getPerson("daughter", "female"))
    .addRelationship(getParentChild("husband", "daughter"))
    .addRelationship(getParentChild("wife", "daughter"))
    .addPerson(getPerson("mother", "female"))
    .addPerson(getPerson("father", "male"))
    .addRelationship(getCouple("mother", "father"))
    .addRelationship(getParentChild("mother", "husband"))
    .addRelationship(getParentChild("father", "husband"))
    .addPerson(getPerson("sister", "female"))
    .addRelationship(getParentChild("mother", "sister"))
    .addRelationship(getParentChild("father", "sister"))
    .addPerson(getPerson("brother", "male"))
    .addRelationship(getParentChild("mother", "brother"))
    .addRelationship(getParentChild("father", "brother"))
    .addPerson(getPerson("stepFather", "male"))
    .addRelationship(getCouple("mother", "stepFather"))
    .addPerson(getPerson("uncle", "male", true))
    .addPerson(getPerson("aunt", "female", true))
    .addRelationship(getCouple("uncle", "aunt"))
    .addPerson(getPerson("cousin", "intersex", true))
    .addRelationship(getParentChild("uncle", "cousin"))
    .addRelationship(getParentChild("aunt", "cousin"))
    .addPerson(getPerson("grandmother", "female"))
    .addPerson(getPerson("grandfather", "male"))
    .addRelationship(getCouple("grandmother", "grandfather"))
    .addRelationship(getParentChild("grandmother", "mother"))
    .addRelationship(getParentChild("grandmother", "aunt"))
    .addRelationship(getParentChild("grandfather", "mother"))
    .addRelationship(getParentChild("grandfather", "aunt"))
    .addPerson(new Person()
      .setId("grandmother2"))
    .addRelationship(getCouple("grandmother2", "grandfather"))
    .addPerson(new Person()
      .addName(new Name()
        .addNameForm(new NameForm().setFullText("Random Guy")))
      .setId("p1"))
    .addPerson(new Person()
      .setId("p2"))
    .addPerson(new Person())
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
      .setMediaType("image/jpeg")
      .setAbout(faker.image.urlPicsumPhotos())
      .setId("s2"))
    .addSourceDescription(new SourceDescription()
      .addCitation(new SourceCitation().setValue(faker.lorem.sentence())))
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
      .setPerson(new ResourceReference().setResource("#husband"))
      .setId("a1"))
    .addAgent(new Agent())
    .addDocument(new Document(getConclusion("d1"))
      .setType(DocumentTypes.Analysis)
      .setExtracted(faker.datatype.boolean())
      .setText(faker.lorem.paragraphs(3)))
    .addDocument(new Document()
      .setText(faker.lorem.paragraphs(3)))
    .addPlace(new PlaceDescription(getSubject("pd1", "pd"))
      .setType("City")
      .setPlace(new ResourceReference().setResource(faker.internet.url()))
      .addName(new TextValue().setValue(faker.location.city()))
      .addName(new TextValue().setValue(faker.location.city()))
      .setLatitude(faker.location.latitude())
      .setLongitude(faker.location.longitude())
      .setJurisdiction(new ResourceReference().setResource("#pd2"))
      .setTemporalDescription(new GedcomX.Date().setFormal(faker.date.past().toISOString()))
      .setSpatialDescription(new ResourceReference().setResource(faker.internet.url())))
    .addPlace(new PlaceDescription()
      .addName(new TextValue().setValue(faker.location.city())))
    .addEvent(new GedcomX.Event(getSubject("e1", "e"))
      .setType(EventTypes.Birth)
      .setDate(new GedcomX.Date().setFormal(faker.date.past().toISOString()))
      .setPlace(new PlaceReference().setDescription("#pd1"))
      .addRole(new EventRole()
        .setPerson(new ResourceReference().setResource("#mother"))
        .setType(EventRoleTypes.Principal))
      .addRole(new EventRole()
        .setType(EventRoleTypes.Participant)
        .setPerson(new ResourceReference().setResource("#father"))
        .setDetails(faker.lorem.sentence())))
    .addEvent(new GedcomX.Event())
}

function getParentChild(parent: string, child: string) {
  return new Relationship()
    .setType(RelationshipTypes.ParentChild)
    .setPerson1(new ResourceReference().setResource(`#${parent}`))
    .setPerson2(new ResourceReference().setResource(`#${child}`));
}

function getCouple(person1: string, person2: string) {
  return new Relationship()
    .setType(RelationshipTypes.Couple)
    .setPerson1(new ResourceReference().setResource(`#${person1}`))
    .setPerson2(new ResourceReference().setResource(`#${person2}`));
}

const lastName = faker.person.lastName();
const otherLastName = faker.person.lastName();
function getPerson(id: string, gender?: "male" | "female" | "intersex", otherName?: boolean) {
  let fakerGender;
  let genderType;
  switch (gender) {
    case "male":
      genderType = GenderTypes.Male;
      fakerGender = gender;
      break;
    case "female":
      genderType = GenderTypes.Female;
      fakerGender = gender;
      break;
    case "intersex":
      genderType = GenderTypes.Intersex;
      fakerGender = undefined;
      break;
    default:
      genderType = GenderTypes.Unknown;
      fakerGender = undefined;
      break;
  }

  const firstName = faker.person.firstName(fakerGender);
  const thisLastName = otherName ? otherLastName : lastName;

  let person = new Person(getSubject(id, "p"))
    .setGender(new Gender().setType(genderType))
    .addName(new Name()
      .addNameForm(new NameForm().setFullText(faker.person.fullName({sex: fakerGender, firstName: firstName, lastName: thisLastName}))
        .addPart(new NamePart().setValue(thisLastName).setType(NamePartTypes.Surname))
        .addPart(new NamePart().setValue(firstName).setType(NamePartTypes.Given)))
      .setType(gender === "female" ? NameTypes.MarriedName : NameTypes.BirthName));

  if (gender === "female") {
    const originalLastName = faker.person.lastName();
    person.addName(new Name()
      .addNameForm(new NameForm().setFullText(faker.person.fullName({sex: gender, firstName: firstName, lastName: originalLastName}))
        .addPart(new NamePart().setValue(firstName).setType(NamePartTypes.Given))
        .addPart(new NamePart().setValue(originalLastName).setType(NamePartTypes.Surname)))
      .setType(NameTypes.BirthName));
  }

  return person;
}

function getIdentifiers(id) {
  return new Identifiers()
    .addValue(`#${id}`, IdentifierTypes.Primary)
    .addValue(faker.internet.url(), IdentifierTypes.Authority)
    .addValue(faker.internet.url(), IdentifierTypes.Deprecated);
}

function getSubject(id: string, evidencePrefix: string) {
  return new Subject(getConclusion(id))
    .setExtracted(faker.datatype.boolean())
    .addEvidence(new EvidenceReference()
      .setAttribution(getAttribution())
      .setResource(`#${evidencePrefix}1`))
    .addEvidence(new EvidenceReference().setResource(`#${evidencePrefix}2`))
    .addMedia(new SourceReference().setDescription("#s1"))
    .addMedia(new SourceReference().setDescription("#s2"))
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
    .addSource(new SourceReference()
      .setDescription("#s1")
      .setAttribution(getAttribution()))
    .addSource(new SourceReference().setDescription("#s2"))
    .setAnalysis(new ResourceReference().setResource("#d1"))
    .addNote(new Note()
      .setSubject(faker.lorem.words(3))
      .setText(faker.lorem.paragraphs(1))
      .setAttribution(getAttribution()))
    .addNote(new Note().setText(faker.lorem.paragraphs(1)))
    .setConfidence(confidence)
    .setAttribution(getAttribution())
    .setId(id)
}
