// noinspection JSUnusedGlobalSymbols

declare module "gedcomx-js" {
  export function enableRsExtensions();

  export function addExtensions(extensions: Function);

  export class Base {
    constructor(json?: any);

    init(json: any): Base;

    isInstance(obj: object): boolean;
  }

  export class ExtensibleData extends Base {
    getId(): string;

    setId(id: string): ExtensibleData;
  }

  export class Root extends ExtensibleData {
    id: string
    lang: string
    attribution: Attribution
    persons: Person[]
    relationships: Relationship[]
    sourceDescriptions: SourceDescription[]
    agents: Agent[]
    events: Event[]
    documents: Document[]
    places: PlaceDescription[]
    description: string

    getPersons(): Person[]

    setPersons(persons: Person[] | object[]): Root

    addPerson(person: Person): Root

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

    getPlaces(): PlaceDescription[]
  }

  export function GedcomX(json: any): Root;

  export class ResourceReference extends Base {
    getResource(): string

    setResource(uri: string): ResourceReference

    matches(resource: Base | string): boolean
  }


  export class Attribution extends ExtensibleData {
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
    getAttribution(): Attribution

    setAttribution(attribution: Attribution): EvidenceReference
  }

  export class SourceReference extends ExtensibleData {
    getDescription(): string

    setDescription(description: string): SourceReference

    getDescriptionId(): string

    setDescriptionId(descriptionId: string): SourceReference

    getAttribution(): Attribution

    setAttribution(attribution: object | Attribution): SourceReference

    getQualifiers()

    setQualifiers(qualifiers: Qualifier[])
  }

  export class SourceDescription {
    // not defined in the lib, but part of the spec
    id: string

    getResourceType()

    setResourceType(resourceType)

    getCitations(): SourceCitation[]

    setCitations(citations: any[])

    getMediaType(): string

    setMediaType(mediaType: string)

    getAbout(): string

    setAbout(about: string)

    getMediator(): string

    setMediator(mediator: string)

    getSources(): SourceReference[]

    setSources(source: SourceReference[])

    getAnalysis(): string

    setAnalysis(analysis: string)

    getComponentOf(): SourceReference

    setComponentOf(componentOf: SourceReference)

    getTitles(): TextValue[]

    setTitles(titles: TextValue[])

    addTitle(title: TextValue)

    getNotes(): Note[]

    setNotes(notes: Note[])

    addNote(note: Note)

    getAttribution(): Attribution

    setAttribution(attribution: Attribution)

    getRights(): string[]

    setRights(rights: string[])

    getCoverage()

    setCoverage(coverage)

    getDescriptions(): TextValue[]

    setDescriptions(descriptions: TextValue[])

    addDescription(description: TextValue)

    getIdentifiers(): Identifiers

    setIdentifiers(identifiers: Identifiers)

    getCreated(): number

    setCreated(created: number)

    getModified(): number

    setModified(modified: number)

    getRepository(): string

    setRepository(repository: string)
  }

  export class Identifiers extends Base {
    getValues(type?: string): string[]

    setValues(value: string, type: string)

    addValue(value: string, type: string)
  }

  export class Subject extends Conclusion {
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
    getType(): string

    setType(gender: string): Gender
  }

  // Dates are defined as GDate, but exported as Date
  class GDate extends ExtensibleData {
    getOriginal(): string

    setOriginal(original: string)

    getFormal(): string

    setFormal(formal: string)

    // extensions
    toDateObject(): Date

    toString(): string
  }

  export {GDate as Date};

  export class Fact extends Conclusion {
    getType(): string

    setType(type: string): Fact

    getDate(): GDate

    setDate(date: GDate | object): Fact

    getPlace(): PlaceReference

    setPlace(place: PlaceReference | object): Fact

    getValue(): string

    setValue(value): Fact

    getQualifiers(): Qualifier[]

    setQualifiers(qualifiers: Qualifier[]): Fact

    addQualifier(qualifier: Qualifier): Fact

    // extensions
    toString(): string

    getEmoji(gender: string): string
  }

  export class Qualifier extends Base {
    getName(): string

    setName(name: string): Qualifier

    getValue(): string

    setValue(value: string): Qualifier
  }

  export class PlaceReference {
    getOriginal(): string

    setOriginal(original: string): PlaceReference

    getDescription(): string

    setDescription(description: string): PlaceReference
  }

  export class NamePart extends ExtensibleData {
    getType(): string

    setType(type: string): NamePart

    getValue(): string

    setValue(value: string): NamePart

    getQualifiers(): Qualifier[]

    setQualifiers(qualifiers: Qualifier[]): NamePart

    addQualifier(qualifier: Qualifier): NamePart
  }

  export class NameForm extends ExtensibleData {
    getLang(): string

    setLang(lang: string): NameForm

    getFullText(calculateIfMissing: Boolean)

    setFullText(fullText: string): NameForm

    getParts(type?: string): NamePart[]

    setParts(parts: NamePart[] | object[]): NameForm

    addPart(part: NamePart | object): NameForm
  }

  export class Name extends Conclusion {
    getType(): string

    setType(type: string): Name

    getDate(): GDate

    setDate(date: GDate): Name

    getNameForms(): NameForm[]

    setNameForms(nameForms: NameForm[]): Name

    addNameForm(nameForm: NameForm): Name

    getPreferred(): boolean

    setPreferred(preferred: boolean): Name
  }

  export class Person extends Subject {
    getPrivate(): boolean

    setPrivate(isPrivate: boolean): Person

    getGender(): Gender

    setGender(gender: Gender)

    isMale(): boolean

    isFemale(): boolean

    getNames(): Name[]

    setNames(names: Name[]): Person

    addName(name: NameForm | object): Person

    getFacts(): Fact[]

    setFacts(facts: Fact[] | object[])

    getFactsByType(type: string): Fact[]

    addFact(fact: Fact | object): Person

    // official extensions

    getLiving(): boolean

    setLiving(living: boolean): Person

    getDisplay(): DisplayProperties

    setDisplay(display: DisplayProperties): Person

    getPreferredName(): Name

    // extensions
    getFullName(): string

    getMarriedName(): string

    getBirthName(): string

    getAlsoKnownAs(): string

    getNickname(): string

    getAgeToday(): number | undefined

    toGraphObject()
  }

  export class Relationship extends Subject {
    getType(): string

    setType(type: string): Relationship

    getPerson1(): ResourceReference

    setPerson1(person1: ResourceReference): Relationship

    getPerson2(): ResourceReference

    setPerson2(person2: ResourceReference): Relationship

    getFacts(): Fact[]

    setFacts(facts: Fact[]): Relationship

    addFact(fact: Fact): Relationship

    involvesPerson(person: Person | string): boolean

    getOtherPerson(person: Person | string): ResourceReference

    // extensions
    getMembers(): ResourceReference[]
  }

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

  export class Note {
    getLang(): string

    setLang(lang: string)

    getSubject(): string

    setSubject(subject: string)

    getText(): string

    setText(text: string)

    getAttribution(): Attribution

    setAttribution(attribution: Attribution)
  }

  export class TextValue {
    getLang(): string

    setLang(lang: string)

    getValue(): string

    setValue(value: string): string
  }

  export class SourceCitation {
    getLang(): string

    setLang(lang: string)

    getValue(): string

    setValue(value: string): string
  }

  export class Agent {
    getIdentifiers(): Identifiers

    getNames(): TextValue[]

    getHomepage(): ResourceReference

    getOpenid(): ResourceReference

    getAccounts(): OnlineAccount[]

    getEmails(): ResourceReference[]

    getPhones(): ResourceReference[]

    getAddresses(): Address[]

    getPerson(): ResourceReference
  }

  export class OnlineAccount {
    getServiceHomepage(): ResourceReference

    getAccountName(): string
  }

  export class Address {
    getValue(): string

    getCity(): string

    getCountry(): string

    getPostalCode(): string

    getStateOrProvince(): string

    getStreet(): string

    getStreet2(): string

    getStreet3(): string

    getStreet4(): string

    getStreet5(): string

    getStreet6(): string
  }

  class Event extends Subject {
    getType(): string

    getDate(): Date

    getPlace(): PlaceReference

    getRoles(): EventRole[]
  }

  class Document extends Conclusion {
    getType(): string

    getExtracted(): boolean

    getTextType(): string

    getText(): string
  }

  class PlaceDescription extends Subject {
    getNames(): TextValue[]

    getType(): string

    getPlace(): string

    getJurisdiction(): string

    getLatitude(): number

    getLongitude(): number

    getTemporalDescription(): GDate

    getSpatialDescription(): string
  }

  class EventRole extends Conclusion {
    getPerson(): ResourceReference

    getType(): string

    getDetails(): string
  }
}
