/**
 * Parses the graph data of the files and returns a graph object
 * @param graphData
 * @return {{nodes: *, groups: *[], links: *[]}}
 */
function parseData(graphData) {
  graphData.people.forEach((v) => {
    v.width = personNodeSize[0];
    v.height = personNodeSize[1];
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
    personData.every((row, index) => {
      if (typeof row.ID === "undefined")
        return false;

      row.ID = Number(row.ID);

      // map family index -> children array
      let familyIndex = row.child_of;
      if (familyIndex !== "") {
        familyIndex = Number(familyIndex);
        if (typeof children[familyIndex] == "undefined")
          children[familyIndex] = [index];
        else
          children[familyIndex].push(index);
      }
      delete row.child_of;

      return true;
    });

    d3.csv(familyTable, (error, familyData) => {
      if (error !== null) {
        console.error("Error while loading graph data!");
        console.error(error);
        return;
      }

      familyData.every((row, index) => {
        if (!row.ID)
          return false;

        row.partners = [Number(row.partner1), Number(row.partner2)];
        row.married = row.married === "true";
        if (index in children)
          row.children = children[index];
        else
          row.children = [];

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

function setup(graph) {
  modelgraph = viewgraph = graph;
  // TODO allow to select this from the user
  let startNode = modelgraph.nodes[158];
  //addViewNode(startNode);
  //refocus(startNode);
  update();
}
