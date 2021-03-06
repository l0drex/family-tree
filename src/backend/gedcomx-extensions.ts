import * as GedcomX from "gedcomx-js";
import {translationToString} from "../main";
import config from "../config";
import {
  Fact, FamilyView, NameForm,
  Person,
  PlaceReference,
  Qualifier, Relationship
} from "gedcomx-js";
import {GraphFamily, GraphPerson} from "./graph";

GedcomX.enableRsExtensions();

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

export function getGeneration(person): number | undefined {
  let generationFacts = person.getFactsByType(PersonFactTypes.Generation);
  if (!generationFacts.length) {
    return undefined
  }
  return generationFacts[0].value
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
  if (this.getNames().length < 1) {
    return "?";
  }

  let names = [
    this.getPreferredName(),
    this.getNames().filter(n => n.getLang() === config.browserLang)[0],
    this.getNames()[0]
  ];

  // first name that is defined
  let name = names.find(n => n !== undefined);
  if (name.getNameForms().length === 0) {
    return "?";
  }
  // name form that matches language, or if none matches return the first without lang
  let nameForm = name.getNameForms().find((nf: NameForm) => nf.getLang() === config.browserLang);
  nameForm ??= name.getNameForms().find((nf: NameForm) => nf.getLang() === "");
  nameForm ??= name.getNameForms()[0];
  return nameForm.getFullText(true);
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
  if (this.getFactsByType(PersonFactTypes.Death).length > 0) {
    return false;
  }
  if (this.getAgeToday() === undefined) {
    return true;
  }
  return this.getAgeToday() < 120
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
  let dateString = this.getFormal();
  if (!dateString || !isNaN(Number(dateString.substring(0, 1)))) {
    return undefined;
  }

  // TODO does not respect timezones yet
  if (dateString.length > 11) {
    if (dateString.length <= 14) {
      // add minutes if only hour is given to prevent undefined return
      dateString += ":00"
    }
    dateString += "Z";
  }
  if (dateString[0] === "+") {
    // should be ok, but isn't
    dateString = dateString.substring(1)
  }

  let date = new Date(dateString);
  if (date.toString() === "Invalid Date") {
    console.error("Invalid Date", dateString)
    return undefined;
  }
  return date;
}

GedcomX.Date.prototype.toString = function (): string {
  if (!this.formal && this.original) {
    return this.original;
  }

  let dateObject = this.toDateObject();
  if (!dateObject) {
    return "";
  }

  let options = {};
  options["year"] = "numeric";
  switch (this.formal.length) {
    case 5:
      break;
    case 8:
      // year and month are known
      options["month"] = "long";
      break;
    default:
      // full date is known
      options["month"] = "2-digit";
      options["day"] = "2-digit";
      break;
  }
  let date = dateObject.toLocaleDateString(config.browserLang, options);

  let time = "";
  if (this.formal.length >= 14) {
    options = {};
    options["hour"] = "2-digit";

    if (this.formal.length >= 17) {
      options["minute"] = "2-digit";
    }
    if (this.formal.length >= 20) {
      options["second"] = "2-digit";
    }
    time = dateObject.toLocaleTimeString(config.browserLang, options);
  }

  return translationToString({
    en: `${this.formal.length >= 11 ? "on" : "in"} ${date}${time ? " at " + time : ""}`,
    de: `${this.formal.length >= 11 ? "am" : "in"} ${date}${time ? " um " + time : ""}`
  })
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
    en: (value || value === 0 ? ` ${value}` : "") +
      (this.getDate() !== undefined ? ` ${this.getDate().toString()}` : "") +
      (this.place && this.place.toString() ? ` in ${this.place.toString()}` : ""),

    de: (value || value === 0 ? " " + value : "") +
      (this.getDate() !== undefined ? ` ${this.getDate().toString()}` : "") +
      (this.place && this.place.toString() ? " in " + this.place.toString() : "")
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
