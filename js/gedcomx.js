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

GedcomX.Person.prototype.getBirthName = function () {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.BirthName)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getMarriedName = function () {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.MarriedName)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getAlsoKnownAs = function () {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.AlsoKnownAs)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getNickname = function () {
  let name = this.getNames().find(name => name.type && name.type === nameTypes.Nickname)
  if (name) {
    return name.nameForms[0].fullText;
  } else {
    return undefined;
  }
}

GedcomX.Person.prototype.getFullName = function () {
  if (!this.names) {
    return "?";
  }
  return this.getNames()[0].nameForms[0].fullText;
}

GedcomX.Person.prototype.getGeneration = function () {
  let generationFact = this.getFactsByType(personFactTypes.Generation)[0];
  if (generationFact) {
    return generationFact.value;
  } else {
    return undefined;
  }
}
GedcomX.Person.prototype.setGeneration = function (value) {
  let generation = this.getGeneration();
  if (generation) {
    console.assert(generation === value,
      `Generations don't match for ${this.getFullName()}: ${generation} <- ${value}`);
    return;
  }

  if (!ageGen0 && value === 0 && this.getAge()) {
    ageGen0 = this.getAge();
  }

  this.addFact(GedcomX.Fact({
    type: personFactTypes.Generation,
    value: value
  }));
}

GedcomX.Person.prototype.getAge = function () {
  let birth = this.getFactsByType(personFactTypes.Birth)[0];
  // exact calculation not possible without birthdate
  if (!birth || !birth.date || !birth.date.toDateObject()) {
    // guess the age based on the generation number
    if (ageGen0 && this.getGeneration()) {
      return this.getGeneration() * 25 + ageGen0;
    }
    return undefined
  }

  let birthDate = birth.date.toDateObject();
  let lastDate = new Date();
  let death = this.getFactsByType(personFactTypes.Death)[0]
  if (death && death.date && death.date.toDateObject()) {
    lastYear = death.date.toDateObject();
  }

  // subtraction returns milliseconds, have to convert to year
  let age = Math.floor((lastDate - birthDate) / 31536000000);
  if (age < 120) {
    return age;
  }
  return 120;
}

GedcomX.Person.prototype.getGender = function () {
  if (this.gender.type) {
    return this.gender;
  }

  return {type: genderTypes.Unknown};
}


GedcomX.Relationship.prototype.isParentChild = function () {
  return this.getType() === relationshipTypes.ParentChild;
}

GedcomX.Relationship.prototype.isCouple = function () {
  return this.getType() === relationshipTypes.Couple || this.getFactsByType(relationshipFactTypes.Marriage);
}

GedcomX.Relationship.prototype.getMembers = function () {
  return [this.getPerson1(), this.getPerson2()]
}

GedcomX.Relationship.prototype.marriage = function () {
  return this.getFactsByType(relationshipFactTypes.Marriage);
}

GedcomX.Relationship.prototype.getFactsByType = function (type) {
  return this.getFacts().find(fact => fact.type === type);
}

GedcomX.Relationship.prototype.toString = function () {
  let type = "Relationship";
  if (this.type) {
    type = this.getType().substring(baseUri.length);
  }
  return `${type} of ${this.getPerson1().resource} and ${this.getPerson2().resource}`
}


GedcomX.Date.prototype.toDateObject = function () {
  if (!this.getFormal()) {
    return undefined;
  }

  let year = this.formal.substring(1, 5);
  if (!year) {
    return undefined;
  }
  let month = this.formal.substring(6, 8);
  let day = this.formal.substring(9, 11);
  let hour = this.formal.substring(12, 14);
  let minute = this.formal.substring(15, 17);
  let second = this.formal.substring(18, 20);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

GedcomX.Date.prototype.toString = function () {
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
