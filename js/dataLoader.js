/**
 * Parses the graph data extracted and returns a graph object
 * @param graphData {{people: *[], families: *[]}}
        source: familyIndex,
 * @return {{nodes: *, links: *[]}}
 */
function parseData(graphData) {
  return {
    "nodes": graphData.people.concat(graphData.families),
    "links": []
  };
}

/**
 * Loads a json file, parses the data and sets up the graph
 * @deprecated
 * @param path {string}
 */
function loadJson(path) {
  d3.json(path, (error, data) => {
    if (error !== null) {
      console.error("Error while loading graph data!");
      console.error(error);
      return;
    }

    let graph = parseData(data);
    console.assert(typeof graph !== "undefined",
      "Result of parsing is empty");
    setup(graph);
  });
}

/**
 * Loads the csv file, parses the data and sets up the graph
 * @param peopleTable {string} path to a csv file containing info about each person
 * @param familyTable {string} path to a csv file containing info about each family
 * @param then {function } function to call when the data has been loaded. takes data as the only parameter
 */
function loadCsv(peopleTable, familyTable, then) {
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
      dead: (person.day_of_death !== "" || Number(person.age) > 120),
      age: Number(person.age),
      profession: person.profession,
      religion: person.religion,
      width: personNodeSize[0],
      height: personNodeSize[1],
      type: "person",
      infoVisible: false,
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
      begin: family.begin,
      height: partnerNodeRadius * 2,
      width: partnerNodeRadius * 2,
      type: "family"
    }
  });

  // append children to each family
  familyData.forEach(family => {
    family.children = Number(family.id) in children ? children[Number(family.id)] : [];
  });

  let graph = parseData({
    people: personData,
    families: familyData
  });

  // check the result
  console.assert(graph !== undefined,
    "Result of parsing is empty");

  then(graph);
}
