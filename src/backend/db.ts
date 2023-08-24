import Dexie, {PromiseExtended, Table} from 'dexie';
import {
  IGedcomx, IGedcomxData,
} from "../gedcomx/json";
import * as GedcomX from "gedcomx-js";
import {
  Agent,
  Document, EventExtended,
  Person,
  PlaceDescription,
  Relationship, Root,
  setReferenceAge,
  SourceDescription
} from "../gedcomx/gedcomx-js-extensions";
import {PersonFactTypes, RelationshipTypes} from "../gedcomx/types";
import {ResourceReference} from "gedcomx-js";
import {
  IAgent,
  IDocument,
  IEvent,
  IGroup,
  IPerson,
  IPlaceDescription,
  IRelationship,
  ISourceDescription
} from "../gedcomx/interfaces";

export type RootType = "person" | "relationship" | "sourceDescription" | "agent" | "event" | "document" | "place" | "group";
type RootClass = GedcomX.Person | GedcomX.Relationship | GedcomX.SourceDescription | GedcomX.Agent | GedcomX.Event | GedcomX.Document | GedcomX.PlaceDescription | IGroup;

export class FamilyDB extends Dexie {
  gedcomX!: Table<IGedcomxData>
  persons!: Table<IPerson>
  relationships!: Table<IRelationship>
  sourceDescriptions!: Table<ISourceDescription>
  agents!: Table<IAgent>
  events!: Table<IEvent>
  documents!: Table<IDocument>
  places!: Table<IPlaceDescription>
  groups!: Table<IGroup>

  constructor() {
    super('familyData');
    // DONT CHANGE THIS, INTRODUCE NEW VERSIONS INSTEAD
    this.version(1).stores({
      persons: '&id, lang',
      relationships: '&id, lang, type, person1.resource, person2.resource, [type+person1.resource], [type+person2.resource]',
      sourceDescriptions: '&id, mediaType',
      agents: '&id',
      events: '&id, lang, date',
      documents: '&id, lang',
      places: '&id, lang',
      groups: '&id, lang'
    });

    this.version(2).stores({
      gedcomX: '&id',
      persons: '&id, lang',
      relationships: '&id, lang, type, person1.resource, person2.resource, [type+person1.resource], [type+person2.resource]',
      sourceDescriptions: '&id, mediaType',
      agents: '&id',
      events: '&id, lang, date',
      documents: '&id, lang',
      places: '&id, lang',
      groups: '&id, lang'
    })

    this.version(3).stores({
      gedcomX: '&id',
      persons: '&id, lang',
      relationships: '&id, lang, type, person1.resource, person2.resource, [type+person1.resource], [type+person2.resource]',
      sourceDescriptions: '&id, mediaType',
      agents: '&id',
      events: '&id, lang, date',
      documents: '&id, lang, type',
      places: '&id, lang',
      groups: '&id, lang'
    })
  }

  async load(data: IGedcomx) {
    let clear = this.clear();
    let root = this.sanitizeData(data);
    await clear;

    let promises: PromiseExtended[] = [];

    if (data.id || data.lang || data.attribution || data.description) {
      promises.push(this.gedcomX.add(root));
    }
    if (data.persons) promises.push(this.persons.bulkAdd(root.persons.map(p => p.toJSON())));
    if (data.relationships) promises.push(this.relationships.bulkAdd(root.relationships.map(r => r.toJSON() as IRelationship)));
    if (data.sourceDescriptions) promises.push(this.sourceDescriptions.bulkAdd(root.sourceDescriptions.map(s => s.toJSON() as ISourceDescription)));
    if (data.agents) promises.push(this.agents.bulkAdd(root.agents.map(a => a.toJSON())));
    if (data.events) promises.push(this.events.bulkAdd(root.events.map(e => e.toJSON())));
    if (data.documents) promises.push(this.documents.bulkAdd(root.documents.map(d => d.toJSON() as IDocument)));
    if (data.places) promises.push(this.places.bulkAdd(root.places.map(p => p.toJSON() as IPlaceDescription)));
    if (data.groups) promises.push(this.groups.bulkAdd(data.groups));

    console.log(`Found ${data.persons?.length ?? 0} people`);
    console.log(`Found ${data.relationships?.length ?? 0} relationships`);

    return Promise.all(promises)
      // make sure database is clean
      .catch(e => this.clear().then(() => Promise.reject(e)));
  }

  private sanitizeData(data: IGedcomx) {
    let root = new Root(data);

    function forAll(callback: (items: RootClass[]) => void) {
      callback(root.persons);
      callback(root.relationships);
      callback(root.sourceDescriptions);
      callback(root.agents);
      callback(root.events);
      callback(root.documents);
      callback(root.places);
      callback(data.groups);
    }

    // generate missing ids
    function generateIdIfMissing(data: RootClass[]) {
      if (!data) return;

      let addedIds = 0;
      data.forEach(d => {
        if (!d.id) d.id = crypto.randomUUID();
      });
      console.info(`Added ${addedIds} missing ids.`);
    }
    forAll(generateIdIfMissing);
    if (!root.id) {
      root.setId(crypto.randomUUID());
    }

    return root;
  }

  async clear() {
    return Promise.all(this.tables.map(t => t.clear()));
  }

  get root() {
    return this.gedcomX.toCollection().first()
      .then(r => new Root(r));
  }

  get couples() {
    return this.relationships.where("type").equals(RelationshipTypes.Couple);
  }

  get parentChilds() {
    return this.relationships.where("type").equals(RelationshipTypes.ParentChild);
  }

  async elementWithId(id: string | ResourceReference, type: RootType) {
    // todo find a way to use generics here

    try {
      id = toId(id);
    } catch (e) {
      return Promise.reject(new Error("Could not parse resource: " + (e as Error).message));
    }

    switch (type) {
      case "person":
        return this.persons.get(id)
          .then(p => p ? new Person(p) : Promise.reject(new Error(`Person with id ${id} not found!`)));
      case "relationship":
        return this.relationships.get(id)
          .then(r => r ? new Relationship(r) : Promise.reject(new Error(`Relationship with id ${id} not found!`)));
      case "sourceDescription":
        return this.sourceDescriptions.get(id)
          .then(sd => sd ? new SourceDescription(sd) : Promise.reject(new Error(`SourceDescription with id ${id} not found!`)));
      case "agent":
        return this.agents.get(id)
          .then(a => a ? new Agent(a) : Promise.reject(new Error(`Agent with id ${id} not found!`)));
      case "event":
        return this.events.get(id)
          .then(e => e ? new EventExtended(e) : Promise.reject(new Error(`Event with id ${id} not found!`)));
      case "document":
        return this.documents.get(id)
          .then(d => d ? new Document(d) : Promise.reject(new Error(`Document with id ${id} not found!`)));
      case "place":
        return this.places.get(id)
          .then(p => p ? new PlaceDescription(p) : Promise.reject(new Error(`Place with id ${id} not found!`)));
      case "group":
        return this.groups.get(id)
          .then(g => g ? g : Promise.reject(new Error(`Group with id ${id} not found!`)));
      default:
        return Promise.reject(new Error(`Unknown type ${type}`));
    }
  }

  async personWithId(id: string | ResourceReference): Promise<Person> {
    return this.elementWithId(id, "person").then(p => p as Person);
  }

  async personWithName(name: string) {
    return this.persons.toArray()
      .then(persons =>
        persons.map(p => new Person(p)).find(p => p.fullName === name))
  }

  async sourceDescriptionWithId(id: string | ResourceReference) {
    return this.elementWithId(id, "sourceDescription").then(sd => sd as SourceDescription);
  }

  async agentWithId(id: string | ResourceReference) {
    return this.elementWithId(id, "agent").then(a => a as Agent);
  }

  async createAgent() {
    let agent = new Agent();
    agent.setId(crypto.randomUUID());

    this.agents.put(agent.toJSON());
    return agent;
  }

  async getCoupleRelationsOf(person: ResourceReference | string): Promise<GedcomX.Relationship[]> {
    let id = (person instanceof ResourceReference) ? person.resource.substring(1) : person;

    return this.couples.toArray()
      .then(rs =>
        rs.map(r => new Relationship(r)).filter(r =>
          r.members.map(m => m.resource.substring(1))
            .includes(id)));
  }

  async getChildrenOf(person: ResourceReference | string) {
    person = toResource(person);

    return this.relationships.where({
      "type": RelationshipTypes.ParentChild,
      "person1.resource": person.resource
    }).toArray()
      .then(rs =>
        rs.map(r => new GedcomX.ResourceReference(r.person2)));
  }

  async getParentsOf(person: ResourceReference | string) {
    person = toResource(person);

    return this.relationships.where({
      "type": RelationshipTypes.ParentChild,
      "person2.resource": person.resource
    })
      .toArray()
      .then(rs => rs.map(r => new GedcomX.ResourceReference(r.person1)));
  }

  async getPartnerOf(person: ResourceReference | string) {
    let personResource = toResource(person);

    return this.relationships.where({
      "person1.resource": personResource.resource
    }).or("person2.resource").equals(personResource.resource)
      .and(r => r.type === RelationshipTypes.Couple)
      .toArray()
      .then(rs => rs.map(r => new Relationship(r))
        .map(r => new GedcomX.ResourceReference(r.getOtherPerson(personResource.resource.substring(1)))))
  }

  async getGodparentsOf(person: ResourceReference | string) {
    person = toResource(person);

    return this.relationships.where({
      "type": RelationshipTypes.Godparent,
      "person2.resource": person.resource
    })
      .toArray()
      .then(rs => rs.map(r => new GedcomX.ResourceReference(r.person1)));
  }

  async getGodchildrenOf(person: ResourceReference | string) {
    person = toResource(person);

    return this.relationships.where({
      "type": RelationshipTypes.Godparent,
      "person1.resource": person.resource
    }).toArray()
      .then(rs =>
        rs.map(r => new GedcomX.ResourceReference(r.person2)));
  }

  async getEnslavers(person: ResourceReference | string) {
    person = toResource(person);

    return this.relationships.where({
      "type": RelationshipTypes.EnslavedBy,
      "person1.resource": person.resource
    }).toArray()
      .then(rs =>
        rs.map(r => new GedcomX.ResourceReference(r.person2)));
  }

  async getSlaves(person: ResourceReference | string) {
    person = toResource(person);

    return this.relationships.where({
      "type": RelationshipTypes.EnslavedBy,
      "person1.resource": person.resource
    }).toArray()
      .then(rs =>
        rs.map(r => new GedcomX.ResourceReference(r.person2)));
  }

  async getFamiliesAsParent(person: Person): Promise<GedcomX.FamilyView[]> {
    if (person.display && person.display.familiesAsParent && person.display.familiesAsParent.length > 0) {
      return person.display.familiesAsParent;
    }

    let couples = (await this.couples
      .filter(r => r.person1.resource.substring(1) === person.id || r.person2.resource.substring(1) === person.id)
      .toArray())
      .map(c => new Relationship(c));

    let families: GedcomX.FamilyView[] = [];
    for (const couple of couples) {
      let children = await this.getChildrenOfBoth(couple.person1, couple.person2);
      families.push(new GedcomX.FamilyView()
        .setParent1(couple.person1)
        .setParent2(couple.person2)
        .setChildren(children));
    }

    //console.debug(`Families where ${person} is a parent:`, families);
    if (!(person.display)) {
      person.setDisplay(new GedcomX.DisplayProperties())
    }
    person.display.setFamiliesAsParent(families);

    return families;
  }

  async getFamiliesAsChild(person: GedcomX.Person): Promise<GedcomX.FamilyView[]> {
    if (person.display && person.display.familiesAsChild && person.display.familiesAsChild.length > 0) {
      return person.display.familiesAsChild;
    }

    let parentRelations = (await this.getParentsOf(person.id)
      .then(parents => parents.map(p => p.resource))
      .then(parents => {
        return this.couples
          .filter(r => parents.includes(r.person1.resource) && parents.includes(r.person2.resource))
          .toArray()
      })).map(p => new Relationship(p));

    let families = [];

    for (const parents of parentRelations) {
      let siblings = await this.getChildrenOfBoth(parents.person1, parents.person2);

      families.push(new GedcomX.FamilyView()
        .setParent1(parents.person1)
        .setParent2(parents.person2)
        .setChildren(siblings))
    }

    //console.debug(`Families where ${person} is a child:`, families);
    if (!(person.getDisplay())) {
      person.setDisplay(new GedcomX.DisplayProperties())
    }
    person.getDisplay().setFamiliesAsChild(families);

    return families;
  }

  /**
   * @todo assumes resources are only ids (#<id>)
   * @param parent1
   * @param parent2
   */
  async getChildrenOfBoth(parent1: GedcomX.ResourceReference | string, parent2: GedcomX.ResourceReference | string): Promise<ResourceReference[]> {
    let children1 = (await this.getChildrenOf(parent1)).map((r: ResourceReference) => r.resource);
    let children2 = await this.getChildrenOf(parent2);

    return children2.filter(c => children1.includes(c.resource));
  }

  async setAgeGen0(startPerson: Person) {
    let personWithKnownAge = (await this.persons.toArray())
      .map(p => new Person(p))
      .find(p => {
        let generationStart = startPerson.generation;
        if (!generationStart) {
          return false;
        }
        let generationP = p.generation
        if (!generationP) {
          return false;
        }
        if (generationP !== generationStart) return false;

        return typeof p.getAgeAt(new Date()) === "number";
      });

    if (!personWithKnownAge) {
      console.warn("No age for generation 0 could be found");
      return;
    }
    setReferenceAge(personWithKnownAge.getAgeAt(new Date()),
      // get generation from generation fact
      Number(personWithKnownAge.getFactsByType(PersonFactTypes.GenerationNumber)[0].value));
  }

  async getAncestors(person: GedcomX.ResourceReference | string): Promise<GedcomX.ResourceReference[]> {
    person = toResource(person);

    // stack to collect ancestors of ancestors
    let ancestors = [person];
    let i = 0;
    while (i < ancestors.length) {
      (await this.getParentsOf(ancestors[i])).forEach(p => ancestors.push(p))
      i++;
    }
    return Array.from(ancestors);
  }

  async getDescendants(person: GedcomX.ResourceReference | string): Promise<GedcomX.ResourceReference[]> {
    person = toResource(person);

    // stack to collect descendants of descendants
    let descendants = new Set<GedcomX.ResourceReference>([person]);
    let iterator = descendants.values();
    let nextPerson = iterator.next()
    while (!nextPerson.done) {
      (await this.getChildrenOf(nextPerson.value)).forEach(p => descendants.add(p))
      nextPerson = iterator.next();
    }
    return Array.from(descendants);
  }
}

function toId(resource: ResourceReference | string): string {
  if (resource === undefined || resource === null) throw new Error("Resource is undefined!")

  if (resource instanceof ResourceReference || typeof resource === "object") return resource.resource.substring(1);
  if (resource.startsWith("#")) return resource.substring(1);
  if (resource.length === 0) throw new Error("Resource is empty!")
  return resource;
}

function toResource(resource: ResourceReference | string): ResourceReference {
  if (resource === undefined || resource === null) throw new Error("Resource is undefined!")

  if (resource instanceof ResourceReference) return resource;
  if (typeof resource === "object") return new ResourceReference(resource);

  if (typeof resource === "string") {
    if (resource.length === 0) throw new Error("Resource is empty!")
    if (!resource.startsWith("#")) resource = "#" + resource;
    return new ResourceReference().setResource(resource);
  }

  throw new Error("Resource type is invalid!")
}

export const db = new FamilyDB();
