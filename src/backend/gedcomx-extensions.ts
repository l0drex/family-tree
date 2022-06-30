import * as GedcomX from "gedcomx-js";
import {translationToString} from "../main";
import config from "../config";
import {
  DisplayProperties,
  Fact, FamilyView,
  Person,
  PlaceReference,
  Qualifier, Relationship
} from "gedcomx-js";

GedcomX.enableRsExtensions();

type PersonType = "person";
type FamilyType = "family" | "etc";
type GraphObjectType = PersonType | FamilyType;

export interface GraphObject {
  type: GraphObjectType | `${GraphObjectType}-removed`
  width: number
  height: number
  bounds
  viewId: number
}

export class GraphPerson extends GedcomX.DisplayProperties implements GraphObject {
  type: PersonType | `${PersonType}-removed` = "person"
  data: Person
  width = config.gridSize * 5
  height = config.gridSize / 2 * 2.25
  bounds
  viewId

  constructor(person: Person) {
    super({
      name: person.getFullName(),
      gender: readableGender(person.getGender()),
      ascendancyNumber: getGeneration(person)
    });
    this.data = person;
  }

  equals = (person: Person | GraphPerson | DisplayProperties) => {
    if (person instanceof DisplayProperties) {
      return person.getName() === this.getName()
        && person.getBirthDate() === this.getBirthDate();
    }

    if (person instanceof GraphPerson) {
      person = person.data;
    }
    return person.getId() === this.data.getId();
  }

  toString = () => {
    return `${this.data.getFullName()} (#${this.data.getId()} @${this.viewId})`
  }
}

export class GraphFamily extends GedcomX.FamilyView implements GraphObject {
  type: FamilyType | `${FamilyType}-removed` = "family"
  width = config.margin * 2
  height = config.margin * 2
  bounds
  viewId

  equals = (object: FamilyView): Boolean => {
    return this.getParent1().getResource() === object.getParent1().getResource() &&
      this.getParent2().getResource() === object.getParent2().getResource();
  }

  toString = () => {
    return `Family of ${this.getParent1().getResource()} and ${this.getParent2().getResource()}`
  }
}

export enum Confidence {
  Low = "http://gedcomx.org/Low", Medium = "http://gedcomx.org/Medium", High = "http://gedcomx.org/High"
}

export enum GenderTypes {
  Male = "http://gedcomx.org/Male",
  Female = "http://gedcomx.org/Female",
  Intersex = "http://gedcomx.org/Intersex",
  Unknown = "http://gedcomx.org/Unknown"
}

export enum NamePartTypes {
  Prefix = "http://gedcomx.org/Prefix",
  Suffix = "http://gedcomx.org/Suffix",
  Given = "http://gedcomx.org/Given",
  Surname = "http://gedcomx.org/Surname"
}

export enum NameTypes {
  BirthName = "http://gedcomx.org/BirthName",
  MarriedName = "http://gedcomx.org/MarriedName",
  AlsoKnownAs = "http://gedcomx.org/AlsoKnownAs",
  Nickname = "http://gedcomx.org/Nickname",
  AdoptiveName = "http://gedcomx.org/AdoptiveName",
  FormalName = "http://gedcomx.org/FormalName",
  ReligiousName = "http://gedcomx.org/ReligiousName"
}

export enum PersonFactTypes {
  Adoption = "http://gedcomx.org/Adoption",
  Birth = "http://gedcomx.org/Birth",
  Burial = "http://gedcomx.org/Burial",
  Christening = "http://gedcomx.org/Christening",
  Death = "http://gedcomx.org/Death",
  Residence = "http://gedcomx.org/Residence",
  Religion = "http://gedcomx.org/Religion",
  Occupation = "http://gedcomx.org/Occupation",
  MaritalStatus = "http://gedcomx.org/MaritalStatus",
  Generation = "http://gedcomx.org/GenerationNumber"
}

export enum PersonFactQualifiers {
  Age = "http://gedcomx.org/Age",
  Cause = "http://gedcomx.org/Cause",
  Religion = "http://gedcomx.org/Religion",
  Transport = "http://gedcomx.org/Transport",
  NonConsensual = "http://gedcomx.org/NonConsensual"
}

export enum RelationshipTypes {
  Couple = "http://gedcomx.org/Couple",
  ParentChild = "http://gedcomx.org/ParentChild",
  AncestorDescendant = "http://gedcomx.org/AncestorDescendant",
  Godparent = "http://gedcomx.org/Godparent",
  EnslavedBy = "http://gedcomx.org/EnslavedBy"
}

export enum RelationshipFactTypes {
  Divorce = "http://gedcomx.org/Divorce",
  Marriage = "http://gedcomx.org/Marriage"
}

export const baseUri = "http://gedcomx.org/";

// Person

function getGeneration(person): number | undefined {
  let generationFacts = person.getFactsByType(PersonFactTypes.Generation);
  if (!generationFacts.length) {
    return undefined
  }
  return generationFacts[0].value
}

function readableGender(gender): string {
  gender = gender || {type: GenderTypes.Unknown};
  return gender.type.substring(baseUri.length).toLowerCase();
}

let referenceAge = {
  age: undefined,
  generation: undefined
};

export function setReferenceAge(age: number, generation: number) {
  console.info(`Setting reference age to ${age} at generation ${generation}`)
  referenceAge.age = age;
  referenceAge.generation = generation;
}

Person.prototype.getFullName = function (): string {
  try {
    return this.getPreferredName().getNameForms()[0].getFullText(true);
  } catch (e) {
    if (e instanceof TypeError) {
      return "?";
    }
    throw e;
  }
}

Person.prototype.getBirthName = function (): string {
  let name = this.getNames().find(name => name.type && name.type === NameTypes.BirthName)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

Person.prototype.getMarriedName = function (): string {
  let name = this.getNames().find(name => name.type && name.type === NameTypes.MarriedName)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

Person.prototype.getAlsoKnownAs = function (): string {
  let name = this.getNames().find(name => name.type && name.type === NameTypes.AlsoKnownAs)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

Person.prototype.getNickname = function (): string {
  let name = this.getNames().find(name => name.type && name.type === NameTypes.Nickname)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

/**
 * Calculates age today
 */
Person.prototype.getAgeToday = function (): number | undefined {
  let birth = this.getFactsByType(PersonFactTypes.Birth)[0];
  // exact calculation not possible without birthdate
  if (!birth || !birth.date || !birth.date.toDateObject()) {
    // guess the age based on the generation number
    if (referenceAge.age !== undefined && getGeneration(this) !== undefined) {
      return (referenceAge.generation - getGeneration(this)) * 25 + referenceAge.age;
    }
    return undefined
  }

  let birthDate = birth.date.toDateObject();
  let lastDate = new Date();

  // subtraction returns milliseconds, have to convert to year
  return Math.floor((lastDate.getTime() - birthDate.getTime()) / 31536000000);
}

Person.prototype.getLiving = function (): boolean {
  return this.getFactsByType(PersonFactTypes.Death).length === 0 && this.getAgeToday() < 120
}

Person.prototype.toGraphObject = function (): GraphPerson {
  return new GraphPerson(this);
}

Person.prototype.toString = function (): string {
  return `${this.getFullName()} (#${this.getId()})`;
}

Person.prototype.getDisplay = function (): GraphPerson {
  if (this.displayProperties === undefined || !(this.displayProperties instanceof GraphPerson)) {
    this.setDisplay(new GraphPerson(this));
  }

  return this.display;
}


// Relationship

Relationship.prototype.getMembers = function (): GedcomX.ResourceReference[] {
  return [this.getPerson1(), this.getPerson2()]
}

Relationship.prototype.toString = function (): string {
  let type = "Relationship";
  if (this.type) {
    type = this.getType().substring(baseUri.length);
  }
  return `${type} of ${this.getPerson1().resource} and ${this.getPerson2().resource}`
}

Relationship.prototype.toGraphObject = function (): GraphFamily {
  return new GraphFamily(this);
}


// Date

GedcomX.Date.prototype.toDateObject = function (): Date {
  if (!this.getFormal()) {
    return undefined;
  }

  let year = this.formal.substring(1, 5);
  if (!year) {
    return undefined;
  }
  let month = this.formal.substring(6, 8);
  if (month) {
    // some javascript weirdness
    month = parseInt(month) - 1;
  }
  let day = this.formal.substring(9, 11);
  let hour = this.formal.substring(12, 14);
  let minute = this.formal.substring(15, 17);
  let second = this.formal.substring(18, 20);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

GedcomX.Date.prototype.toString = function (): string {
  if (this.original) {
    return this.original;
  }

  let dateObject = this.toDateObject();
  if (!dateObject) {
    return "";
  }

  if (this.formal.length <= 11) {
    return dateObject.toLocaleDateString();
  }

  return dateObject.toLocaleString();
}


// Fact

Fact.prototype.toString = function (): string {
  let string;
  let value = this.value;

  switch (this.type) {
    case PersonFactTypes.Birth:
      string = translationToString({
        en: "born",
        de: "geboren"
      });
      break;
    case PersonFactTypes.Generation:
      string = translationToString({
        en: "Generation",
        de: "Generation"
      });
      break;
    case PersonFactTypes.MaritalStatus:
      string = translationToString({
        en: "",
        de: ""
      });
      switch (value) {
        case "single":
          value = translationToString({
            en: "single",
            de: "ledig"
          });
          break;
        case "married":
          value = translationToString({
            en: "married",
            de: "verheiratet"
          });
          break;
      }
      break;
    case PersonFactTypes.Religion:
      string = translationToString({
        en: "Religion:",
        de: "Religion:"
      });
      break;
    case PersonFactTypes.Occupation:
      string = translationToString({
        en: "works as",
        de: "arbeitet als"
      })
      break;
    case PersonFactTypes.Death:
      string = translationToString({
        en: "died",
        de: "verstorben"
      });
      break;
    default:
      string = this.type;
      break;
  }

  string += translationToString({
    en: `${value || value === 0 ? " " + value : ""}` +
      `${this.date && this.date.toString() ? " on " + this.date.toString() : ""}` +
      `${this.place && this.place.toString() ? " in " + this.place.toString() : ""}`,

    de: `${value || value === 0 ? " " + value : ""}` +
      `${this.date && this.date.toString() ? " am " + this.date.toString() : ""}` +
      `${this.place && this.place.toString() ? " in " + this.place.toString() : ""}`
  });

  if (this.qualifiers) {
    string += " " + this.qualifiers.map(q => q.toString()).join(" ");
  }

  return string;
}


// Qualifier

Qualifier.prototype.toString = function (): string {
  let string;
  switch (this.name) {
    case PersonFactQualifiers.Age:
      string = translationToString({
        en: `with ${this.value} years old`,
        de: `mit ${this.value} Jahren`
      });
      break;
    case PersonFactQualifiers.Cause:
      string = `(${this.value})`;
      break;
    default:
      string = this.name;
      if (this.value) {
        string += ": " + this.value;
      }
  }

  return string;
}


// PlaceRef

PlaceReference.prototype.toString = function (): string {
  if (!this.original) {
    return "";
  }

  return this.original;
}


// FamilyView

FamilyView.prototype.getParents = function () {
  return [this.getParent1(), this.getParent2()];
}

FamilyView.prototype.getMembers = function () {
  return this.getChildren().concat(this.getParents());
}

FamilyView.prototype.involvesPerson = function (person) {
  return !!this.getMembers().find(m => m.matches(person));
}

export default GedcomX;
