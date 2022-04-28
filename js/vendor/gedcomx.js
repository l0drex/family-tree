import {config} from "../main.js";

const baseUri = "http://gedcomx.org/";

const genderTypes = {
  Male: baseUri + "Male",
  Female: baseUri + "Female",
  Intersex: baseUri + "Intersex",
  Unknown: baseUri + "Unknown"
}

const namePartTypes = {
  Prefix: baseUri + ("Prefix"),
  Suffix: baseUri + ("Suffix"),
  Given: baseUri + ("Given"),
  Surname: baseUri + ("Surname")
}

const nameTypes = {
  BirthName: baseUri + ("BirthName"),
  MarriedName: baseUri + ("MarriedName"),
  AlsoKnownAs: baseUri + ("AlsoKnownAs"),
  Nickname: baseUri + ("Nickname"),
  AdoptiveName: baseUri + ("AdoptiveName"),
  FormalName: baseUri + ("FormalName"),
  ReligiousName: baseUri + ("ReligiousName")
}

const personFactTypes = {
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

const personFactQualifiers = {
  Age: baseUri + "Age",
  Cause: baseUri + "Cause",
  Religion: baseUri + "Religion",
  Transport: baseUri + "Transport",
  NonConsensual: baseUri + "NonConsensual"
}

const relationshipTypes = {
  Couple: baseUri + ("Couple"),
  ParentChild: baseUri + ("ParentChild"),
  AncestorDescendant: baseUri + ("AncestorDescendant"),
  Godparent: baseUri + ("Godparent"),
  EnslavedBy: baseUri + "EnslavedBy"
}

const relationshipFactTypes = {
  Divorce: baseUri + ("Divorce"),
  Marriage: baseUri + ("Marriage")
}

let ageGen0;
const emptyFact = {date: {formal: ""}, place: {original: ""}, value: ""}

export class Person {
  gender;
  names;
  facts;
  id;
  isPrivate = false;

  constructor({id, gender = null, names = null, facts = null, isPrivate = false}) {
    if (!id.toString()) {
      throw TypeError("id is required!")
    }
    this.id = id;
    this.gender = gender;
    this.names = names;
    this.facts = facts;
    this.isPrivate = isPrivate;
  }

  get fullName() {
    return this.marriedName || this.names[0].nameForms[0].fullText;
  }

  get birthName() {
    return this.names.find(name => name.type && name.type === nameTypes.BirthName);
  }

  get marriedName() {
    return this.names.find(name => name.type && name.type === nameTypes.MarriedName);
  }

  get alsoKnownAs() {
    return this.names.find(name => name.type && name.type === nameTypes.AlsoKnownAs);
  }

  get nickname() {
    return this.names.find(name => name.type && name.type === nameTypes.Nickname);
  }

  get genderType() {
    return this.gender.type.substring(baseUri.length).toLowerCase()
  }

  get birth() {
    return this.#searchFact(personFactTypes.Birth) || emptyFact;
  }

  get death() {
    let deathFact = this.#searchFact(personFactTypes.Death);
    if (deathFact) {
      return deathFact
    }

    return emptyFact;
  }

  get isDead() {
    return (this.death !== emptyFact) || (this.age >= 120);
  }

  get generation() {
    let generationFact = this.#searchFact(personFactTypes.Generation);
    if (generationFact) {
      return generationFact.value;
    } else {
      return undefined;
    }
  }

  set generation(value) {
    if (this.generation) {
      console.assert(this.generation === value,
        `Generations dont match for ${this.fullName}: ${this.generation} <- ${value}`);
      return;
    }

    if (!ageGen0 && value === 0 && this.age) {
      ageGen0 = this.age;
    }

    this.facts.push({
      type: personFactTypes.Generation,
      value: value
    });
  }

  get age() {
    // exact calculation not possible without birthdate
    if (!this.birth || !this.birth.date || !this.birth.date.formal) {
      // guess the age based on the generation number
      if (ageGen0 && this.generation) {
        return this.generation * 25 + ageGen0;
      }
      return undefined
    }

    // TODO respect day
    let birthYear = this.birth.date.formal.substring(1, 5);
    let lastYear = new Date().getFullYear();
    if (this.death && this.death.date && this.death.date.formal) {
      lastYear = this.death.date.formal.substring(1, 5);
    }

    return lastYear - birthYear;
  }

  toGraphObject() {
    return {
      width: config.gridSize * 5,
      height: config.gridSize,
      type: "person",
      data: this
    }
  }

  get maritalStatus() {
    return this.#searchFact(personFactTypes.MaritalStatus);
  }

  get religion() {
    let fact = this.#searchFact(personFactTypes.religion);
    if (fact) {
      return fact.value;
    } else {
      return undefined;
    }
  }

  get occupation() {

  }

  /**
   * Returns the fact of specified type, if present.
   * @param type {string} member of Fact.types
   * @returns {Fact|null} fact
   */
  #searchFact(type) {
    return this.facts.find(fact => fact.type === type);
  }
}

/**
 * @see https://github.com/FamilySearch/gedcomx/blob/master/specifications/json-format-specification.md#22-the-relationship-data-type
 */
export class Relationship {
  type;
  person1;
  person2;
  facts;

  /**
   * @param type {string} URI identifying the type of the relationship.
   * @param person1 {ResourceReference} Reference to the first person in the relationship.
   * @param person2 {ResourceReference} Reference to the second person in the relationship.
   * @param facts {Array<Fact>} The facts about the relationship.
   */
  constructor({type = "", person1, person2, facts = []}) {
    if (!type in relationshipTypes) {
      throw TypeError("Unsupported relationship type!")
    }
    this.type = type;
    this.person1 = person1;
    this.person2 = person2;
    this.facts = facts;
  }

  get isParentChild() {
    return this.type === relationshipTypes.ParentChild;
  }

  get isCouple() {
    return this.type === relationshipTypes.Couple || this.#searchFact(relationshipFactTypes.Marriage);
  }

  get members() {
    return [this.person1.resource, this.person2.resource]
  }

  getOther(personId) {
    return this.members.find(p => p !== personId)
  }

  #searchFact(type) {
    return this.facts.find(fact => fact.type === type);
  }

  toGraphObject() {
    return {
      height: config.margin * 2,
      width: config.margin * 2,
      type: "family",
      data: this
    }
  }
}
