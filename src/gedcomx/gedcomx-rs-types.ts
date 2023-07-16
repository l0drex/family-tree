import {IDate, IPerson, IPlaceReference, IName, ITextValue} from "./gedcomx-types";
import {IResourceReference, URI} from "./JsonTypes";

export interface ILink {
  rel: URI
  // If not provided, a template MUST be provided.
  href?: URI
  // If not provided, a href MUST be provided.
  template?: URI
  // The value of the "type" attribute is as defined by RFC 2616, Section 3.7.
  type?: string
  // The value of the "accept" attribute is as defined by RFC 2616, Section 3.7.
  accept?: string
  // The value of the "allow" attribute is as defined by RFC 2616, Section 14.7.
  allow?: string
  hreflang?: string
  title?: string
}

export interface IDisplayProperty {
  name?: string
  gender?: string
  lifespan?: string
  birthDate?: string
  birthPlace?: string
  deathDate?: string
  deathPlace?: string
  marriageDate?: string
  marriagePlace?: string
  ascendancyNumber?: string
  descendancyNumber?: string
  familiesAsParent?: IFamilyView[]
  familiesAsChild?: IFamilyView[]
}

export interface IFamilyView {
  parent1?: IResourceReference
  parent2?: IResourceReference
  children?: IResourceReference[]
}

export enum IdentifierRs {
  Persistent = "http://gedcomx.org/Persistent"
}

export interface IPlaceDisplay {
  name?: string
  fullName?: string
  type?: "city" | "country" | string
}

export interface IDateRs extends IDate {
  normalized?: ITextValue[]
}

export interface IPlaceReferenceRs extends IPlaceReference {
  normalized?: ITextValue[]
}

export interface INameRs extends IName {
  preferred?: boolean
}

export interface IPersonRs extends IPerson {
  living?: boolean
  display?: IDisplayProperty
}
