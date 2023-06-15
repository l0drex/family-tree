import Dexie, {PromiseExtended, Table} from 'dexie';
import {
  IGedcomX,
  IGroup
} from "./gedcomx-types";
import * as GedcomX from "gedcomx-js";
import {Person, Relationship, setReferenceAge} from "./gedcomx-extensions";
import {PersonFactTypes, RelationshipTypes} from "./gedcomx-enums";
import {ResourceReference} from "gedcomx-js";

export class FamilyDB extends Dexie {
  persons!: Table<GedcomX.Person>
  relationships!: Table<GedcomX.Relationship>
  sourceDescriptions!: Table<GedcomX.SourceDescription>
  agents!: Table<GedcomX.Agent>
  events!: Table<GedcomX.Event>
  documents!: Table<GedcomX.Document>
  places!: Table<GedcomX.PlaceDescription>
  groups!: Table<IGroup>

  constructor() {
    super('familyData');
    this.version(1).stores({
      persons: '++, &id, lang',
      relationships: '++, &id, lang, type, person1.resource, person2.resource, [type+person1.resource], [type+person2.resource]',
      sourceDescriptions: '++, &id, mediaType',
      agents: '++, &id',
      events: '++, &id, lang, date',
      documents: '++, &id, lang',
      places: '++, &id, lang',
      groups: '++, &id, lang'
    });
  }

  async load(data: IGedcomX) {
    let root = new GedcomX.Root(data);
    await this.clear();
    let promises: PromiseExtended[] = [];

    if (data.persons) promises.push(this.persons.bulkAdd(root.persons));
    if (data.relationships) promises.push(this.relationships.bulkAdd(root.relationships));
    if (data.sourceDescriptions) promises.push(this.sourceDescriptions.bulkAdd(root.sourceDescriptions));
    if (data.agents) promises.push(this.agents.bulkAdd(root.agents));
    if (data.events) promises.push(this.events.bulkAdd(root.events));
    if (data.documents) promises.push(this.documents.bulkAdd(root.documents));
    if (data.places) promises.push(this.places.bulkAdd(root.places));
    if (data.groups) promises.push(this.groups.bulkAdd(data.groups));

    console.log(`Found ${data.persons.length} people`);
    console.log(`Found ${data.relationships.length} relationships`);

    return Promise.all(promises)
      // make sure database is clean
      .catch(e => this.clear().then(() => Promise.reject(e)));
  }

  private async clear() {
    let promises: PromiseExtended[] = [
      this.persons.toCollection().delete(),
      this.relationships.toCollection().delete(),
      this.sourceDescriptions.toCollection().delete(),
      this.agents.toCollection().delete(),
      this.events.toCollection().delete(),
      this.documents.toCollection().delete(),
      this.places.toCollection().delete(),
      this.groups.toCollection().delete()
    ];

    return Promise.all(promises);
  }

  get couples() {
    return this.relationships.where("type").equals(RelationshipTypes.Couple);
  }

  get parentChilds() {
    return this.relationships.where("type").equals(RelationshipTypes.ParentChild);
  }

  async personWithId(id: string | ResourceReference) {
    try {
      id = toResource(id).resource.substring(1);
    } catch (e) {
      return Promise.reject(id);
    }

    return this.persons.where("id").equals(id).first().then(p => new Person(p));
  }

  async personWithName(name: string) {
    return this.persons.toArray()
      .then(persons =>
        persons.map(p => new Person(p.toJSON())).find(p => p.fullName === name))
  }

  async sourceDescriptionWithId(id: string | ResourceReference) {
    try {
      id = toResource(id).resource.substring(1);
    } catch (e) {
      return Promise.reject(id);
    }

    return this.sourceDescriptions.where("id").equals(id).first()
      .then(sd => new GedcomX.SourceDescription(sd));
  }

  async agentWithId(id: string | ResourceReference) {
    id = toResource(id).resource.substring(1);

    return this.agents.where({"id": id}).first();
  }

  async getCoupleRelationsOf(person: ResourceReference | string): Promise<GedcomX.Relationship[]> {
    let id = (person instanceof ResourceReference) ? person.resource.substring(1) : person;

    return this.couples.toArray()
      .then(rs =>
        rs.filter((r: Relationship) =>
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
        .map(r => new GedcomX.ResourceReference(r.getOtherPerson(personResource.resource))))
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
    if (person.display && person.display.familiesAsParent.length > 0) {
      return person.display.familiesAsParent;
    }

    let couples = await this.couples
      .filter(r => r.person1.resource.substring(1) === person.id || r.person2.resource.substring(1) === person.id)
      .toArray();

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
    if (person.display && person.display.familiesAsChild.length > 0) {
      return person.display.familiesAsChild;
    }

    let parentRelations = await this.getParentsOf(person.id)
      .then(parents => parents.map(p => p.resource))
      .then(parents => {
        return this.couples
          .filter(r => parents.includes(r.person1.resource) && parents.includes(r.person2.resource))
          .toArray()
      });

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

function toResource(resource: ResourceReference | string): ResourceReference {
  if (resource === undefined || resource === null) throw new Error("resource is undefined!")

  if (resource instanceof ResourceReference) return resource;
  if (typeof resource === "object") return new ResourceReference(resource);

  if (typeof resource === "string") {
    if (resource.length === 0) throw new Error("resource is empty")
    if (!resource.startsWith("#")) resource = "#" + resource;
    return new ResourceReference().setResource(resource);
  }

  throw new Error("Resource type is invalid!")
}

export const db = new FamilyDB();
