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
  MaritalStatus: baseUri + "MaritalStatus"
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


export class Person {
  gender;
  names;
  facts;
  id;
  isPrivate = false;

  constructor({id, gender = null, names = null, facts = null, isPrivate = false}) {
    if (!id) {
      throw TypeError("id is required!")
    }
    this.id = id;
    this.gender = gender;
    this.names = names;
    this.facts = facts;
    this.isPrivate = isPrivate;
  }

  get isDead() {
    return Boolean(this.#searchFact(Fact.types.Death))
  }

  get maritalStatus() {
    let status = this.#searchFact(Fact.types.MaritalStatus);
    if (!status) {
      return undefined;
    }
    return status.value;
  }

  set maritalStatus(status) {
    let fact = this.#searchFact(Fact.types.MaritalStatus);
    if (!fact) {
      fact = new Fact(Fact.types.MaritalStatus, undefined, undefined, status);
    }
  }

  get name() {
    return this.names[0].fullText;
  }

  /**
   * Returns the fact of specified type, if present.
   * @param type {string} member of Fact.types
   * @returns {Fact|null} fact
   */
  #searchFact(type) {
    this.facts.forEach(fact => {
      if (fact.type === type) {
        return fact;
      }
    });

    return null;
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
}
