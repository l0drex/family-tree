/**
 * Parses the graph data of the files and returns a graph object
 * @param graphData
 * @return {{nodes: *, groups: *[], links: *[]}}
 */
function parseData(graphData) {
  graphData.people.forEach((v) => {
    v.width = personNodeSize[0];
    v.height = personNodeSize[1];
    v.age = Number(v.age);
  });

  // create links between partners and child -> parents
  let links = [];
  let partners = [];
  graphData.families.forEach((family, index) => {
    family.height = family.width = partnerNodeRadius * 2;
    let familyIndex = graphData.people.length + index;
    // link each parent and each child to their family node
    family.partners.concat(family.children).forEach((p) => links.push({
      "source": p,
      "target": familyIndex
    }));
    partners.push({"leaves": family.partners});
  });

  var graph = {
    "nodes": graphData.people.concat(graphData.families),
    "links": links,
    "groups": partners
  };

  // remove person unbekannt
  // TODO do this in the data
  graph.links = graph.links.filter(l => ![l.source, l.target].includes(0));
  graph.groups = graph.groups.filter(g => !g.leaves.includes(0));
  firstFamily = graphData.people.length;

  return graph;
}

/**
 * Loads a json file, parses the data and sets up the graph
 * @deprecated
 * @param path
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
 * @param peopleTable
 * @param familyTable
 */
function loadCsv(peopleTable, familyTable) {
  d3.csv(peopleTable, (error, personData) => {
    if (error !== null) {
      console.error("Error while loading graph data!");
      console.error(error);
      return;
    }

    let children = {};
    personData.every(person => {
      if (typeof person.ID === "undefined")
        return false;

      person.ID = Number(person.ID);

      // map family index -> children array
      let familyIndex = person.child_of;
      if (familyIndex !== "") {
        familyIndex = Number(familyIndex);
        if (typeof children[familyIndex] == "undefined")
          children[familyIndex] = [person.ID];
        else
          children[familyIndex].push(person.ID);
      }
      delete person.child_of;

      return true;
    });

    d3.csv(familyTable, (error, familyData) => {
      if (error !== null) {
        console.error("Error while loading graph data!");
        console.error(error);
        return;
      }

      familyData.every(family => {
        if (!family.ID)
          return false;

        family.partners = [Number(family.partner1), Number(family.partner2)];
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
      console.assert(typeof graph !== "undefined",
        "Result of parsing is empty");
      setup(graph);
    });
  });
}
