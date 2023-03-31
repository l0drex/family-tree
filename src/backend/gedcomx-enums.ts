// noinspection JSUnusedGlobalSymbols

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

// not part of gedcomx spec
export enum OccupationCategories {
  Doctor = "Doctor",
  Student = "Student",
  Teacher = "Teacher",
  Judge = "Judge",
  Farmer = "Farmer",
  Cook = "Cook",
  Mechanic = "Mechanic",
  FactoryWorker = "Factory Worker",
  OfficeWorker = "Office Worker",
  Scientist = "Scientist",
  ITExpert = "IT Expert",
  Singer = "Singer",
  Artist = "Artist",
  Pilot = "Pilot",
  Astronaut = "Astronaut",
  Firefighter = "Firefighter",
  Policeman = "Policeman",
  Detective = "Detective",
  SecurityGuard = "SecurityGuard",
  Ninja = "Ninja",
  ConstructionWorker = "ConstructionWorker",
  King = "King"
}

export enum KnownResourceTypes {
  Collection = "http://gedcomx.org/Collection",
  PhysicalArtifact ="http://gedcomx.org/PhysicalArtifact",
  DigitalArtifact = "http://gedcomx.org/DigitalArtifact",
  Record = "http://gedcomx.org/Record"
}

export const baseUri = "http://gedcomx.org/";
