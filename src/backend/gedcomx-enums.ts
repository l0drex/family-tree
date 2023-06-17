// noinspection JSUnusedGlobalSymbols

export type FactType = PersonFactTypes | RelationshipFactTypes;
export type QualifierName = PersonFactQualifiers;

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
  AdultChristening = "http://gedcomx.org/AdultChristening",
  Amnesty = "http://gedcomx.org/Amnesty",
  AncestralHall = "http://gedcomx.org/AncestralHall",
  AncestralPoem = "http://gedcomx.org/AncestralPoem",
  Apprenticeship = "http://gedcomx.org/Apprenticeship",
  Arrest = "http://gedcomx.org/Arrest",
  Award = "http://gedcomx.org/Award",
  Baptism = "http://gedcomx.org/Baptism",
  BarMitzvah = "http://gedcomx.org/BarMitzvah",
  BatMitzvah = "http://gedcomx.org/BatMitzvah",
  Birth = "http://gedcomx.org/Birth",
  BirthNotice = "http://gedcomx.org/BirthNotice",
  Blessing = "http://gedcomx.org/Blessing",
  Branch = "http://gedcomx.org/Branch",
  Burial = "http://gedcomx.org/Burial",
  Caste = "http://gedcomx.org/Caste",
  Census = "http://gedcomx.org/Census",
  Christening = "http://gedcomx.org/Christening",
  Circumcision = "http://gedcomx.org/Circumcision",
  Clan = "http://gedcomx.org/Clan",
  Confirmation = "http://gedcomx.org/Confirmation",
  Court = "http://gedcomx.org/Court",
  Cremation = "http://gedcomx.org/Cremation",
  Death = "http://gedcomx.org/Death",
  Education = "http://gedcomx.org/Education",
  EducationEnrollment = "http://gedcomx.org/EducationEnrollment",
  Emigration = "http://gedcomx.org/Emigration",
  Enslavement = "http://gedcomx.org/Enslavement",
  Ethnicity = "http://gedcomx.org/Ethnicity",
  Excommunication = "http://gedcomx.org/Excommunication",
  FirstCommunion = "http://gedcomx.org/FirstCommunion",
  Funeral = "http://gedcomx.org/Funeral",
  GenderChange = "http://gedcomx.org/GenderChange",
  GenerationNumber = "http://gedcomx.org/GenerationNumber",
  Graduation = "http://gedcomx.org/Graduation",
  Heimat = "http://gedcomx.org/Heimat",
  Immigration = "http://gedcomx.org/Immigration",
  Imprisonment = "http://gedcomx.org/Imprisonment",
  Inquest = "http://gedcomx.org/Inquest",
  LandTransaction = "http://gedcomx.org/LandTransaction",
  Language = "http://gedcomx.org/Language",
  Living = "http://gedcomx.org/Living",
  MaritalStatus = "http://gedcomx.org/MaritalStatus",
  Medical = "http://gedcomx.org/Medical",
  MilitaryAward = "http://gedcomx.org/MilitaryAward",
  MilitaryDischarge = "http://gedcomx.org/MilitaryDischarge",
  MilitaryDraftRegistration = "http://gedcomx.org/MilitaryDraftRegistration",
  MilitaryInduction = "http://gedcomx.org/MilitaryInduction",
  MilitaryService = "http://gedcomx.org/MilitaryService",
  Mission = "http://gedcomx.org/Mission",
  MoveFrom = "http://gedcomx.org/MoveFrom",
  MoveTo = "http://gedcomx.org/MoveTo",
  MultipleBirth = "http://gedcomx.org/MultipleBirth",
  NationalId = "http://gedcomx.org/National Id",
  Nationality = "http://gedcomx.org/Nationality",
  Naturalization = "http://gedcomx.org/Naturalization",
  NumberOfChildren = "http://gedcomx.org/NumberOfChildren",
  NumberOfMarriage = "http://gedcomx.org/NumberOfMarriage",
  Obituary = "http://gedcomx.org/Obituary",
  OfficialPosition = "http://gedcomx.org/OfficialPosition",
  Occupation = "http://gedcomx.org/Occupation",
  Ordination = "http://gedcomx.org/Ordination",
  Pardon = "http://gedcomx.org/Pardon",
  PhysicalDescription = "http://gedcomx.org/PhysicalDescription",
  Probate = "http://gedcomx.org/Probate",
  Property = "http://gedcomx.org/Property",
  Race = "http://gedcomx.org/Race",
  Religion = "http://gedcomx.org/Religion",
  Residence = "http://gedcomx.org/Residence",
  Retirement = "http://gedcomx.org/Retirement",
  Stillbirth = "http://gedcomx.org/Stillbirth",
  TaxAssessment = "http://gedcomx.org/TaxAssessment",
  Tribe = "http://gedcomx.org/Tribe",
  Will = "http://gedcomx.org/Will",
  Visit = "http://gedcomx.org/Visit",
  Yahrzeit = "http://gedcomx.org/Yahrzeit"
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

export enum KnownResourceTypes {
  Collection = "http://gedcomx.org/Collection",
  PhysicalArtifact ="http://gedcomx.org/PhysicalArtifact",
  DigitalArtifact = "http://gedcomx.org/DigitalArtifact",
  Record = "http://gedcomx.org/Record"
}

export enum EventRoleTypes {
  Principal = "http://gedcomx.org/Principal",
  Participant = "http://gedcomx.org/Participant",
  Official = "http://gedcomx.org/Official",
  Witness = "http://gedcomx.org/Witness"
}

// todo
export enum GroupRoleTypes {}

export enum IdentifierTypes {
  Primary = "http://gedcomx.org/Primary",
  Authority = "http://gedcomx.org/Authority",
  Deprecated = "http://gedcomx.org/Deprecated"
}

// There is no current definition of a set of known place types.
export enum PlaceTypes {}

export enum DocumentTypes {
  Abstract = "http://gedcomx.org/Abstract",
  Transcription = "http://gedcomx.org/Transcription",
  Translation = "http://gedcomx.org/Translation",
  Analysis = "http://gedcomx.org/Analysis"
}

export enum EventTypes {
  Adoption = "http://gedcomx.org/Adoption",
  Birth = "http://gedcomx.org/Birth",
  Burial = "http://gedcomx.org/Burial",
  Census = "http://gedcomx.org/Census",
  Christening = "http://gedcomx.org/Christening",
  Death = "http://gedcomx.org/Death",
  Divorce = "http://gedcomx.org/Divorce",
  Marriage = "http://gedcomx.org/Marriage"
}

export const baseUri = "http://gedcomx.org/";
