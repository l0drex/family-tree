import {Confidence, GenderTypes, PersonFactQualifiers, PersonFactTypes} from "./gedcomx-enums";
import {GeoPermissibleObjects} from "d3";
import {Person} from "./gedcomx-extensions";
import {db} from "./db";

/**
 * Counts how many of each value is in the array
 * @param array
 */
function count(array: (string | number)[]): { value: string | number; count: number }[] {
  let counter = {}
  array.forEach(key => {
    if (key in counter) {
      counter[key]++;
    } else {
      counter[key] = 1;
    }
  });

  return Object.keys(counter).map(k => {
    let key;
    if (typeof array[0] === "number") key = Number(k);
    else key = k;
    return {
      value: key,
      count: counter[key]
    }
  });
}

export async function getGenderPerGeneration() {
  return db.persons.toArray().then(persons => {
    let data: { [generation: number]: { [gender: string]: number } } = {};

    persons.forEach(p => {
      p = new Person(p);
      let genFact = p.getFactsByType(PersonFactTypes.GenerationNumber)[0];
      let generation;
      try {
        generation = Number(genFact.getValue());
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

      let gender = p.getGender() ? p.getGender().getType() : GenderTypes.Unknown;
      if (gender in data[generation]) {
        data[generation][gender]++;
      } else {
        data[generation][gender] = 1;
      }
    });

    return data;
  }).then(data => Object.keys(data).map(key => {
    return {
      generation: Number(key),
      gender: data[key] as { [gender: string]: number }
    }
  }));
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

export async function getReligionPerYear() {
  return db.persons.toArray().then(persons => {
    let data: { [decade: number]: { [religion: string]: number } } = {};

    persons
      .map(p => new Person(p))
      .forEach(p => {
        let lifespan = getLifeSpanDecades(p);
        if (lifespan === undefined) return;
        let birthDecade = lifespan[0], deathDecade = lifespan[1];

        let religion;
        try {
          religion = p.getFactsByType(PersonFactTypes.Religion)[0].getValue();
        } catch (e) {
          if (e instanceof TypeError) {
            return;
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

    return data
  }).then(data => Object.keys(data)
    .map(key => {
      return {
        birthDecade: new Date(Number(key), 0),
        religion: data[key]
      }
    }));
}

export async function getOccupations() {
  return db.persons.toArray().then(persons => count(persons.map(p => {
    let occupation;
    try {
      occupation = p.getFactsByType(PersonFactTypes.Occupation)[0].getValue()
    } catch (e) {
      if (e instanceof TypeError) {
        return undefined;
      } else {
        throw e;
      }
    }
    return occupation;
  }))).then(count => count.filter(d => d.value !== "undefined"));
}

export async function getBirthPlace() {
  let birthPlaces = await db.persons.toArray()
    .then(persons => count(
      persons.map(p => {
        let birthPlace;
        try {
          birthPlace = p.getFactsByType(PersonFactTypes.Birth)[0].getPlace().getOriginal();
        } catch (e) {
          return undefined;
        }
        return birthPlace;
      }).filter(p => p !== undefined)
    ));

  return birthPlaces.map<GeoPermissibleObjects>(p => {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0]
      },
      properties: {
        name: p.value,
        count: p.count
      }
    }
  });
}

export async function getNames(type: "First" | "Last") {
  let data = await db.persons.toArray().then(persons =>
    count(
      persons
        .map(p => new Person(p))
        .map(p => {
          let names = p.fullName.split(" ");
          if (type === "Last") return names.pop()
          else return names.filter(n => n !== "Dr.")[0]
        })
        .filter(n => n !== "?"))
      .sort((a, b) => b.count - a.count));
  return data
    .splice(0, 30)
}

export async function getBirthDeathMonthOverYears(type: "Birth" | "Death") {
  let data: number[] = Array.from({length: 12}, () => 0);

  await db.persons.toArray().then(persons => persons
    .map(p => new Person(p))
    .forEach(p => {
      let birth;
      try {
        let date = p.getFactsByType(type === "Birth" ? PersonFactTypes.Birth : PersonFactTypes.Death)[0].getDate();
        // ignore if month is not defined
        if (date.getFormal().length < 8) return;
        birth = date.toDateObject();
      } catch (e) {
        if (e instanceof TypeError) return;
        else throw e;
      }
      let month = birth.getMonth();
      data[month]++;
    }));

  return data;
}

export async function getLifeExpectancyOverYears() {
  let data: { birth: Date, age: number, name: string }[] = [];

  await db.persons.toArray().then(persons => persons
    .map(p => new Person(p))
    .forEach(p => {
      let birth, age, name;
      try {
        name = p.fullName;
        birth = p.getFactsByType(PersonFactTypes.Birth)[0].getDate().toDateObject();
        let deathFact = p.getFactsByType(PersonFactTypes.Death)[0];
        age = deathFact.getQualifiers().find(q => q.getName() === PersonFactQualifiers.Age).getValue();
      } catch (e) {
        if (e instanceof TypeError) {
          return;
        }
        throw e;
      }

      data.push({birth: birth, age: age, name: name});
    }));

  return data;
}

export async function getMarriageAge() {
  let data: number[] = await db.persons.toArray().then(persons => persons
    .map(p => new Person(p))
    .map(p => {
      try {
        return p.getFactsByType(PersonFactTypes.MaritalStatus)
          .filter(f => f.getValue() !== "single")
          .map(f => Number(f.getQualifiers().find(q => q.getName() === PersonFactQualifiers.Age).getValue()));
      } catch (e) {
        if (!(e instanceof TypeError)) {
          throw e
        }
      }

      return [];
    }).flat(1).filter(a => a >= 0));

  let counter = count(data);

  let min = Math.min(...data);
  let max = Math.max(...data);

  for (let i = min; i < max; i++) {
    let d = counter.some(d => d.value === i);
    if (!d) {
      counter.push({value: i, count: 0})
    }
  }

  return counter.sort((a, b) => Number(a.value) - Number(b.value));
}

export async function getConfidence() {
  let data: Confidence[] = await db.persons.toArray().then(persons => persons.map(p => p.confidence as Confidence));
  return count(data);
}
