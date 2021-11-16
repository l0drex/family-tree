/**
 * Parses the graph data extracted and returns a graph object
 * @param graphData {{people: *[], families: *[]}}
        source: familyIndex,
 * @return {{nodes: *, links: *[]}}
 */
function parseData(graphData) {
  // create links between partners and child -> parents
  let links = [];

  if (showFullGraph) {
    graphData.families.forEach((family, index) => {
      let familyIndex = graphData.people.length + index;

      // link each parent and each child to their family node
      family.partners.forEach(p => links.push({
        source: p,
        target: familyIndex
      }))
      family.children.forEach(p => links.push({
        source: familyIndex,
        target: p
      }));
    });
  }

  return {
    "nodes": graphData.people.concat(graphData.families),
    "links": links
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

  /*
  This function will be called whenever one of the loaders has finished loading.
  If all data is available, it will load the graph.
   */
  let dataCollector = (error, data) => {
    if (error !== null) {
      console.error("Error while loading graph data!");
      console.error(error);
    }

    if ("gender" in data[0]) {
      console.info("Received person data");
      personData = data;
    } else if ("partners" in data[0]) {
      console.info("Received family data");
      familyData = data;
    }
    if (!(familyData && personData))
      return;

    // append children to each family
    // only possible if personData has been loaded completely
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

  d3.csv(peopleTable, person => {
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
      additionalNames: getAdditionalNames(person.born, person.named),
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
      infoVisible: false
    }
  }, dataCollector);
  d3.csv(familyTable, family => {
    return {
      id: Number(family.ID),
      // filter out person  with id 0
      partners: [Number(family.partner1), Number(family.partner2)].filter(id => id),
      married: family.married === "true",
      height: partnerNodeRadius * 2,
      width: partnerNodeRadius * 2,
      type: "family"
    }
  }, dataCollector);
}

function loadInfoHtml(path) {
  d3.html(path, (error, page) => {
    if (error !== null) {
      console.error(error);
      return;
    }
    infoHtml = page;
  });
}

function getAdditionalNames(born, named) {
  if (born) born = "geb. " + born;
  if (named) named = "genannt" + named;

  return [born, named].filter(s => s !== "").join(", ");
}
