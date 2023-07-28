// noinspection JSUnusedGlobalSymbols

import * as GedcomX from "gedcomx-js";

declare module "gedcomx-js" {
  export interface Conclusion {
    sortKey: boolean

    setSortKey(sortKey: boolean): Conclusion

    getSortKey(): boolean
  }

  export interface Date {
    normalized: TextValue[]

    setNormalized(normalized: TextValue[]): Date

    addNormalized(normalized: TextValue): Date

    getNormalized(): TextValue[]
  }

  export class DisplayProperties extends Base {
    name: string
    gender: string
    lifespan: string
    birthDate: string
    birthPlace: string
    deathDate: string
    deathPlace: string
    marriageDate: string
    marriagePlace: string
    ascendancyNumber: string
    descendancyNumber: string
    familiesAsParent: FamilyView[]
    familiesAsChild: FamilyView[]

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

  export interface ExtensibleData {
    links: Link[]

    setLinks(links: Link[]): ExtensibleData

    addLink(link: Link): ExtensibleData

    getLinks(): Link[]

    getLink(rel: string): Link
  }

  export class FamilyView extends Base {
    parent1: ResourceReference
    parent2: ResourceReference
    children: ResourceReference[]

    getParent1(): ResourceReference

    setParent1(parent1: ResourceReference): FamilyView

    getParent2(): ResourceReference

    setParent2(parent2: ResourceReference): FamilyView

    getChildren(): ResourceReference[]

    setChildren(children: ResourceReference[]): FamilyView

    addChild(child: ResourceReference): FamilyView
  }

  export class Link extends Base {
    rel: string
    href: string
    template: string
    type: string
    accept: string
    allow: string
    hreflang: string
    title: string

    getRel(): string

    setRel(rel: string): Link

    getHref(): string

    setHref(href: string): Link

    getTemplate(): string

    setTemplate(template: string): Link

    getType(): string

    setType(type: string): Link

    getAccept(): string

    setAccept(accept: string): Link

    getAllow(): string

    setAllow(allow: string): Link

    getHrefLang(): string

    setHrefLang(hreflang: string): Link

    getTitle(): string

    setTitle(title: string): Link
  }

  export class Links extends Base {
    getLinks(): Link[]

    getLink(rel: string): Link

    addLink(link: Link): Links

    setLinks(links: Link[] | object[]): Links
  }

  export interface Name {
    preferred: boolean

    setPreferred(preferred: boolean): Name

    getPreferred(): boolean
  }

  export interface Person {
    living: boolean
    display: DisplayProperties

    setLiving(living: boolean): Person

    getLiving(): boolean

    setDisplay(display: DisplayProperties): Person

    getDisplay(): DisplayProperties

    getPreferredName(): Name
  }

  export interface PlaceDescription {
    display: PlaceDisplayProperties

    setDisplay(display: PlaceDisplayProperties): PlaceDescription

    getDisplay(): PlaceDisplayProperties
  }

  export interface PlaceDisplayProperties extends Base {
    name: string
    fullName: string
    type: string

    setName(name: string): PlaceDisplayProperties

    getName(): string

    setFullName(fullName: string): PlaceDisplayProperties

    getFullName(): string

    setType(type: string): PlaceDisplayProperties

    getType(): string
  }

  export interface PlaceReference {
    normalized: TextValue[]

    setNormalized(normalized: TextValue[]): PlaceReference

    addNormalized(normalized: TextValue): PlaceReference

    getNormalized(): TextValue[]
  }

  export interface ResourceReference {
    resourceId: boolean

    setResourceId(resourceId: boolean): ResourceReference

    getResourceId(): boolean
  }

  export interface SourceDescription {
    sortKey: boolean
    version: string

    setSortKey(sortKey: boolean): SourceDescription

    getSortKey(): boolean

    setVersion(version: string): SourceDescription

    getVersion(): string
  }
}

GedcomX.enableRsExtensions();
