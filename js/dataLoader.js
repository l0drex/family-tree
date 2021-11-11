/**
 * Parses the graph data extracted and returns a graph object
 * @param graphData {{people: *[], families: *[]}}
 * @return {{nodes: *, groups: *[], links: *[]}}
 */
function parseData(graphData) {
  graphData.people.forEach((v) => {
    v.width = personNodeSize[0];
    v.height = personNodeSize[1];
    v.age = Number(v.age);

    v.additionalNames = "";
    if (v.born !== "")
      v.additionalNames += "geb " + v.born;
    if (v.named !== "") {
      if (v.additionalNames !== "")
        v.additionalNames += ", "
      v.additionalNames += "genannt " + v.named;
    }

    v.type = "person"
    v.infoVisible = false;
  });

  // create links between partners and child -> parents
  let links = [];
  let partners = [];
  graphData.families.forEach((family, index) => {
    family.height = family.width = partnerNodeRadius * 2;
    let familyIndex = graphData.people.length + index;
    // remove person unbekannt with ID 0
    family.partners = family.partners.filter(p => p !== 0);
    family.children = family.children.filter(c => c !== 0);
    // link each parent and each child to their family node
    family.partners.forEach(p => links.push({
      source: p,
      target: familyIndex
    }))
    family.children.forEach(p => links.push({
      source: familyIndex,
      target: p
    }));
    partners.push({"leaves": family.partners});
    family.type = "family";
  });

  // remove person unbekannt
  var graph = {
    "nodes": graphData.people.concat(graphData.families),
    "links": links,
    "groups": partners
  };

  // TODO do this in the data
  graph.groups.forEach(g => {
    g.leaves.forEach(l => console.assert(typeof l === "number"), "One of the partner ids is not a number");
  })

  return graph;
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
  // load the people file first
  d3.csv(peopleTable, (error, personData) => {
    if (error !== null) {
      console.error("Error while loading graph data!");
      console.error(error);
      return;
    }

    let children = {};
    // every is similar to forEach, but expects true as return value
    personData.every(person => {
      if (!person.ID)
        return false;
      person.ID = Number(person.ID);

      // map family index -> children array
      if (person.child_of) {
        person.child_of = Number(person.child_of);
        if (typeof children[person.child_of] == "undefined")
          children[person.child_of] = [person.ID];
        else
          children[person.child_of].push(person.ID);
      }
      delete person.child_of;

      return true;
    });

    // now load the family file
    d3.csv(familyTable, (error, familyData) => {
      if (error !== null) {
        console.error("Error while loading graph data!");
        console.error(error);
        return;
      }

      familyData.every(family => {
        if (!family.ID)
          return false;
        family.ID = Number(family.ID);

        family.partners = [Number(family.partner1), Number(family.partner2)];
        delete family.partner1;
        delete family.partner2;

        family.married = family.married === "true";

        if (family.ID in children)
          family.children = children[family.ID];
        else
          family.children = [];

        return true;
      });

      var data = {
        people: personData,
        families: familyData
      };
      let graph = parseData(data);

      // check the result
      console.assert(typeof graph !== "undefined",
        "Result of parsing is empty");

      then(graph);
    });
  });
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
