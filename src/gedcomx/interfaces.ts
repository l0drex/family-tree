import {
  Confidence, DocumentTypes, EventRoleTypes, EventTypes, FactQualifier,
  FactType,
  GenderTypes, GroupRoleTypes, IdentifierTypes,
  KnownResourceTypes, NamePartQualifier, NamePartTypes,
  NameTypes, PlaceTypes,
  QualifierName,
  RelationshipTypes, SourceReferenceQualifier, ValueQualifierName
} from "./types";
import {IResourceReference, URI} from "./json";
import {gedcomxDate} from "./date";

// basic data types

export type timestamp = number;
export type double = number;
export type localeTag = "en" | "de" | string;

// top-level data types

export interface IPerson extends ISubject {
  /**
   * Whether this instance of Person has been designated for limited distribution or display.
   *
   * A description of how implementations should use private data is outside the scope of this specification.
   */
  private?: boolean
  /**
   * The sex of the person as assigned at birth.
   */
  gender?: IGender
  /**
   * If more than one name is provided, names are assumed to be given in order of preference, with the most preferred name in the first position in the list.
   */
  names?: IName[]
  facts?: IFact[]
}

/**
 * When a relationship type implies direction, the relationship is said to be from person1 to person2.
 * @example In a parent-child relationship, the relationship is said to be "from a parent to a child"; therefore, the person1 property refers to the parent and the person2 property refers to the child.
 */
export interface IRelationship extends ISubject {
  type?: `${RelationshipTypes}` | string
  person1: IResourceReference<IPerson>
  person2: IResourceReference<IPerson>
  facts?: IFact[]
}

export interface ISourceDescription {
  id?: string
  resourceType?: `${KnownResourceTypes}` | string
  /**
   * At least one citation MUST be provided. If more than one citation is provided,
   * citations are assumed to be given in order of preference,
   * with the most preferred citation in the first position in the list.
   */
  citations: ISourceCitation  // somehow multiple values are allowed
  /**
   * If provided, MUST be a valid MIME (media) type as specified by RFC 4288.
   */
  mediaType?: string
  /**
   * A uniform resource identifier (URI) for the resource being described.
   */
  about?: URI
  /**
   * A reference to the entity that mediates access to the described source.
   */
  mediator?: IResourceReference<IAgent>
  /**
   * A reference to the entity responsible for making the described source available.
   */
  publisher?: IResourceReference<IAgent>
  /**
   * A reference to the entities that authored the described source.
   */
  authors?: IResourceReference<IAgent>[]
  /**
   * A list of references to any sources from which this source is derived.
   */
  sources?: ISourceReference[]
  /**
   * A reference to a document containing analysis about this source.
   */
  analysis?: IResourceReference<IDocument<DocumentTypes.Analysis>>
  /**
   * A reference to the source that contains this source, i.e. its parent context.
   * Used when the description of a source is not complete without the description of its parent (or containing) source.
   */
  componentOf?: ISourceReference
  /**
   * The display name(s) for this source.
   *
   *  If more than one title is provided, titles are assumed to be given in order of preference,
   *  with the most preferred title in the first position in the list.
   */
  titles?: ITextValue[]
  notes?: INote[]
  /**
   * If not provided, the attribution of the containing data set (e.g. file) of the source description is assumed.
   */
  attribution?: IAttribution
  /**
   * If provided, MUST resolve to a resource that describes the rights associated with the resource being described.
   */
  rights?: IResourceReference[]
  coverage?: ICoverage[]
  /**
   * Human-readable descriptions of this source.
   *
   * If more than one description is provided, descriptions are assumed to be given in order of preference,
   * with the most preferred description in the first position in the list.
   */
  descriptions?: ITextValue[]
  identifiers?: IIdentifier[]
  created?: timestamp
  modified?: timestamp
  published?: timestamp
  /**
   * A reference to the repository that contains the described resource.
   */
  repository?: IResourceReference<IAgent>
}

/**
 * The Agent data type defines someone or something that curates genealogical data,
 * such as a genealogical researcher, user of software, or organization.
 */
export interface IAgent {
  id?: string
  identifiers?: IIdentifier[]
  /**
   * If more than one name is provided, names are assumed to be given in order of preference,
   * with the most preferred name in the first position in the list.
   */
  names?: ITextValue[]
  homepage?: IResourceReference
  openid?: IResourceReference
  accounts?: IOnlineAccount[]
  /**
   * @example mailto:someone@gedcomx.org
   */
  emails?: IResourceReference<Email>[]
  /**
   * @example tel:+1-201-555-0123
   */
  phones?: IResourceReference<Phone>[]
  addresses?: IAddress[]
  person?: IResourceReference<IPerson>
}

export interface IEvent extends ISubject {
  type?: `${EventTypes}` | string
  date?: Date
  place?: IPlaceReference
  /**
   * Information about how persons participated in the event.
   */
  roles?: IEventRole[]
}

export interface IDocument<T extends DocumentTypes = undefined> extends IConclusion {
  type?: `${T}`
  // default: false
  extracted?: boolean
  /**
   * @default plain
   */
  textType?: "plain" | "xhtml"
  text: string
  /**
   * If not provided, the attribution of the containing data set (e.g. file) of the document is assumed.
   */
  attribution?: IAttribution
}

export type IPlaceDescription = ISubject & {
  names: AtLeastOne<ITextValue>
  type?: `${PlaceTypes}` | string
  /**
   * Descriptions that provide the same value for place are interpreted
   * as alternate descriptions of the same place.
   * If provided, MUST NOT use a base URI of http://gedcomx.org/.
   * If provided, the value MAY resolve to an external resource that is
   * application-specific and outside the scope of this specification.
   */
  place?: IResourceReference
  jurisdiction?: IResourceReference<IPlaceDescription>
  temporalDescription?: IDate
  /**
   * It is RECOMMENDED that this geospatial description resolve to a KML document.
   */
  spatialDescription?: IResourceReference
} & ({
  latitude: never
  longitude: never
} | {
  latitude: double
  longitude: double
})

export interface IGroup extends ISubject {
  names: AtLeastOne<ITextValue>
  date?: IDate
  place?: IPlaceReference
  roles?: IGroupRole[]
}

// component-level data types

export interface IIdentifier {
  value: URI
  type?: `${IdentifierTypes}` | string
}

export interface IAttribution {
  contributor?: IResourceReference<IAgent>
  modified?: timestamp
  changeMessage?: string
  creator?: IResourceReference<IAgent>
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
  /**
   *  This string is plain text, but MAY include an xhtml cite element.
   *  If the value includes a cite element, the text-level semantics defined for cite MUST apply —
   *  i.e., the element MUST represent the title of a work.
   */
  value: string
}

export interface ISourceReference {
  description: URI<ISourceDescription>
  descriptionId?: string
  /**
   * If not provided, the attribution of the containing resource of the source reference is assumed.
   */
  attribution?: IAttribution
  qualifiers?: IQualifier<SourceReferenceQualifier | string>[]
}

export interface IEvidenceReference<T extends ISubject> {
  resource: URI<T>
  attribution?: IAttribution
}

export interface IOnlineAccount {
  serviceHomepage: IResourceReference
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
  /**
   * If not provided, the locale is determined per Internationalization Considerations.
   */
  lang?: localeTag
  /**
   * Note that the sources referenced from conclusions are also considered to be sources of the entities
   * that contain them.
   * For example, a source associated with the Name of a Person is also source for the Person.
   */
  sources?: ISourceReference[]
  analysis?: IResourceReference<IDocument<DocumentTypes.Analysis>>
  notes?: INote[]
  confidence?: `${Confidence}` | string
  /**
   * If not provided, the attribution of the containing data set (e.g. file) of the conclusion is assumed.
   */
  attribution?: IAttribution
}

export interface ISubject<T extends ISubject = ISubject<undefined>> extends IConclusion {
  /**
   * @default false
   */
  extracted?: boolean
  evidence?: IEvidenceReference<T>[]
  /**
   * Media references SHOULD be ordered by priority such that applications that wish to display a single media item
   * (such as an image) MAY choose the first applicable media reference.
   *
   * Note that the SourceReference is used for multimedia references and therefore MUST resolve
   * to a SourceDescription of the resource, which in turn provides a reference to the resource itself.
   */
  media?: ISourceReference[]
  identifiers?: IIdentifier[]
}

export interface IGender {
  type: `${GenderTypes}` | string
}

export interface IName extends IConclusion {
  type?: `${NameTypes}` | string
  /**
   * All included name forms SHOULD be representations of the same name, and NOT variants of the name
   * (i.e., not nicknames or spelling variations).
   */
  nameForms: AtLeastOne<INameForm>
  date?: IDate
}

export interface IFact {
  type: `${FactType}` | string
  date?: IDate
  place?: IPlaceReference
  value?: string
  qualifiers?: IQualifier<FactQualifier>[]
}

export interface IEventRole extends IConclusion {
  person: IResourceReference<IPerson>
  type?: `${EventRoleTypes}` | string
  details?: string
}

export interface IDate {
  original?: string
  formal?: gedcomxDate
}

export interface IPlaceReference {
  original?: string
  descriptionRef?: URI<IPlaceDescription>
}

export interface INamePart {
  type?: `${NamePartTypes}` | string
  /**
   *  A name part value MAY contain more than one term from the full name,
   *  such as in the name part "John Fitzgerald" from the full name "John Fitzgerald Kennedy".
   *  If multiple terms are detailed in a single NamePart, these terms SHOULD be separated using the name separator
   *  appropriate to the locale applicable to the containing name form.
   */
  value: string
  qualifiers?: IQualifier<NamePartQualifier>[]
}

export interface INameForm {
  lang?: localeTag
  /**
   * If provided, the name SHOULD be rendered as it would normally be spoken in the applicable cultural context.
   */
  fullText?: string
  /**
   * If provided, the list SHOULD be ordered such that the parts are in the order they would normally be spoken
   * in the applicable cultural context.
   */
  parts?: INamePart[]
}

export interface IQualifier<T extends QualifierName | string = undefined> {
  name: `${T}`
  /**
   * If provided, the name MAY give the semantic meaning of the value.
   */
  value?: T extends ValueQualifierName ? string : never
}

export interface ICoverage {
  spatial?: IPlaceReference
  temporal?: IDate
}

export interface IGroupRole extends IConclusion {
  person: IResourceReference<IPerson>
  type?: `${GroupRoleTypes}`
  date?: IDate
  details?: string
}

// other types

export type Email = `mailto:${string}@${string}`;
export type Phone = `tel:${string}`;
export type AtLeastOne<T> = [T, ...T[]];
