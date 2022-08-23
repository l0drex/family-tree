import {graphModel} from "./ModelGraph";
import {GenderTypes, NamePartTypes, PersonFactTypes} from "./gedcomx-enums";
import {GeoPermissibleObjects} from "d3";
import {NamePart} from "gedcomx-js";

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

export function getReligionPerBirthYear() {
  let data: { [birthDecade: string]: { [religion: string]: number } } = {};

  graphModel.persons.forEach(p => {
    let birthFact = p.getFactsByType(PersonFactTypes.Birth)[0];
    let birthDecade;

    try {
      birthDecade = birthFact.getDate().getFormal().substring(1, 4) + "0";
    } catch (e) {
      if (e instanceof TypeError) {
        return;
      } else {
        throw e;
      }
    }
    if (!(birthDecade in data)) {
      data[birthDecade] = {};
    }

    let religion;
    try {
      religion = p.getFactsByType(PersonFactTypes.Religion)[0].getValue();
    } catch (e) {
      if (e instanceof TypeError) {
        religion = "?";
      } else {
        throw e;
      }
    }

    if (religion in data[birthDecade]) {
      data[birthDecade][religion]++;
    } else {
      data[birthDecade][religion] = 1;
    }
  })

  return Object.keys(data).map(key => {
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