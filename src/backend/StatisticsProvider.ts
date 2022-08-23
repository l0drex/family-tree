import {graphModel} from "./ModelGraph";
import {GenderTypes, PersonFactTypes} from "./gedcomx-enums";
import {GeoPermissibleObjects} from "d3";
import {Person} from "gedcomx-js";

/**
 * Counts how many of each value is in the array
 * @param array
 */
function count(array: string[]): { label: string; value: number }[] {
  let counter = {}
  array.forEach(key => {
    if (key in counter) {
      counter[key]++;
    } else {
      counter[key] = 1;
    }
  });

  return Object.keys(counter).map(k => {
    return {
      label: k,
      value: counter[k]
    }
  });
}

export function getGenderPerGeneration() {
  let data: { [generation: string]: { [gender: string]: number } } = {};

  graphModel.persons.forEach(p => {
    let genFact = p.getFactsByType(PersonFactTypes.Generation)[0];
    let generation;
    try {
      generation = genFact.getValue();
    } catch (e) {
      if (e instanceof TypeError) {
        return;
      } else {
        throw e;
      }
    }
    if (!(generation in data)) {
      data[generation] = {};
    }

    let gender = p.getGender().getType() ?? GenderTypes.Unknown;
    if (gender in data[generation]) {
      data[generation][gender]++;
    } else {
      data[generation][gender] = 1;
    }
  })

  return Object.keys(data).map(key => {
    return {
      generation: Number(key),
      gender: data[key]
    }
  })
}

function getLifeSpanDecades(person: Person): [birthDecade: number, deathDecade: number] {
  let birthFact = person.getFactsByType(PersonFactTypes.Birth)[0];
  let deathFact = person.getFactsByType(PersonFactTypes.Death)[0];
  let birthDecade: number;
  let deathDecade: number;

  try {
    birthDecade = Math.floor(birthFact.getDate().toDateObject().getFullYear() / 10) * 10;
    deathDecade = Math.floor(deathFact.getDate().toDateObject().getFullYear() / 10) * 10;
  } catch (e) {
    if (e instanceof TypeError) {
      if (birthDecade === undefined) {
        return;
      }
      // ends in this decade
      deathDecade = Math.floor(new Date().getFullYear() / 10) * 10;
    } else {
      throw e;
    }
  }

  return [birthDecade, deathDecade];
}

export function getReligionPerYear() {
  let data: { [decade: string]: { [religion: string]: number } } = {};

  graphModel.persons.forEach(p => {
    let lifespan = getLifeSpanDecades(p);
    if (lifespan === undefined) return;
    let birthDecade = lifespan[0], deathDecade = lifespan[1];

    let religion;
    try {
      religion = p.getFactsByType(PersonFactTypes.Religion)[0].getValue();
    } catch (e) {
      if (e instanceof TypeError) {
        religion = "";
      } else {
        throw e;
      }
    }

    for (let decade = birthDecade; decade <= deathDecade; decade += 10) {
      if (!(decade in data)) data[decade] = {}

      if (religion in data[decade]) {
        data[decade][religion]++;
      } else {
        data[decade][religion] = 1;
      }
    }
  });

  return Object.keys(data)
    //.filter(key => Object.keys(data[key]).filter(r => r !== "?").length > 0)
    .map(key => {
      return {
        birthDecade: new Date(Number(key), 0),
        religion: data[key]
      }
    });
}

export function getOccupations() {
  return count(graphModel.persons.map(p => {
    let occupation;
    try {
      occupation = p.getFactsByType(PersonFactTypes.Occupation)[0].getValue()
    } catch (e) {
      if (e instanceof TypeError) {
        return;
      } else {
        throw e;
      }
    }
    return occupation;
  })).filter(d => d.label !== "undefined")
}

export function getBirthPlace() {
  let birthPlaces = count(graphModel.persons.map(p => {
    let birthPlace;
    try {
      birthPlace = p.getFactsByType(PersonFactTypes.Birth)[0].getPlace().getOriginal();
    } catch (e) {
      return undefined;
    }
    return birthPlace;
  }).filter(p => p !== undefined));

  return birthPlaces.map<GeoPermissibleObjects>(p => {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0]
      },
      properties: {
        name: p.label,
        count: p.value
      }
    }
  });
}

export function getLastNames() {
  return count(graphModel.persons.map(p =>
    p.getFullName().split(" ").pop()).filter(n => n !== "?"))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)
}

export function getFirstNames() {
  return count(graphModel.persons.map(p =>
    p.getFullName().split(" ").filter(n => n !== "Dr.")[0]).filter(n => n !== "?"))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)
}
