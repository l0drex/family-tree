import * as GedcomX from "gedcomx-js";
import "./gedcomx-js-rs";
import {Equals, strings} from "../main";
import {
  baseUri,
  EventRoleTypes,
  NamePartQualifier,
  NamePartTypes,
  PersonFactQualifiers,
  PersonFactTypes,
  TextTypes
} from "./gedcomx-enums";
import emojis from './emojies.json';
import {IConclusion, INameForm, INote, ISourceCitation, ITextValue} from "./gedcomx-types";

// like filterLang, but without entries that don't include a language
function filterPureLang(data: INote | ITextValue | ISourceCitation | IConclusion | INameForm) {
  return data.lang === strings.getLanguage();
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
    return super.getFacts().sort((a, b) => {
      // place birth at top, generation right below
      if (a.getType() === PersonFactTypes.Birth) {
        return -1;
      } else if (b.getType() === PersonFactTypes.Birth) {
        return 1;
      } else if (a.getType() === PersonFactTypes.GenerationNumber) {
        return -1;
      } else if (b.getType() === PersonFactTypes.GenerationNumber) {
        return 1;
      }

      if (a.getDate() && !b.getDate()) {
        return 1;
      } else if (!a.getDate() && b.getDate()) {
        return -1;
      }
      if (a.getDate() && b.getDate()) {
        let aDate = new GDate(a.date).toDateObject();
        let bDate = new GDate(b.date).toDateObject();
        if (aDate && bDate) {
          return aDate.getMilliseconds() - bDate.getMilliseconds();
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
    } else return formatJDate(dateObject, this.formal.length);
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

  return `${strings.formatString(length >= 10 ? strings.gedcomX.time.day : (length >= 7 ? strings.gedcomX.time.month : strings.gedcomX.time.year), date)}${time ? " " + strings.formatString(strings.gedcomX.time.time, time) : ""}`;
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
      case PersonFactQualifiers.Age:
        string = strings.formatString(strings.gedcomX.factQualifier.ageFormatter, this.value);
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
