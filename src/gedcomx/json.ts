import {
  IAgent,
  IAttribution, IDocument,
  IEvent, IGroup,
  IPerson, IPlaceDescription,
  IRelationship,
  ISourceDescription,
  localeTag
} from "./interfaces";

export type URI<T = {}> = string;

export interface IResourceReference<T = {}> {
  resource: string
}

export interface IGedcomxData {
  id?: string
  lang?: localeTag
  attribution?: IAttribution
  description?: URI
}

export interface IGedcomx extends IGedcomxData {
  persons?: IPerson[]
  relationships?: IRelationship[]
  sourceDescriptions?: ISourceDescription[]
  agents?: IAgent[]
  events?: IEvent[]
  documents?: IDocument[]
  places?: IPlaceDescription[]
  groups?: IGroup[]
}
