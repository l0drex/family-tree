import * as d3 from "https://unpkg.com/d3";


/**
 * Builds a promise out of people and family data
 * @param families {Array} list of family objects
 * @param people {Array} list of person objects
 * @return {Promise} Fulfilled if people and families exist
 */
function buildPromise(people, families) {
  return new Promise((resolve, reject) => {
    if (people && families &&
      0 < families.length < people.length) {
      resolve({
        "people": people,
        "families": families
      });
    } else
      reject();
  });
}

/**
 * Loads a json file, parses the data and sets up the graph
 * @deprecated
 * @param path {string}
 * @return {Promise}
 */
export function loadJson(path) {
  d3.json(path, (error, data) => {
    if (error !== null) {
      console.error("Error while loading graph data!");
      console.error(error);
      return;
    }

    return buildPromise(data.people, data.families);
  });
}

/**
 * Loads the csv file, parses the data and sets up the graph
 * @param peopleTable {string} path to a csv file containing info about each person
 * @param familyTable {string} path to a csv file containing info about each family
 * @return {Promise}
 */
export function loadCsv(peopleTable, familyTable) {
  let children = {};
  let personData, familyData;

  personData = d3.csvParse(peopleTable, person => {
    const id = Number(person.ID);
    // map family index -> children array
    if (id && person.child_of !== "") {
      let child_of = Number(person.child_of);
      if (children[child_of] === undefined)
        children[child_of] = [id];
      else
        children[child_of].push(id);
    }

    return {
      id: id,
      fullName: person.full_name,
      additionalNames: {born: person.born, named: person.named},
      gender: person.gender,
      birthday: person.birthday,
      placeOfBirth: person.place_of_birth,
      dayOfDeath: person.day_of_death,
      age: Number(person.age),
      dead: (person.day_of_death !== "" || Number(person.age) > 120),
      profession: person.profession,
      religion: person.religion,
      married: false,
      parentsKnown: person.child_of !== ""
    }
  });

  familyData = d3.csvParse(familyTable, family => {
    personData[family.partner1].married = true;
    personData[family.partner2].married = true;

    return {
      id: Number(family.ID),
      // filter out person  with id 0
      partners: [Number(family.partner1), Number(family.partner2)].filter(id => id),
      begin: family.begin
    }
  });

  // append children to each family
  familyData.forEach(family => {
    family.children = Number(family.id) in children ? children[Number(family.id)] : [];
  });

  return buildPromise(personData, familyData)
}
