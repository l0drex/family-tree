import * as GedcomX from "gedcomx-js";
import {strings} from "../main";
import config from "../config";
import {
  baseUri,
  GenderTypes,
  NameTypes,
  PersonFactQualifiers,
  PersonFactTypes
} from "./gedcomx-enums";
import {Fact, FamilyView, Name, NameForm, Person, PlaceReference, Qualifier, Relationship} from "gedcomx-js";

// Person

export function getGeneration(person): number | undefined {
  let generationFacts = person.getFactsByType(PersonFactTypes.Generation);
  if (!generationFacts.length) {
    return undefined
  }
  return generationFacts[0].value
}

let referenceAge: {age: number, generation: number} = {
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

function extend(GedcomXExtend) {
  GedcomXExtend.Person.prototype.getFullName = function (this: Person): string {
    if (this.getNames().length < 1) {
      return "?";
    }

    let names = [
      this.getPreferredName(),
      this.getNames().filter(n => n.getLang() === config.browserLang)[0],
      this.getNames()[0]
    ];

    // first name that is defined
    let name: Name = names.find(n => n !== undefined);
    if (name.getNameForms().length === 0) {
      return "?";
    }
    // name form that matches language, or if none matches return the first without lang
    let nameForm: NameForm = name.getNameForms().find((nf: GedcomX.NameForm) => nf.getLang() === config.browserLang);
    nameForm ??= name.getNameForms().find((nf: GedcomX.NameForm) => nf.getLang() === "");
    nameForm ??= name.getNameForms()[0];
    return nameForm.getFullText(true);
  }

  GedcomXExtend.Person.prototype.getBirthName = function (this: Person): string {
    let name: Name = this.getNames().find(name => name.getType() && name.getType() === NameTypes.BirthName)
    if (name) {
      return name.getNameForms()[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  GedcomXExtend.Person.prototype.getMarriedName = function (this: Person): string {
    let name: Name = this.getNames().find(name => name.getType() && name.getType() === NameTypes.MarriedName)
    if (name) {
      return name.getNameForms()[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  GedcomXExtend.Person.prototype.getAlsoKnownAs = function (this: Person): string {
    let name: Name = this.getNames().find(name => name.getType() && name.getType() === NameTypes.AlsoKnownAs)
    if (name) {
      return name.getNameForms()[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  GedcomXExtend.Person.prototype.getNickname = function (this: Person): string {
    let name: Name = this.getNames().find(name => name.getType() && name.getType() === NameTypes.Nickname)
    if (name) {
      return name.getNameForms()[0].getFullText(true);
    } else {
      return undefined;
    }
  }

  /**
   * Calculates age today
   */
  GedcomXExtend.Person.prototype.getAgeToday = function (this: Person): number | undefined {
    let birth = this.getFactsByType(PersonFactTypes.Birth)[0];
    // exact calculation not possible without birthdate
    if (!birth || !birth.getDate() || !birth.getDate().toDateObject()) {
      // guess the age based on the generation number
      if (referenceAge.age !== undefined && getGeneration(this) !== undefined) {
        return (referenceAge.generation - getGeneration(this)) * 25 + referenceAge.age;
      }
      return undefined
    }

    let birthDate = birth.getDate().toDateObject();
    let lastDate = new Date();

    // subtraction returns milliseconds, have to convert to year
    return Math.floor((lastDate.getTime() - birthDate.getTime()) / 31536000000);
  }

  GedcomXExtend.Person.prototype.getLiving = function (this: Person): boolean {
    return this.getFactsByType(PersonFactTypes.Death).length === 0;
  }

  GedcomXExtend.Person.prototype.toString = function (this: Person): string {
    return `${this.getFullName()} (#${this.getId()})`;
  }

// Relationship

  GedcomXExtend.Relationship.prototype.getMembers = function (this: Relationship): GedcomX.ResourceReference[] {
    return [this.getPerson1(), this.getPerson2()]
  }

  GedcomXExtend.Relationship.prototype.toString = function (this: Relationship): string {
    let type = "Relationship";
    if (this.getType()) {
      type = this.getType().substring(baseUri.length);
    }
    return `${type} of ${this.getPerson1().getResource()} and ${this.getPerson2().getResource()}`
  }


// Date

  GedcomXExtend.Date.prototype.toDateObject = function (this: GedcomX.Date): Date {
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

  GedcomXExtend.Date.prototype.toString = function (this: GedcomX.Date): string {
    if (!this.getFormal() && this.getOriginal()) {
      return this.getOriginal();
    }

    let dateObject = this.toDateObject();
    if (!dateObject) {
      return "";
    }

    let options = {};
    options["year"] = "numeric";
    switch (this.getFormal().length) {
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
    if (this.getFormal().length >= 14) {
      options = {};
      options["hour"] = "2-digit";

      if (this.getFormal().length >= 17) {
        options["minute"] = "2-digit";
      }
      if (this.getFormal().length >= 20) {
        options["second"] = "2-digit";
      }
      time = dateObject.toLocaleTimeString(config.browserLang, options);
    }

    const length = this.getFormal().length;

    return `${strings.formatString(length >= 10 ? strings.gedcomX.day : (length >= 7 ? strings.gedcomX.month : strings.gedcomX.year), date)}
     ${time ? strings.formatString(strings.gedcomX.time, time) : ""}`;
  }


// Fact

  GedcomXExtend.Fact.prototype.toString = function (this: Fact): string {
    let string;
    let value = this.getValue();

    switch (this.getType()) {
      case PersonFactTypes.Birth:
        string = strings.gedcomX.born;
        break;
      case PersonFactTypes.Generation:
        string = strings.gedcomX.generation;
        break;
      case PersonFactTypes.MaritalStatus:
        string = "";
        switch (value) {
          case "single":
            value = strings.gedcomX.single;
            break;
          case "married":
            value = strings.gedcomX.married;
            break;
        }
        break;
      case PersonFactTypes.Religion:
        string = strings.gedcomX.religion;
        break;
      case PersonFactTypes.Occupation:
        string = strings.gedcomX.worksAs;
        break;
      case PersonFactTypes.Death:
        string = strings.gedcomX.died;
        break;
      default:
        string = this.getType();
        break;
    }

    string += (value || value === "0" ? ` ${value}` : "") +
      (this.getDate() !== undefined ? ` ${this.getDate().toString()}` : "") +
      (this.getPlace() && this.getPlace().toString() ? " " + strings.formatString(strings.gedcomX.place, this.getPlace().toString()) : "");

    if (this.getQualifiers() && this.getQualifiers().length > 0) {
      string += " " + this.getQualifiers().map(q => q.toString()).join(" ");
    }

    return string;
  }

  GedcomXExtend.Fact.prototype.getEmoji = function(this: Fact, gender?: string): string {
    const genderSpecifier = gender === GenderTypes.Female ? "♀" : (gender === GenderTypes.Male ? "♂" : "");
    switch (this.getType()) {
      case PersonFactTypes.Birth:
        return "👶";
      case PersonFactTypes.Generation:
        return "🌳";
      case PersonFactTypes.Religion:
        return `🧎‍${genderSpecifier}️`;
      case PersonFactTypes.MaritalStatus:
        return gender === GenderTypes.Female ? "👰‍♀️" : (gender === GenderTypes.Male ? "🤵‍♂️" : "🤵");
      case PersonFactTypes.Death:
        return "🪦";
      case PersonFactTypes.Occupation:
        return gender === GenderTypes.Male ? "👨‍💼" : (gender === GenderTypes.Female ? "👩‍💼" : "🧑‍💼");
      default:
        return "•";
    }
  }


// Qualifier

  GedcomXExtend.Qualifier.prototype.toString = function (this: Qualifier): string {
    let string;
    switch (this.getName()) {
      case PersonFactQualifiers.Age:
        string = strings.formatString(strings.gedcomX.ageQualifier, this.getValue());
        break;
      case PersonFactQualifiers.Cause:
        string = `(${this.getValue()})`;
        break;
      default:
        string = this.getName();
        if (this.getValue()) {
          string += ": " + this.getValue();
        }
    }

    return string;
  }


// PlaceRef

  GedcomXExtend.PlaceReference.prototype.toString = function (this: PlaceReference): string {
    if (!this.getOriginal()) {
      return "";
    }

    return this.getOriginal();
  }


// FamilyView

  GedcomXExtend.FamilyView.prototype.getParents = function (this: FamilyView) {
    return [this.getParent1(), this.getParent2()];
  }

  GedcomXExtend.FamilyView.prototype.getMembers = function (this: FamilyView) {
    return this.getChildren().concat(this.getParents());
  }

  GedcomXExtend.FamilyView.prototype.involvesPerson = function (this: FamilyView, person) {
    return !!this.getMembers().find(m => m.matches(person));
  }
}

GedcomX.enableRsExtensions();
GedcomX.addExtensions(extend);

export default GedcomX;
