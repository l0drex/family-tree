import * as GedcomX from "gedcomx-js";
import "./gedcomx-js-rs";
import {Equals, filterLang, strings} from "../main";
import {
  baseUri, DocumentTypes, KnownResourceTypes,
  NameTypes,
  PersonFactQualifiers,
  PersonFactTypes, TextTypes
} from "./gedcomx-enums";
import * as factEmojis from './factEmojies.json';
import {
  INote, ITextValue, ISourceCitation, INameForm, IConclusion
} from "./gedcomx-types";

export class Person extends GedcomX.Person {
  get generation(): undefined | number {
    if (!this.facts) return undefined;
    let generationFacts = this.facts.filter(f => f.type === PersonFactTypes.GenerationNumber);
    if (!generationFacts.length) {
      return undefined
    }
    return parseInt(generationFacts[0].value)
  }

  get isLiving(): boolean {
    if (super.getLiving() !== undefined) return super.getLiving();

    return this.getFactsByType(PersonFactTypes.Death).length === 0;
  }

  get preferredName() {
    return this.names.find(n => n.preferred);
  }

  get fullName(): string {
    if (!this.names || this.names.length < 1) {
      return "?";
    }

    // like filterLang, but without entries that don't include a language
    let filterPureLang = (data: INote | ITextValue | ISourceCitation | IConclusion | INameForm) =>
      data.lang === strings.getLanguage();

    let names = [
      this.preferredName,
      this.names.filter(filterPureLang)[0],
      this.names[0]
    ];

    // first name that is defined
    let name = names.find(n => n !== undefined);
    if (!name || name.nameForms.length === 0) {
      return "?";
    }
    // name form that matches language, or if none matches return the first without lang
    let nameForm = name.nameForms.find(filterPureLang) ?? name.nameForms[0];
    return nameForm.getFullText(true);
  }

  get birthName() {
    let name = this.names.filter(filterLang).find(name => name.type && name.type === NameTypes.BirthName)
    if (name) {
      return name.nameForms.filter(filterLang)[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  get marriedName() {
    let name = this.names.filter(filterLang).find(name => name.type && name.type === NameTypes.MarriedName)
    if (name) {
      return name.nameForms.filter(filterLang)[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  get alsoKnownAs() {
    let name = this.names.filter(filterLang).find(name => name.type && name.type === NameTypes.AlsoKnownAs)
    if (name) {
      return name.nameForms.filter(filterLang)[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  get nickname() {
    let name = this.names.filter(filterLang).find(name => name.type && name.type === NameTypes.Nickname)
    if (name) {
      return name.nameForms.filter(filterLang)[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  getAgeAt(date: Date) {
    let birth = this.getFactsByType(PersonFactTypes.Birth)[0];
    // exact calculation not possible without birthdate
    if (!birth || !birth.date || !birth.date.getFormal()) {
      // guess the age based on the generation number
      if (referenceAge.age !== undefined && this.generation !== undefined) {
        return (referenceAge.generation - this.generation) * 25 + referenceAge.age;
      }
      return undefined
    }

    let birthGDate = new GDate(birth.date);
    let birthDate = birthGDate.toDateObject();

    // subtraction returns milliseconds, have to convert to year
    return Math.floor((date.getTime() - birthDate.getTime()) / 31536000000);
  }

  isExtracted(): boolean {
    return Boolean(this.extracted);
  }

  setFacts(facts: Fact[] | object[]): Person {
    if (!facts) return this;

    facts = facts.map(f => f instanceof Fact ? f : new Fact(f));
    super.setFacts(facts);
    return this;
  }

  getFacts(): Fact[] {
    return super.getFacts() as Fact[];
  }

  getFactsByType(type: string): Fact[] {
    return super.getFactsByType(type) as Fact[];
  }

  toString() {
    return `${this.fullName} (#${this.id})`;
  }
}

export class Relationship extends GedcomX.Relationship {
  get members() {
    return [this.getPerson1(), this.getPerson2()]
  }

  toString() {
    let type = "Relationship";
    if (this.type) {
      type = this.type.substring(baseUri.length);
    }
    return `${type} of ${this.person1.resource} and ${this.person2.resource}`
  }
}

export class GDate extends GedcomX.Date {
  toDateObject() {
    let dateString = this.formal;
    if (!dateString) {
      return undefined;
    }

    // TODO does not respect timezones yet
    if (dateString.length > 11) {
      if (dateString.length <= 14) {
        // add minutes if only hour is given to prevent undefined return
        dateString += ":00"
      }
      if (!dateString.endsWith("Z")) dateString += "Z";
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

  toString() {
    if (!this.formal) {
      if (this.original) return this.original;
      else return "";
    }

    let dateObject = this.toDateObject();
    if (!dateObject) {
      return this.formal;
    }
    else return formatJDate(dateObject, this.formal.length);
  }
}

export function formatJDate(dateObject: Date, length: number) {
  let options = {};
  options["year"] = "numeric";
  switch (length) {
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
  let date = dateObject.toLocaleDateString(strings.getLanguage(), options);

  let time = "";
  if (length >= 14) {
    options = {};
    options["hour"] = "2-digit";

    if (length >= 17) {
      options["minute"] = "2-digit";
    }
    if (length >= 20) {
      options["second"] = "2-digit";
    }
    time = dateObject.toLocaleTimeString(strings.getLanguage(), options);
  }

  return `${strings.formatString(length >= 10 ? strings.gedcomX.day : (length >= 7 ? strings.gedcomX.month : strings.gedcomX.year), date)}${time ? " " + strings.formatString(strings.gedcomX.time, time) : ""}`;
}

export class Fact extends GedcomX.Fact {
  setDate(date: GedcomX.Date | object): Fact {
    if (date && !(date instanceof GDate)) date = new GDate(date);
    super.setDate(date);
    return this;
  }

  getDate(): GDate {
    return super.getDate() as GDate;
  }

  setPlace(place: GedcomX.PlaceReference | object): Fact {
    if (place && !(place instanceof PlaceReference)) place = new PlaceReference(place);
    super.setPlace(place);
    return this;
  }

  setQualifiers(qualifiers: Qualifier[] | object[]): Fact {
    qualifiers ??= [];
    super.setQualifiers(qualifiers.map(q => new Qualifier(q)));
    return this;
  }

  toString(): string {
    let value = this.value;
    const type = this.type;
    let string = strings.gedcomX.types.fact.person[type.substring(baseUri.length)] ?? type;

    if (type === PersonFactTypes.MaritalStatus && value in strings.gedcomX.maritalStatus) {
      value = strings.gedcomX.maritalStatus[value];
    }

    string += ((value || value === "0") ? `: ${value}` : "");
    string += (this.date ? ` ${this.date}` : "") +
      (this.place ? " " + strings.formatString(strings.gedcomX.place, this.place.toString()) : "");

    if (this.qualifiers && this.qualifiers.length > 0) {
      string += " " + this.qualifiers.map(q => q.toString()).join(" ");
    }

    return string;
  }

  get emoji(): string {
    const type = this.type.substring(baseUri.length);
    if (type in factEmojis) {
      return factEmojis[type];
    }
    return "•";
  }
}

class Qualifier extends GedcomX.Qualifier {
  toString() {
    let string;
    switch (this.name) {
      case PersonFactQualifiers.Age:
        string = strings.formatString(strings.gedcomX.ageQualifier, this.value);
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
}

class PlaceReference extends GedcomX.PlaceReference {
  toString() {
    if (!this.original) {
      return "";
    }

    return this.original;
  }
}

export class FamilyView extends GedcomX.FamilyView implements Equals {
  get parents() {
    return [this.parent1, this.parent2];
  }

  get members() {
    return this.children.concat(this.parents);
  }

  involvesPerson(person: GedcomX.Person) {
    return !!this.members.find(m => m.matches(person));
  }

  equals(family: GedcomX.FamilyView) {
    let parentResources = this.parents.map(p => p.resource);
    let parentEqual = parentResources.includes(family.parent1.resource) &&
      parentResources.includes(family.parent2.resource);
    return parentEqual;
  }
}

export class SourceDescription extends GedcomX.SourceDescription {
  get title() {
    if (this.getTitles().length > 0) return this.getTitles()[0].value;
    return this.getCitations()[0].getValue();
  }

  get emoji() {
    switch (this.getResourceType()) {
      case KnownResourceTypes.Collection:
        return "📚";
      case KnownResourceTypes.PhysicalArtifact:
        return "📖";
      case KnownResourceTypes.DigitalArtifact:
        return "💿";
      case KnownResourceTypes.Record:
        return "📜";
    }

    return "📖";
  }
}

export class Document extends GedcomX.Document {
  get isPlainText() {
    // return true if text type is plain or undefined
    return !this.getTextType() || this.getTextType() === TextTypes.Plain;
  }

  get isExtracted(): boolean {
    return Boolean(this.extracted);
  }

  // todo get attribution from containing data set

  get emoji(): string {
    switch (this.getType()) {
      case DocumentTypes.Abstract:
        return "📄";
      case DocumentTypes.Transcription:
        return "📝";
      case DocumentTypes.Translation:
        return "🌍";
      case DocumentTypes.Analysis:
        return "🔍";
      default:
        return "📄";
    }
  }
}

export class Agent extends GedcomX.Agent {
  get name(): string {
    if (!this.names || this.names.length === 0) return undefined;
    return this.names[0].value;
  }
}

export class PlaceDescription extends GedcomX.PlaceDescription {
 isExtracted(): boolean {
   return Boolean(this.extracted);
 }
}

let referenceAge: { age: number, generation: number } = {
  age: undefined,
  generation: undefined
};

export function setReferenceAge(age: number, generation: number, forceUpdate = false) {
  if (forceUpdate) {
    referenceAge = {age: age, generation: generation};
    return;
  }
  if (referenceAge.age === undefined && age !== undefined) {
    referenceAge.age = age;
  }
  if (referenceAge.generation === undefined && generation !== undefined) {
    referenceAge.generation = generation;
  }
}
