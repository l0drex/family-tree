import {DisplayProperties, FamilyView, Person} from "gedcomx-js";
import * as GedcomX from "gedcomx-js";
import config from "../config";
import {baseUri, GenderTypes, getGeneration} from "./gedcomx-extensions";
import * as cola from "webcola";

GedcomX.enableRsExtensions();

type PersonType = "person";
type FamilyType = "family" | "etc";
type GraphObjectType = PersonType | FamilyType;

export interface GraphObject extends cola.Node {
  type: GraphObjectType | `${GraphObjectType}-removed`
}

export class GraphPerson extends DisplayProperties implements GraphObject {
  type: PersonType | `${PersonType}-removed` = "person"
  data: Person
  width = config.gridSize * 5
  height = config.gridSize / 2 * 2.25
  x: number;
  y: number;

  constructor(person: Person) {
    super({
      name: person.getFullName(),
      gender: readableGender(person.getGender()),
      ascendancyNumber: getGeneration(person)
    });
    this.data = person;
  }

  equals = (person: Person | GraphPerson | DisplayProperties) => {
    if (person instanceof DisplayProperties) {
      return person.getName() === this.getName()
        && person.getBirthDate() === this.getBirthDate();
    }

    if (person instanceof GraphPerson) {
      person = person.data;
    }
    return person.getId() === this.data.getId();
  }

  toString = () => {
    return `${this.data.getFullName()} (#${this.data.getId()})`
  }
}

export class GraphFamily extends FamilyView implements GraphObject {
  type: FamilyType | `${FamilyType}-removed` = "family"
  width = config.margin * 2
  height = config.margin * 2
  marriage
  x: number;
  y: number;

  equals = (object: FamilyView): Boolean => {
    return this.getParent1().getResource() === object.getParent1().getResource() &&
      this.getParent2().getResource() === object.getParent2().getResource();
  }

  toString = () => {
    return `Family of ${this.getParent1().getResource()} and ${this.getParent2().getResource()}`
  }
}

function readableGender(gender): string {
  gender = gender || {type: GenderTypes.Unknown};
  return gender.type.substring(baseUri.length).toLowerCase();
}
