import * as GedcomX from "gedcomx-js";
import "./gedcomx-js-rs";
import { Equals, strings } from "../main";
import {
  baseUri,
  EventRoleTypes,
  FactQualifier,
  NamePartQualifier,
  NamePartTypes,
  PersonFactTypes,
  TextTypes
} from "./types";
import emojis from '../backend/emojies.json';
import { IConclusion, INameForm, INote, ISourceCitation, ITextValue } from "./interfaces";
import GedcomXDate, { Range, Recurring, Simple } from "gedcomx-date";
import { DateTime } from "luxon";

// like filterLang, but without entries that don't include a language
function filterPureLang(data: INote | ITextValue | ISourceCitation | IConclusion | INameForm) {
  return data.lang === strings.getLanguage();
}

export class Root extends GedcomX.Root {
  get hasData(): boolean {
    return Boolean(this.id || this.description || this.attribution);
  }
}

export class Person extends GedcomX.Person {
  get isPrivate(): boolean {
    return Boolean(this.getPrivate());
  }

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
    if (!this.names || this.names.length < 1) {
      return undefined;
    }

    let preferred = this.names.find(n => n.preferred);
    if (preferred) return preferred;

    preferred = this.names.filter(filterPureLang)[0];
    if (preferred) return preferred;

    return this.names[0];
  }

  get fullName(): string {
    let name = this.preferredName;

    if (!name || name.nameForms.length === 0)
      return "?";

    // name form that matches language, or if none matches return the first without lang
    let nameForm = name.nameForms.find(filterPureLang) ?? name.nameForms[0];
    return nameForm.getFullText(true);
  }

  get surname(): string | undefined {
    let name = this.preferredName;
    if (name && name.nameForms.length > 0) {
      let nameForm = name.nameForms.find(filterPureLang) ?? name.nameForms[0];
      if (nameForm.parts) {
        let surnameParts = nameForm.parts.filter(n => n.type === NamePartTypes.Surname);

        if (surnameParts.length > 0) {
          let surname = surnameParts.find(n =>
            n.qualifiers?.find(q => q.name === NamePartQualifier.Primary)) ?? surnameParts[0];

          if (surname && surname.value)
            return surname.value;
        }
      }
    }

    let hackySurname = this.fullName.split(" ").reverse()[0];
    if (hackySurname === "?") return undefined;
    return hackySurname;
  }

  get firstName(): string | undefined {
    // name with qualifier first
    let name = this.preferredName;
    if (name && name.nameForms.length > 0) {
      let nameForm = name.nameForms.find(filterPureLang) ?? name.nameForms[0];
      if (nameForm.parts) {
        let givenParts = nameForm.parts.filter(n => n.type === NamePartTypes.Given);

        if (givenParts.length > 0) {
          let given = givenParts.find(n =>
            n.qualifiers?.find(q => q.name === NamePartQualifier.Primary)) ?? givenParts[0];

          if (given && given.value)
            return given.value;
        }
      }
    }

    let hackySurname = this.fullName.split(" ")[0];
    if (hackySurname === "?") return undefined;
    return hackySurname;
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
    return Math.floor((date.getTime() - birthDate.valueOf()) / 31536000000);
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
    return super.getFacts().sort((a, b) => {
      // place birth at top, generation right below
      if (a.getType() === PersonFactTypes.Birth) {
        return -1;
      } else if (b.getType() === PersonFactTypes.Birth) {
        return 1;
      }

      if (a.getDate() && !b.getDate()) {
        return 1;
      } else if (!a.getDate() && b.getDate()) {
        return -1;
      }
      if (a.getDate() && b.getDate()) {
        // todo sort by non-simple dates via start date
        try {
          let aDate = new GDate(a.date).toDateObject();
          let bDate = new GDate(b.date).toDateObject();
          if (aDate && bDate) {
            return aDate.valueOf() - bDate.valueOf();
          }
        } catch (e) {
          if (!(e instanceof TypeError))
            throw e;
        }
      }

      return 0;
    }) as Fact[];
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
    if (!this.formal) {
      return undefined;
    }

    let parsedDate;
    try {
      parsedDate = GedcomXDate(this.formal);
    } catch (e) {
      console.error("Error while parsing formal date:", this.formal);
      throw e;
    }
    if (parsedDate.getType() === "single") {
      parsedDate = parsedDate as Simple;
      return simpleToJsDate(parsedDate);
    } else {
      throw TypeError(`Wanted to parse non-simple date to javascript date: ${this.formal}`);
    }
  }

  toString() {
    if (!this.formal) {
      if (this.original)
        return this.original;
      else
        return "";
    }

    let dateObject = GedcomXDate(this.formal);
    if (!dateObject) {
      return this.formal;
    }

    switch (dateObject.getType()) {
      case "single":
        return simpleToString(dateObject as Simple);
      case "range":
        return rangeToString(dateObject as Range);
      case "recurring": {
        dateObject = dateObject as Recurring;
        let string = rangeToString(dateObject);
        string = strings.formatString(strings.gedcomX.date.recurring, dateObject.getCount().toString(), string) as string;

        return string;
      }
    }
  }
}

function rangeToString(dateObject: Range | Recurring): string {
  let start = simpleToString(dateObject.getStart());
  let end = simpleToString(dateObject.getEnd());

  let string = "";
  if (start)
    string += strings.formatString(strings.gedcomX.date.rangeStart, start);
  if (end)
    string = (string ? string + " " : "") + strings.formatString(strings.gedcomX.date.rangeEndDate, end);

  if (dateObject.isApproximate())
    string = strings.formatString(strings.gedcomX.date.approximate, string) as string;

  return string;
}

function simpleToString(dateObject: Simple): string {
  if (!dateObject)
    return "";

  let jsDate = simpleToJsDate(dateObject);
  let string = jsDate.setLocale(strings.getLanguage()).toLocaleString(getDateFormatOptions(dateObject));

  if (dateObject.isApproximate())
    string = strings.formatString(strings.gedcomX.date.approximate, string) as string;

  return string;
}

export function simpleToJsDate(parsedDate: Simple): DateTime {
  if (!parsedDate)
    return undefined;

  let isoString = toFormalString(parsedDate);
  // remove approximate tag
  if (parsedDate.isApproximate())
    isoString = isoString.substring(1);

  // iso doesn't allow signs when the year is only 4 digits long
  isoString = isoString.substring(1);

  let date = DateTime.fromISO(isoString);
  // deal with negative years
  if (parsedDate.getYear() < 0) {
    date = date.set({year: parsedDate.getYear()})
  }

  if (date.toString() === "Invalid DateTime") {
    console.warn("error while formatting date", date, isoString, parsedDate);
  }

  return date;
}

export function getDateFormatOptions(date: Simple) {
  let options: Intl.DateTimeFormatOptions = {
    "year": "numeric"
  };
  if (date.getMonth())
    options.month = "long";

  if (date.getDay()) {
    options.month = "2-digit";
    options.day = "2-digit";
  }

  if (date.getHours())
    options.hour = "2-digit";

  if (date.getMinutes())
    options.minute = "2-digit";

  if (date.getSeconds())
    options.second = "2-digit";

  return options;
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

  get localType(): string {
    const originalType = this.type.substring(baseUri.length);
    return strings.gedcomX.person.factTypes[originalType]
      ?? strings.gedcomX.relationship.factTypes.Couple[originalType]
      ?? strings.gedcomX.relationship.factTypes.ParentChild[originalType]
      ?? originalType;
  }

  get emoji(): string {
    if (this.type) {
      let emoji = emojis.fact[this.type.substring(baseUri.length)];
      if (emoji) return emoji;
    }

    return emojis.fact.default;
  }
}

class Qualifier extends GedcomX.Qualifier {
  toString() {
    let string;
    switch (this.name) {
      case FactQualifier.Age:
        string = strings.formatString(strings.gedcomX.factQualifier.ageFormatter, this.value);
        break;
      case FactQualifier.Cause:
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
    return [this.parent1, this.parent2].filter(p => p !== undefined);
  }

  get members() {
    return (this.children ?? []).concat(this.parents);
  }

  involvesPerson(person: GedcomX.Person) {
    return !!this.members.find(m => m.matches(person));
  }

  equals(family: GedcomX.FamilyView) {
    let parentResources = this.parents.map(p => p.resource);
    return parentResources.includes(family.parent1.resource) &&
      parentResources.includes(family.parent2.resource);
  }
}

export class SourceDescription extends GedcomX.SourceDescription {
  get title() {
    if (this.getTitles().length > 0) return this.getTitles()[0].value;
    return this.getCitations()[0].getValue();
  }

  get emoji() {
    let emoji = emojis.source[this.getResourceType()?.substring(baseUri.length)];
    if (emoji) return emoji;

    return emojis.source.default;
  }
}

export class Document extends GedcomX.Document {
  get isPlainText() {
    // return true if text type is plain or undefined
    return !this.getTextType() || this.getTextType() === TextTypes.Plain;
  }

  get isXHTML() {
    return this.getTextType() === TextTypes.XHtml;
  }

  get isExtracted(): boolean {
    return Boolean(this.extracted);
  }

  // todo get attribution from containing data set

  get emoji(): string {
    let emoji = emojis.document[this.getType()?.substring(baseUri.length)];
    if (emoji) return emoji;

    return emojis.document.default;
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

export class EventExtended extends GedcomX.Event {
  get emoji() {
    if (this.type) {
      let emoji = emojis.event[this.type.substring(baseUri.length)];
      if (emoji) return emoji;
    }

    return emojis.event.default;
  }

  get title() {
    if (this.type)
      return strings.gedcomX.event.types[this.type.substring(baseUri.length)]
        + (this.principal ? `: ${this.principal.resource}` : "");

    return strings.gedcomX.event.event;
  }

  get principal() {
    return this.roles.find(r => r.type === EventRoleTypes.Principal)?.person;
  }

  getDate(): GDate {
    if (!this.date)
      return undefined;

    return new GDate(this.date.toJSON());
  }

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

function toFormalString(simple: Simple): string {
  let formalString = simple.toFormalString();

  if (formalString.endsWith("Z")){
    // remove the z, will be added in the next step if applicable
    formalString = formalString.substring(0, formalString.length - 1);

    if (simple.getHours() && (simple.getTZHours() !== 0 || simple.getTZMinutes() !== 0)) {
      formalString += getOffset(simple);
    }
  }

  return formalString;
}

export function getOffset(date: Simple): string {
  let hours = date.getTZHours() ?? 0;
  let minutes = date.getTZMinutes();

  if (date.getTZHours() === 0 && date.getTZMinutes() === 0) return DateTime.local().toFormat("ZZ")

  let offset = (hours >= 0 ? "+" : "-") + Math.abs(hours).toString().padStart(2, "0");

  if (minutes != null) {
    offset += ':' + Math.abs(minutes).toString().padStart(2, "0");
  }

  return offset;
}
