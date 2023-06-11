import Dexie, {Table} from 'dexie';
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
      persons: '++, &id, lang, *names',
      relationships: '++, &id, lang, type, person1.resource, person2.resource, [type+person1.resource], [type+person2.resource]',
      sourceDescriptions: '++, &id, mediaType',
      agents: '++, &id',
      events: '++, &id, lang, date',
      documents: '++, &id, lang',
      places: '++, &id, lang',
      groups: '++, &id, lang'
    });
    this.persons.mapToClass(Person)
    this.relationships.mapToClass(Relationship)
  }

  load(data: IGedcomX) {
    let root = new GedcomX.Root(data);

    if (data.persons) this.persons.bulkAdd(root.persons);
    if (data.relationships) this.relationships.bulkAdd(root.relationships);
    if (data.sourceDescriptions) this.sourceDescriptions.bulkAdd(root.sourceDescriptions);
    if (data.agents) this.agents.bulkAdd(root.agents);
    if (data.events) this.events.bulkAdd(root.events);
    if (data.documents) this.documents.bulkAdd(root.documents);
    if (data.places) this.places.bulkAdd(root.places);
    if (data.groups) this.groups.bulkAdd(data.groups);

    console.log(`Found ${data.persons.length} people`);
    console.log(`Found ${data.relationships.length} relationships`);
  }

  get couples() {
    return this.relationships.where("type").equals(RelationshipTypes.Couple);
  }

  get parentChilds() {
    return this.relationships.where("type").equals(RelationshipTypes.ParentChild);
  }

  async personWithId(id: string | ResourceReference) {
    id = toResource(id);

    return this.persons.where("id").equals(id.resource.substring(1)).first().then(p => p as Person);
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
    if (typeof person === "string"){
      if (!person.startsWith("#")) person = "#" + person;
    } else person = (person as ResourceReference).resource;

    return this.relationships.where({
      "type": RelationshipTypes.ParentChild,
      "person1.resource": person
    }).toArray()
      .then(rs =>
        rs.map(r => new GedcomX.ResourceReference(r.person2)));
  }

  async getParentsOf(person: ResourceReference | string) {
    return this.relationships.where({
      "type": RelationshipTypes.ParentChild,
      "person2.resource": (person instanceof ResourceReference) ? person.resource : ("#" + person)
    })
      .toArray()
      .then(rs => rs.map(r => new GedcomX.ResourceReference(r.person1)));
  }

  async getFamiliesAsParent(person: GedcomX.Person): Promise<GedcomX.FamilyView[]> {
    if (person.getDisplay() && person.getDisplay().getFamiliesAsParent().length > 0) {
      return person.getDisplay().getFamiliesAsParent();
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
    if (!(person.getDisplay())) {
      person.setDisplay(new GedcomX.DisplayProperties())
    }
    person.getDisplay().setFamiliesAsParent(families);

    return families;
  }

  async getFamiliesAsChild(person: GedcomX.Person): Promise<GedcomX.FamilyView[]> {
    if (person.getDisplay() && person.getDisplay().getFamiliesAsChild().length > 0) {
      return person.getDisplay().getFamiliesAsChild();
    }

    let parentRelations = await this.getParentsOf(person.getId())
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
      .map(p => new Person(p.toJSON()))
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
      Number(personWithKnownAge.getFactsByType(PersonFactTypes.GenerationNumber)[0].getValue()));
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
  if (typeof resource  === "undefined") throw new Error("resource is undefined!")

  if (resource instanceof ResourceReference) return resource;
  if (typeof resource === "object") return new ResourceReference(resource);

  if (typeof resource === "string") {
    if (!resource.startsWith("#")) resource = "#" + resource;
    return new ResourceReference().setResource(resource);
  }

  throw new Error("Resource type is invalid!")
}

export const db = new FamilyDB();
