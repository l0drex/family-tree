// noinspection JSUnusedGlobalSymbols

declare module "gedcomx-js" {
  import {DocumentTypes} from "./gedcomx-enums";

  export function enableRsExtensions();

  export function addExtensions(extensions: Function);

  export class Base {
    constructor(json?: object);

    init(json: any): Base;

    static isInstance(obj: object): boolean;

    toJSON(): object
  }

  export class ExtensibleData extends Base {
    id: string

    getId(): string;

    setId(id: string): ExtensibleData;
  }

  export class Root extends ExtensibleData {
    lang: string
    description: string
    persons: Person[]
    relationships: Relationship[]
    sourceDescriptions: SourceDescription[]
    agents: Agent[]
    events: Event[]
    documents: Document[]
    places: PlaceDescription[]
    attribution: Attribution

    getLang(): string

    setLang(lang: string): Root

    getDescription(): string

    setDescription(description: string): Root

    getPersons(): Person[] | object[]

    setPersons(persons: Person[] | object[]): Root

    addPerson(person: Person | object): Root

    getPersonById(id: string | number): Person

    getRelationships(): Relationship[]

    getPersonsRelationships(person: Person | string): Relationship[]

    getPersonsParentRelationships(person: Person | string): Relationship[]

    getPersonsParents(person: Person | string): Person[]

    getPersonsCoupleRelationships(person: Person | string): Relationship[]

    getPersonsSpouses(person: Person | string): Person[]

    getPersonsChildRelationships(person: Person | string): Relationship[]

    getPersonsChildren(person: Person | string): Person[]

    setRelationships(relationships: Relationship[] | object[]): Root

    addRelationship(relationship: Relationship | object): Root

    getSourceDescriptions(): SourceDescription[]

    setSourceDescriptions(sourceDescriptions: SourceDescription[] | object[]): Root

    addSourceDescription(sourceDescription: SourceDescription | object): Root

    getAgents(): Agent[]

    setAgents(agents: Agent[] | object[]): Root

    getEvents(): Event[]

    setEvents(events: Event[] | object[]): Root

    addEvent(event: Event | object): Root

    getDocuments(): Document[]

    setDocuments(documents: Document[]): Root

    addDocument(document: Document): Root

    getPlaces(): PlaceDescription[]

    setPlaces(places: PlaceDescription[]): Root

    addPlace(place: PlaceDescription): Root

    getAttribution(): Attribution

    setAttribution(attribution: Attribution): Root
  }

  export function GedcomX(json: any): Root;

  export class ResourceReference extends Base {
    resource: string

    getResource(): string

    setResource(uri: string): ResourceReference

    matches(resource: Base | string): boolean
  }


  export class Attribution extends ExtensibleData {
    changeMessage: string
    contributor: ResourceReference
    created: Date
    creator: ResourceReference
    modified: Date

    getChangeMessage(): string

    setChangeMessage(changeMessage: string): Attribution

    getContributor(): ResourceReference

    setContributor(contributor: object | ResourceReference): Attribution

    getCreated(): Date

    setCreated(date: Date | Number): Attribution

    getCreator(): ResourceReference

    setCreator(creator: ResourceReference)

    getModified(): Date

    setModified(date: Date | Number): Attribution
  }

  export class Conclusion extends ExtensibleData {
    lang: string
    confidence: string
    analysis: ResourceReference
    attribution: Attribution
    sources: SourceReference[]
    notes: Note[]

    getAttribution(): Attribution;

    setAttribution(attribution: Attribution);

    getAnalysis(): ResourceReference;

    setAnalysis(analysis: ResourceReference);

    getConfidence(): string;

    setConfidence(confidence: string);

    getLang(): string;

    setLang(lang: string);

    getNotes(): Note[];

    setNotes(notes: Note[]);

    addNote(note: Note);

    getSources(): SourceReference[];

    setSources(sources: SourceReference[]);

    addSource(source: SourceReference);
  }

  export class EvidenceReference extends ResourceReference {
    attribution: Attribution

    getAttribution(): Attribution

    setAttribution(attribution: object | Attribution): EvidenceReference
  }

  export class SourceReference extends ExtensibleData {
    description: string
    descriptionId: string
    attribution: Attribution

    getDescription(): string

    setDescription(description: string): SourceReference

    getDescriptionId(): string

    setDescriptionId(descriptionId: string): SourceReference

    getAttribution(): Attribution

    setAttribution(attribution: object | Attribution): SourceReference
  }

  export class SourceDescription extends ExtensibleData {
    resourceType: string
    citations: SourceCitation
    mediaType: string
    about: string
    mediator: ResourceReference
    sources
    analysis
    componentOf
    titles
    notes
    attribution
    rights
    coverage
    descriptions
    identifiers
    created
    modified
    repository

    getResourceType(): string

    setResourceType(resourceType: string): SourceDescription

    getCitations(): SourceCitation[]

    setCitations(citations: SourceCitation[] | object[]): SourceDescription

    addCitation(citation: SourceCitation | object)

    getMediaType(): string

    setMediaType(mediaType: string): SourceDescription

    getAbout(): string

    setAbout(about: string): SourceDescription

    getMediator(): ResourceReference

    setMediator(mediator: ResourceReference): SourceDescription

    getSources(): SourceReference[]

    setSources(sources: SourceReference[] | object[]): SourceDescription

    addSource(source: SourceReference): SourceDescription

    getAnalysis(): string

    setAnalysis(analysis: string): SourceDescription

    getComponentOf(): SourceReference

    setComponentOf(componentOf: SourceReference): SourceDescription

    getTitles(): TextValue[]

    setTitles(titles: TextValue[] | object[]): SourceDescription

    addTitle(title: TextValue | object): SourceDescription

    getNotes(): Note[]

    setNotes(notes: Note[] | object[]): SourceDescription

    addNote(note: Note | object): SourceDescription

    getAttribution(): Attribution

    setAttribution(attribution: Attribution | object): SourceDescription

    getRights(): ResourceReference[]

    setRights(rights: ResourceReference[] | object[]): SourceDescription

    addRight(right: ResourceReference | object): SourceDescription

    getCoverage(): Coverage

    setCoverage(coverage: Coverage[] | object[]): SourceDescription

    addCoverage(coverage: Coverage): SourceDescription

    getDescriptions(): TextValue[]

    setDescriptions(descriptions: TextValue[] | object[]): SourceDescription

    addDescription(description: TextValue | object): SourceDescription

    getIdentifiers(): Identifiers

    setIdentifiers(identifiers: Identifiers): SourceDescription

    getCreated(): number

    setCreated(created: number): SourceDescription

    getModified(): number

    setModified(modified: number): SourceDescription

    getRepository(): ResourceReference

    setRepository(repository: ResourceReference): SourceDescription
  }

  export class Identifiers extends Base {
    identifiers: object

    getValues(type?: string): string[]

    setValues(values: string[], type?: string)

    addValue(value: string, type?: string)
  }

  export class Subject extends Conclusion {
    extracted: boolean
    evidence: EvidenceReference[]
    identifiers
    media

    isExtracted(): boolean;

    setExtracted(extracted: boolean): Subject;

    getEvidence(): EvidenceReference[];

    setEvidence(evidence: object[] | EvidenceReference[]);

    addEvidence(evidence: object | EvidenceReference)

    getIdentifiers(): Identifiers

    setIdentifiers(identifiers: object | Identifiers): Subject

    getMedia(): SourceReference[]

    setMedia(media: object[] | SourceReference[]): Subject

    addMedia(media: object | SourceReference): Subject
  }

  export class Gender extends Conclusion {
    type: string

    getType(): string

    setType(gender: string): Gender
  }

  // Dates are defined as GDate, but exported as Date
  class GDate extends ExtensibleData {
    original: string
    formal: string

    getOriginal(): string

    setOriginal(original: string): GDate

    getFormal(): string

    setFormal(formal: string): GDate
  }

  export {GDate as Date};

  export class Fact extends Conclusion {
    type: string
    date: GDate
    place: PlaceReference
    value: string
    qualifiers: Qualifier[]

    getType(): string

    setType(type: string): Fact

    getDate(): GDate

    setDate(date: GDate | object): Fact

    getPlace(): PlaceReference

    setPlace(place: PlaceReference | object): Fact

    getValue(): string

    setValue(value): Fact

    getQualifiers(): Qualifier[]

    setQualifiers(qualifiers: Qualifier[] | object[]): Fact

    addQualifier(qualifier: Qualifier | object): Fact
  }

  export class Qualifier extends Base {
    name: string
    value: string

    getName(): string

    setName(name: string): Qualifier

    getValue(): string

    setValue(value: string): Qualifier
  }

  export class PlaceReference {
    original: string
    description: string

    getOriginal(): string

    setOriginal(original: string): PlaceReference

    getDescription(): string

    setDescription(description: string): PlaceReference
  }

  export class NamePart extends ExtensibleData {
    type: string
    value: string
    qualifiers: Qualifier[]

    getType(): string

    setType(type: string): NamePart

    getValue(): string

    setValue(value: string): NamePart

    getQualifiers(): Qualifier[]

    setQualifiers(qualifiers: Qualifier[] | object[]): NamePart

    addQualifier(qualifier: Qualifier | object): NamePart
  }

  export class NameForm extends ExtensibleData {
    lang: string
    fullText: string
    parts: NamePart[]

    getLang(): string

    setLang(lang: string): NameForm

    getFullText(calculateIfMissing: Boolean): string

    setFullText(fullText: string): NameForm

    getParts(type?: string): NamePart[]

    setParts(parts: NamePart[] | object[]): NameForm

    addPart(part: NamePart | object): NameForm
  }

  export class Name extends Conclusion {
    type: string
    date: GDate
    nameForms: NameForm[]

    getType(): string

    setType(type: string): Name

    getDate(): GDate

    setDate(date: GDate): Name

    getNameForms(): NameForm[]

    setNameForms(nameForms: NameForm[] | object[]): Name

    addNameForm(nameForm: NameForm | object): Name

    // todo only if extension is enabled
    getPreferred(): boolean

    setPreferred(preferred: boolean): Name
  }

  export class Person extends Subject {
    private: boolean
    gender: Gender
    names: Name[]
    facts: Fact[]

    getPrivate(): boolean

    setPrivate(isPrivate: boolean): Person

    getGender(): Gender

    setGender(gender: Gender): Person

    isMale(): boolean

    isFemale(): boolean

    getNames(): Name[]

    setNames(names: Name[] | object[]): Person

    addName(name: NameForm | object): Person

    getFacts(): Fact[]

    setFacts(facts: Fact[] | object[]): Person

    getFactsByType(type: string): Fact[]

    addFact(fact: Fact | object): Person

    // todo only if extension is enabled

    getLiving(): boolean

    setLiving(living: boolean): Person

    getDisplay(): DisplayProperties

    setDisplay(display: DisplayProperties): Person

    getPreferredName(): Name
  }

  export class Relationship extends Subject {
    type: string
    person1: ResourceReference
    person2: ResourceReference
    facts: Fact[]

    getType(): string

    setType(type: string): Relationship

    getPerson1(): ResourceReference

    setPerson1(person1: ResourceReference): Relationship

    getPerson2(): ResourceReference

    setPerson2(person2: ResourceReference): Relationship

    involvesPerson(person: Person | string): boolean

    getOtherPerson(person: Person | string): ResourceReference

    getFacts(): Fact[]

    setFacts(facts: Fact[] | object[]): Relationship

    addFact(fact: Fact | object): Relationship

    // extensions
    getMembers(): ResourceReference[]
  }

  export class Note extends ExtensibleData {
    lang: string
    subject: string
    text: string
    attribution: Attribution

    getLang(): string

    setLang(lang: string): Note

    getSubject(): string

    setSubject(subject: string): Note

    getText(): string

    setText(text: string): Note

    getAttribution(): Attribution

    setAttribution(attribution: Attribution | object)
  }

  export class TextValue extends Base {
    lang: string
    value: string

    getLang(): string

    setLang(lang: string): TextValue

    getValue(): string

    setValue(value: string): TextValue
  }

  export class SourceCitation extends ExtensibleData {
    lang: string
    value: string

    getLang(): string

    setLang(lang: string): SourceCitation

    getValue(): string

    setValue(value: string): SourceCitation
  }

  export class Agent extends ExtensibleData {
    identifiers: Identifiers
    names: TextValue[]
    homepage: ResourceReference
    openid: ResourceReference
    accounts: OnlineAccount[]
    emails: ResourceReference[]
    phones: ResourceReference[]
    addresses: Address[]
    person: ResourceReference

    getIdentifiers(): Identifiers

    setIdentifiers(identifiers: Identifiers): Agent

    getNames(): TextValue[]

    setNames(names: TextValue[] | object[]): Agent

    addName(name: TextValue): Agent

    getHomepage(): ResourceReference

    setHomepage(homepage: ResourceReference): Agent

    getOpenid(): ResourceReference

    setOpenid(openid: ResourceReference): Agent

    getAccounts(): OnlineAccount[]

    setAccounts(accounts: OnlineAccount[] | object[]): Agent

    addAccount(account: OnlineAccount | object): Agent

    getEmails(): ResourceReference[]

    setEmails(emails: ResourceReference[] | object[]): Agent

    addEmail(email: ResourceReference): Agent

    getPhones(): ResourceReference[]

    setPhones(phones: ResourceReference[]): Agent

    addPhone(phone: ResourceReference): Agent

    getAddresses(): Address[]

    setAddresses(addresses: Address[] | object[]): Agent

    addAddress(address: Address | object): Agent

    getPerson(): ResourceReference

    setPerson(person: ResourceReference): Agent
  }

  export class OnlineAccount extends ExtensibleData {
    serviceHomepage: ResourceReference
    accountName: string

    getServiceHomepage(): ResourceReference

    setServiceHomepage(serviceHomepage: ResourceReference): OnlineAccount

    getAccountName(): string

    setAccountName(accountName: string): OnlineAccount
  }

  export class Address {
    value: string
    city: string
    country: string
    postalCode: string
    stateOrProvince: string
    street: string
    street2: string
    street3: string
    street4: string
    street5: string
    street6: string

    getValue(): string

    setValue(value: string): Address

    getCity(): string

    setCity(city: string): Address

    getCountry(): string

    setCountry(country: string): Address

    getPostalCode(): string

    setPostalCode(postalCode: string): Address

    getStateOrProvince(): string

    setStateOrProvince(stateOrProvince: string): Address

    getStreet(): string

    setStreet(street: string): Address

    getStreet2(): string

    setStreet2(street2: string): Address

    getStreet3(): string

    setStreet3(street3: string): Address

    getStreet4(): string

    setStreet4(street4: string): Address

    getStreet5(): string

    setStreet5(street5: string): Address

    getStreet6(): string

    setStreet6(street6: string): Address
  }

  class Event extends Subject {
    type: string
    date: Date
    place: PlaceReference
    roles: EventRole[]

    getType(): string

    setType(type: string): Event

    getDate(): Date

    setDate(date: Date): Event

    getPlace(): PlaceReference

    setPlace(place: PlaceReference): Event

    getRoles(): EventRole[]

    setRoles(roles: EventRole[] | object[]): Event

    addRole(role: EventRole | object): Event
  }

  class Document extends Conclusion {
    type: string
    extracted: string
    textType: string
    text: string

    getType(): string

    setType(type: string): Document

    getExtracted(): boolean

    setExtracted(extracted: boolean): Document

    getTextType(): string

    setTextType(textType: string): Document

    getText(): string

    setText(text: string): Document
  }

  class PlaceDescription extends Subject {
    type: string
    names: TextValue[]
    place: ResourceReference
    jurisdiction: ResourceReference
    latitude: number
    longitude: number
    temporalDescription: Date
    spatialDescription: ResourceReference

    getType(): string

    setType(type: string): PlaceDescription

    getNames(): TextValue[]

    setNames(names: TextValue | object[]): PlaceDescription

    addName(name: TextValue | object): PlaceDescription

    getPlace(): ResourceReference

    setPlace(place: PlaceDescription | object): PlaceDescription

    getJurisdiction(): ResourceReference

    setJurisdiction(jurisdiction: ResourceReference): PlaceDescription

    getLatitude(): number

    setLatitude(latitude: number): PlaceDescription

    getLongitude(): number

    setLongitude(longitude: number): PlaceDescription

    getTemporalDescription(): Date

    setTemporalDescription(date: Date): PlaceDescription

    getSpatialDescription(): ResourceReference

    setSpatialDescription(spatial: ResourceReference): PlaceDescription
  }

  class EventRole extends Conclusion {
    person: ResourceReference
    type: string
    details: string

    getPerson(): ResourceReference

    setPerson(person: ResourceReference): EventRole

    getType(): string

    setType(type: string): EventRole

    getDetails(): string

    setDetails(details: string): EventRole
  }

  class Coverage extends ExtensibleData {
    spatial: PlaceReference
    temporal: Date

    getSpatial(): PlaceReference

    setSpatial(spatial: PlaceReference): Coverage

    getTemporal(): Date

    setTemporal(temporal: Date): Coverage
  }


  // todo only if extension is enabled
  export class FamilyView extends Base {
    getParent1(): ResourceReference

    setParent1(parent1: ResourceReference): FamilyView

    getParent2(): ResourceReference

    setParent2(parent2: ResourceReference): FamilyView

    getChildren(): ResourceReference[]

    setChildren(children: ResourceReference[]): FamilyView

    addChild(child: ResourceReference): FamilyView


    // extensions
    involvesPerson(person: ResourceReference | string): boolean

    getParents(): ResourceReference[]

    getMembers(): ResourceReference[]
  }

  export class DisplayProperties extends Base {
    getName(): string

    setName(name: string): DisplayProperties

    getGender(): string

    setGender(gender: string): DisplayProperties

    getLifespan(): string

    setLifespan(lifespan: string): DisplayProperties

    getBirthDate(): string

    setBirthDate(birthDate: string): DisplayProperties

    getBirthPlace(): string

    setBirthPlace(birthPlace: string): DisplayProperties

    getDeathDate(): string

    setDeathDate(deathDate: string): DisplayProperties

    getDeathPlace(): string

    setDeathPlace(deathPlace: string): DisplayProperties

    getMarriageDate(): string

    setMarriageDate(marriageDate: string): DisplayProperties

    getMarriagePlace(): string

    setMarriagePlace(marriagePlace: string): DisplayProperties

    getAscendancyNumber(): string

    setAscendancyNumber(ascendancyNumber: string): DisplayProperties

    getDescendancyNumber(): string

    setDescendancyNumber(descendancyNumber: string): DisplayProperties

    getFamiliesAsParent(): FamilyView[]

    setFamiliesAsParent(families: FamilyView[]): DisplayProperties

    getFamiliesAsChild(): FamilyView[]

    setFamiliesAsChild(families: FamilyView[]): DisplayProperties
  }
}
