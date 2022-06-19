import * as GedcomX from "gedcomx-js";
import {translationToString} from "../main";

export const baseUri = "http://gedcomx.org/";

GedcomX.enableRsExtensions();

export const genderTypes = {
  Male: baseUri + "Male",
  Female: baseUri + "Female",
  Intersex: baseUri + "Intersex",
  Unknown: baseUri + "Unknown"
}

export const namePartTypes = {
  Prefix: baseUri + ("Prefix"),
  Suffix: baseUri + ("Suffix"),
  Given: baseUri + ("Given"),
  Surname: baseUri + ("Surname")
}

export const nameTypes = {
  BirthName: baseUri + ("BirthName"),
  MarriedName: baseUri + ("MarriedName"),
  AlsoKnownAs: baseUri + ("AlsoKnownAs"),
  Nickname: baseUri + ("Nickname"),
  AdoptiveName: baseUri + ("AdoptiveName"),
  FormalName: baseUri + ("FormalName"),
  ReligiousName: baseUri + ("ReligiousName")
}

export const personFactTypes = {
  Adoption: baseUri + "Adoption",
  Birth: baseUri + "Birth",
  Burial: baseUri + "Burial",
  Christening: baseUri + "Christening",
  Death: baseUri + "Death",
  Residence: baseUri + "Residence",
  Religion: baseUri + "Religion",
  Occupation: baseUri + "Occupation",
  MaritalStatus: baseUri + "MaritalStatus",
  Generation: baseUri + "GenerationNumber"
}

export const personFactQualifiers = {
  Age: baseUri + "Age",
  Cause: baseUri + "Cause",
  Religion: baseUri + "Religion",
  Transport: baseUri + "Transport",
  NonConsensual: baseUri + "NonConsensual"
}

export const relationshipTypes = {
  Couple: baseUri + ("Couple"),
  ParentChild: baseUri + ("ParentChild"),
  AncestorDescendant: baseUri + ("AncestorDescendant"),
  Godparent: baseUri + ("Godparent"),
  EnslavedBy: baseUri + "EnslavedBy"
}

export const relationshipFactTypes = {
  Divorce: baseUri + ("Divorce"),
  Marriage: baseUri + ("Marriage")
}


// Person

GedcomX.Person.prototype.getBirthName = function (): string {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.BirthName)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getMarriedName = function (): string {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.MarriedName)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getAlsoKnownAs = function (): string {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.AlsoKnownAs)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getNickname = function (): string {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.Nickname)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getFullName = function (): string {
  if (!this.names) {
    return "?";
  }
  return this.getNames()[0].nameForms[0].fullText;
}

GedcomX.Person.prototype.getGeneration = function (): number {
  let generationFacts = this.getFactsByType(personFactTypes.Generation);
  if (!generationFacts.length) {
    return
  }
  return generationFacts[0].value
}

let referenceAge = {
  age: undefined,
  generation: undefined
};
export function setReferenceAge(age: number, generation: number) {
  referenceAge.age = age;
  referenceAge.generation = generation;
}

GedcomX.Person.prototype.getAge = function (): number | undefined {
  let birth = this.getFactsByType(personFactTypes.Birth)[0];
  // exact calculation not possible without birthdate
  if (!birth || !birth.date || !birth.date.toDateObject()) {
    // guess the age based on the generation number
    if (referenceAge.age && this.getGeneration()) {
      return (referenceAge.generation - this.getGeneration()) * 25 + referenceAge.age;
    }
    return undefined
  }

  let birthDate = birth.date.toDateObject();
  let lastDate = new Date();
  let death = this.getFactsByType(personFactTypes.Death)[0]
  if (death && death.date && death.date.toDateObject()) {
    lastDate = death.date.toDateObject();
  }

  // subtraction returns milliseconds, have to convert to year
  return Math.floor((lastDate.getTime() - birthDate.getTime()) / 31536000000);
}

GedcomX.Person.prototype.getGender = function (): string {
  let gender = {type: genderTypes.Unknown};
  if (this.gender.type) {
    gender = this.gender;
  }

  return gender.type.substring(baseUri.length).toLowerCase();
}

GedcomX.Person.prototype.isDead = function (): boolean {
  return this.getFactsByType(personFactTypes.Death).length > 0 || this.getAge() >= 120
}


// Relationship

GedcomX.Relationship.prototype.isParentChild = function (): boolean {
  return this.getType() === relationshipTypes.ParentChild;
}

GedcomX.Relationship.prototype.isCouple = function (): boolean {
  return this.getType() === relationshipTypes.Couple || this.getFactsByType(relationshipFactTypes.Marriage);
}

GedcomX.Relationship.prototype.getMembers = function (): GedcomX.ResourceReference[] {
  return [this.getPerson1(), this.getPerson2()]
}

GedcomX.Relationship.prototype.marriage = function (): GedcomX.Fact {
  return this.getFactsByType(relationshipFactTypes.Marriage);
}

GedcomX.Relationship.prototype.getFactsByType = function (type): GedcomX.Fact {
  return this.getFacts().find(fact => fact.type === type);
}

GedcomX.Relationship.prototype.toString = function (): string {
  let type = "Relationship";
  if (this.type) {
    type = this.getType().substring(baseUri.length);
  }
  return `${type} of ${this.getPerson1().resource} and ${this.getPerson2().resource}`
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

GedcomX.Fact.prototype.toString = function (): string {
  let string;
  switch (this.type) {
    case personFactTypes.Birth:
      string = translationToString({
        en: "born",
        de: "geboren"
      });
      break;
    case personFactTypes.Generation:
      string = translationToString({
        en: "Generation",
        de: "Generation"
      });
      break;
    case personFactTypes.MaritalStatus:
      string = translationToString({
        en: "",
        de: ""
      });
      break;
    case personFactTypes.Religion:
      string = translationToString({
        en: "Religion:",
        de: "Religion:"
      })
      break;
    case personFactTypes.Occupation:
      string = translationToString({
        en: "works as",
        de: "arbeitet als"
      })
      break;
    case personFactTypes.Death:
      string = translationToString({
        en: "died",
        de: "verstorben"
      });
      break;
    default:
      string = this.type;
      break;
  }

  let value = this.value;
  if (this.type === personFactTypes.MaritalStatus) {
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

GedcomX.Qualifier.prototype.toString = function (): string {
  let string;
  switch (this.name) {
    case personFactQualifiers.Age:
      string = translationToString({
        en: `with ${this.value} years old`,
        de: `mit ${this.value} Jahren`
      });
      break;
    case personFactQualifiers.Cause:
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

GedcomX.PlaceReference.prototype.toString = function (): string {
  if (!this.original) {
    return "";
  }

  return this.original;
}

export default GedcomX;
