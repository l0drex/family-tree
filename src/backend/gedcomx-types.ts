import {
  Confidence, DocumentTypes, EventRoleTypes, EventTypes,
  FactType,
  GenderTypes, GroupRoleTypes, IdentifierTypes,
  KnownResourceTypes,
  NameTypes, PlaceTypes,
  QualifierName,
  RelationshipTypes
} from "./gedcomx-enums";
import {PlaceReference, ResourceReference} from "gedcomx-js";

// top-level data types

export interface IPerson extends ISubject {
  private?: boolean
  gender?: IGender
  // If more than one name is provided, names are assumed to be given in order of preference, with the most preferred name in the first position in the list.
  names?: IName[]
  facts?: IFact[]
}

export interface IRelationship extends ISubject {
  type?: RelationshipTypes | string
  person1: IResourceReference  // person
  person2: IResourceReference  // person
  facts?: IFact[]
}

export interface ISourceDescription {
  id?: string
  resourceType?: KnownResourceTypes
  citations: ISourceCitation
  mediaType?: string
  about?: URI
  mediator?: URI
  publisher?: URI
  authors?: URI[]
  sources?: ISourceReference[]
  analysis?: URI  // Document of type analysis
  componentOf?: ISourceReference
  titles?: ITextValue
  notes?: INote[]
  attribution?: IAttribution
  rights?: URI[]
  coverage?: ICoverage[]
  descriptions?: ITextValue[]
  identifiers?: IIdentifier[]
  created?: timestamp
  modified?: timestamp
  published?: timestamp
  // Agent
  repository?: URI
}

export interface IAgent {
  id?: string
  identifiers?: IIdentifier[]
  names?: ITextValue[]
  homepage?: URI
  openid?: URI
  accounts?: IOnlineAccount[]
  emails?: URI[]
  phones?: URI[]
  addresses?: IAddress[]
  person?: URI
}

export interface IEvent extends ISubject {
  type?: EventTypes
  date?: Date
  place?: PlaceReference
  roles?: IEventRole[]
}

export interface IDocument extends IConclusion {
  type?: DocumentType
  // default: false
  extracted?: boolean
  // If provided, the value MUST be a valid text type:
  // https://github.com/FamilySearch/gedcomx/blob/master/specifications/conceptual-model-specification.md#text-types
  // If no value is provided, "plain" is assumed.
  textType?: DocumentTypes
}

export interface IPlaceDescription extends ISubject {
  names: ITextValue[]
  type?: PlaceTypes
  // Descriptions that provide the same value for place are interpreted
  // as alternate descriptions of the same place.
  // If provided, MUST NOT use a base URI of http://gedcomx.org/.
  // If provided, the value MAY resolve to an external resource that is
  // application-specific and outside the scope of this specification.
  place?: URI
  // URI to place description
  jurisdiction?: URI
  latitude?: double
  longitude?: double
  temporalDescription?: IDate
  // It is RECOMMENDED that this geospatial description resolve to a KML document.
  spatialDescription?: URI
}

export interface IGroup extends ISubject {
  names: ITextValue[]
  date?: IDate
  place?: IPlaceReference
  roles?: IGroupRole[]
}

// component-level data types

export interface IIdentifier {
  value: URI
  type?: IdentifierTypes
}

export interface IAttribution {
  contributor?: ResourceReference
  modified?: timestamp
  changeMessage?: string
  creator?: ResourceReference
  created?: timestamp
}

export interface INote {
  lang?: localeTag
  subject?: string
  text: string
  attribution?: IAttribution
}

export interface ITextValue {
  lang?: localeTag
  value: string
}

export interface ISourceCitation {
  lang?: localeTag
  value: string
}

export interface ISourceReference {
  description: URI
  descriptionId?: string
  attribution?: IAttribution
  qualifiers?: IQualifier[]
}

export interface IEvidenceReference {
  resource: URI
  attribution?: IAttribution
}

export interface IOnlineAccount {
  serviceHomepage: URI
  accountName: string
}

export interface IAddress {
  value?: string
  city?: string
  country?: string
  postalCode?: string
  stateOrProvince?: string
  street?: string
  street2: string
  street3: string
  street4: string
  street5: string
  street6: string
}

export interface IConclusion {
  id?: string
  lang?: localeTag
  sources?: ISourceReference[]
  analysis?: URI
  notes?: INote[]
  confidence?: Confidence
  attribution?: IAttribution
}

export interface ISubject extends IConclusion {
  // Default: false
  extracted?: boolean
  evidence?: IEvidenceReference[]
  media?: ISourceReference[]
  identifiers?: IIdentifier[]
}

export interface IGender {
  type: GenderTypes | string
}

export interface IName extends IConclusion {
  type?: NameTypes | string
  nameForms: INameForm[]
  date?: IDate
}

export interface IFact {
  type: FactType | string
  date?: IDate
  place?: PlaceReference
  value?: string
  qualifiers?: IQualifier[]
}

export interface IEventRole extends IConclusion {
  person: URI
  type?: EventRoleTypes
}

export interface IDate {
  original?: string
  formal?: gedcomxDate
}

export interface IPlaceReference {
  original?: string
  descriptionRef?: URI
}

export interface INamePart {
  type?: NameTypes | string
  value: string
  qualifiers?: IQualifier[]
}

export interface INameForm {
  lang?: localeTag
  fullText?: string
  parts?: INamePart[]
}

export interface IQualifier {
  name: QualifierName | string
  value?: string
}

export interface ICoverage {
  spatial?: PlaceReference
  temporal?: IDate
}

export interface IGroupRole extends IConclusion {
  person: URI
  type?: GroupRoleTypes
  date?: IDate
  details?: string
}

// json specific
export type URI = string;

export interface IResourceReference {
  resource: URI
}

export interface IGedcomXData {
  id?: string
  lang?: localeTag
  attribution?: IAttribution
  description?: URI
}

export interface IGedcomX extends IGedcomXData {
  persons?: IPerson[]
  relationships?: IRelationship[]
  sourceDescriptions?: ISourceDescription[]
  agents?: IAgent[]
  events?: IEvent[]
  documents?: IDocument[]
  places?: IPlaceDescription[]
  groups?: IGroup[]
}

// other types

// milliseconds since epoch
export type timestamp = number;
export type double = number;
export type localeTag = string;
export type gedcomxDate = string;
