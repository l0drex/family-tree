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

        if (family.ID === 0) {
          // FIXME this is super weird
          console.assert(family.partner1 === "2")
          family.partners = [Number(family.partner1), Number(family.partner2)];
          console.debug("Array:", family.partners)
          console.debug("0th Element:", family.partners[0])
          console.debug("Type:", typeof family.partners[0])
          console.debug("Bits:", family.partners[0].toString(2))
          console.debug("String of Array:", family.partners.toString())
          console.assert(typeof family.partners[0] === "number")
        } else {
          family.partners = [Number(family.partner1), Number(family.partner2)];
          delete family.partner1;
          delete family.partner2;
        }
        console.assert(!family.partners.includes(undefined), "One of the partners is undefined!")

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
      graph.groups.forEach(g => {
        g.leaves.forEach(l => console.assert(typeof l === "number"), "One of the partner ids is not a number");
      })
      console.assert(typeof graph !== "undefined",
        "Result of parsing is empty");
      setup(graph);
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
