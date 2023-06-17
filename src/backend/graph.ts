import * as GedcomX from "gedcomx-js";
import config from "../config";
import * as cola from "webcola";
import {baseUri, GenderTypes} from "./gedcomx-enums";
import {FamilyView, GDate, Person} from "./gedcomx-extensions";

type PersonType = "person";
type FamilyType = "family" | "etc";
type GraphObjectType = PersonType | FamilyType;

export interface GraphObject extends cola.Node {
  type: GraphObjectType
}

export class GraphPerson extends GedcomX.DisplayProperties implements GraphObject {
  type: PersonType = "person"
  data: Person
  width = config.gridSize * 5
  height = config.gridSize / 2 * 2.25
  x: number = 0;
  y: number = 0;

  constructor(person: GedcomX.Person) {
    let customPerson: Person;
    if (person instanceof Person) {
      customPerson = person;
    } else {
      customPerson = new Person(person);
    }

    super({
      name: customPerson.fullName,
      gender: readableGender(person.gender),
      ascendancyNumber: customPerson.generation
    });
    this.data = customPerson;
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
    return `${this.data.fullName} (#${this.data.getId()})`
  }
}

export class GraphFamily extends FamilyView implements GraphObject {
  type: FamilyType = "family"
  width = config.margin * 2
  height = config.margin * 2
  marriage: GDate
  x: number = 0;
  y: number = 0;

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
