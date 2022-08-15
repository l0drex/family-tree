import GedcomX, {getGeneration} from "./gedcomx-extensions";
import config from "../config";
import * as cola from "webcola";
import {baseUri, GenderTypes} from "./gedcomx-enums";

type PersonType = "person";
type FamilyType = "family" | "etc";
type GraphObjectType = PersonType | FamilyType;

export interface GraphObject extends cola.Node {
  type: GraphObjectType
}

export class GraphPerson extends GedcomX.DisplayProperties implements GraphObject {
  type: PersonType = "person"
  data: GedcomX.Person
  width = config.gridSize * 5
  height = config.gridSize / 2 * 2.25
  x: number;
  y: number;

  constructor(person: GedcomX.Person) {
    super({
      name: person.getFullName(),
      gender: readableGender(person.getGender()),
      ascendancyNumber: getGeneration(person)
    });
    this.data = person;
  }

  equals = (person: GedcomX.Person | GraphPerson | GedcomX.DisplayProperties) => {
    if (person instanceof GedcomX.DisplayProperties) {
      return person.getName() === this.getName()
        && person.getAscendancyNumber() === this.getAscendancyNumber();
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

export class GraphFamily extends GedcomX.FamilyView implements GraphObject {
  type: FamilyType = "family"
  width = config.margin * 2
  height = config.margin * 2
  marriage
  x: number;
  y: number;

  equals = (object: GedcomX.FamilyView): Boolean => {
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

function extend(GedcomX) {
  GedcomX.Person.prototype.getDisplay = function (): GraphPerson {
    if (this.displayProperties === undefined || !(this.displayProperties instanceof GraphPerson)) {
      this.setDisplay(new GraphPerson(this));
    }

    return this.display;
  }
}
GedcomX.addExtensions(extend);
