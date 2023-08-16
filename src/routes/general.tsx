import { Table } from "dexie";
import { pushArray, updateArray, updateDB, updateObject } from "./utils";
import { Params, redirect, RouteObject } from "react-router-dom";
import * as GedcomX from "gedcomx-js";
import { PlaceReference } from "gedcomx-js";
import { baseUri } from "../gedcomx/types";
import { IAgent, IConclusion, IPerson, IRelationship, ISourceDescription, ISubject } from "../gedcomx/interfaces";
import FactComponent from "../components/FactComponent";
import { Fact, Person, Relationship } from "../gedcomx/gedcomx-js-extensions";
import GedcomXDate from "gedcomx-date";

export function getNotesRoute(table: Table<IConclusion>): RouteObject {
  async function updateNotes({params, request}: { params: Params, request: Request }) {
    let conclusion = new GedcomX.Conclusion(await table.get(params.id));

    let note = null;
    if (request.method === "POST") {
      note = new GedcomX.Note(updateObject(await request.formData()));
    }
    return updateArray(table, params.id, "notes", conclusion.notes, Number(params.index), note);
  }

  async function pushNote({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let note = new GedcomX.Note(updateObject(formData));

    const conclusion = new GedcomX.Conclusion(await table.get(params.id));
    return pushArray(table, params.id, "notes", conclusion.notes, note);
  }

  return {
    path: "notes", action: pushNote,
    children: [{
      path: ":index", action: updateNotes
    }]
  }
}

type hasIdentifiers = IAgent | ISourceDescription | ISubject;

export function getIdentifierRoute(table: Table<hasIdentifiers>): RouteObject {
  function updateIdentifiers(identifiers: GedcomX.Identifiers, type: string, index: number, value?: string) {
    let current = identifiers.getValues(type);

    if (value != null) {
      current[index] = value;
    } else {
      current.splice(index, 1);
    }

    identifiers.setValues(current, type);
    return identifiers;
  }

  async function pushIdentifier({request, params}: { params: Params, request: Request }) {
    if (request.method !== "POST") {
      return;
    }

    const formData = await request.formData();
    const datum = await table.get(params.id);

    let type = formData.get("type") as string;
    if (type === "-")
      type = undefined;

    let identifiers = new GedcomX.Identifiers(datum.identifiers)
      .addValue(formData.get("value") as string, type);

    await updateDB(table, params.id, "identifiers", identifiers);
    return redirect("../");
  }

  async function editIdentifier({request, params}: { params: Params, request: Request }) {
    const datum = await table.get(params.id);
    const formData = await request.formData();

    let index = Number(params.index);
    let value = formData?.get("value") as string ?? null;
    let identifiers = new GedcomX.Identifiers(datum.identifiers);

    await updateDB(table, params.id, "identifiers",
      updateIdentifiers(identifiers, undefined, index, value));
    return redirect("../../");
  }

  async function editTypedIdentifier({request, params}: { params: Params, request: Request }) {
    const datum = await table.get(params.id);
    const formData = await request.formData();

    let index = Number(params.index);
    let type = baseUri + params.type;
    let value = formData?.get("value") as string ?? null;
    let identifiers = new GedcomX.Identifiers(datum.identifiers);

    await updateDB(table, params.id, "identifiers",
      updateIdentifiers(identifiers, type, index, value));
    return redirect("../../");
  }

  return {
    path: "identifiers", action: pushIdentifier,
    children: [
      {path: ":index", action: editIdentifier},
      {path: ":type/:index", action: editTypedIdentifier}]
  }
}

export function getSourceReferenceRoutes(table: Table<IConclusion>): RouteObject {
  async function pushSourceReference({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let sourceReference = new GedcomX.SourceReference(updateObject(formData));

    const conclusion = new GedcomX.Conclusion(await table.get(params.id));
    return pushArray(table, params.id, "sources", conclusion.sources, sourceReference);
  }

  async function updateSourceReference({params, request}) {
    let conclusion = new GedcomX.Conclusion(await table.get(params.id));

    let sourceReference: GedcomX.SourceReference = null;
    if (request.method === "POST") {
      sourceReference = new GedcomX.SourceReference(updateObject(await request.formData()));
    }

    return updateArray(table, params.id, "sources", conclusion.sources, Number(params.index), sourceReference);
  }

  return {
    path: "sources", action: pushSourceReference,
    children: [
      {path: ":index", action: updateSourceReference}
    ]
  }
}

export function getEvidenceRoutes(table: Table<ISubject>): RouteObject {
  async function pushEvidence({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let evidence = new GedcomX.EvidenceReference(updateObject(formData));

    const subject = new GedcomX.Subject(await table.get(params.id));
    return pushArray(table, params.id, "evidence", subject.evidence, evidence);
  }

  async function updateEvidence({params, request}: { params: Params, request: Request }) {
    let subject = new GedcomX.Subject(await table.get(params.id));

    let evidence: GedcomX.EvidenceReference = null;
    if (request.method === "POST") {
      evidence = new GedcomX.EvidenceReference(updateObject(await request.formData()));
    }

    return updateArray(table, params.id, "evidence", subject.evidence, Number(params.index), evidence);
  }

  return {
    path: "evidence", action: pushEvidence,
    children: [
      {path: ":index", action: updateEvidence}
    ]
  }
}

export function getMediaRoutes(table: Table<ISubject>): RouteObject {
  async function pushMedia({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let media = new GedcomX.SourceReference(updateObject(formData));

    const subject = new GedcomX.Subject(await table.get(params.id));
    return pushArray(table, params.id, "media", subject.media, media);
  }

  async function updateMedia({params, request}) {
    let subject = new GedcomX.Subject(await table.get(params.id));

    let media: GedcomX.SourceReference = null;
    if (request.method === "POST") {
      media = new GedcomX.SourceReference(updateObject(await request.formData()));
    }

    return updateArray(table, params.id, "media", subject.media, Number(params.index), media);
  }

  return {
    path: "media", action: pushMedia,
    children: [
      {path: ":index", action: updateMedia}
    ]
  }
}

export function formToFormalDate(formData: object) {
  let date = new GedcomX.Date()
    .setOriginal(formData["original"] as string);

  let formal = "";
  if (formData["approximate"]) {
    formal = "A";
  }

  function formToFormalSimple(prefix: string): string {
    let string = "";

    if (!formData[prefix + "-date"]) {
      return string;
    }
    string += `+${formData[prefix + "-date"]}`;

    if (!formData[prefix + "-time"]) {
      return string;
    }
    string += `T${formData[prefix + "-time"]}`;

    if (!formData[prefix + "-tz"]) {
      return string;
    }
    string += formData[prefix + "-tz-sign"] + formData[prefix + "-tz"];

    return string;
  }

  switch (formData["mode"]) {
    case "single":
      formal += formToFormalSimple("start");
      break;
    case "recurring":
      formal = `R${Number(formData["count"]) > 1 ? formData["count"] : ""}/` + formal;
    // intentionally no break
    // noinspection FallThroughInSwitchStatementJS
    case "range":
      formal += `${formToFormalSimple("start")}/${formToFormalSimple("end")}`;
      break;
  }

  // validate that it is a valid string
  try {
    GedcomXDate(formal);
  } catch (e) {
    console.error(formal)
    throw e;
  }

  date.setFormal(formal);
  return date;
}

export function getFactRoute(table: Table<IPerson | IRelationship>): RouteObject {
  async function getFactInstance(params: Params): Promise<Person | Relationship> {
    let datum = await table.get(params.id);
    let instance: Person | Relationship;
    if (datum satisfies IPerson)
      instance = new Person(datum);
    else
      instance = new Relationship(datum);

    return instance;
  }

  async function updateFact({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const instance = await getFactInstance(params);

    const formData = await request.formData();
    let fact = new GedcomX.Fact(updateObject(formData));

    await updateArray(table, params.id, "facts", instance.getFacts(), Number(params.index), fact);
    return redirect("");
  }

  async function updateDate({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const instance = await getFactInstance(params);
    let fact = instance.getFacts()[Number(params.index)];

    const formObject = updateObject(await request.formData());
    fact.setDate(formToFormalDate(formObject));
    fact.setAttribution(formObject["attribution"]);
    await updateArray(table, params.id, "facts", instance.getFacts(), Number(params.index), fact);
    return redirect("../");
  }

  async function updatePlace({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const instance = await getFactInstance(params);
    let fact = instance.getFacts()[Number(params.index)];

    const formObject = updateObject(await request.formData());
    fact.setPlace(new PlaceReference(formObject));
    fact.setAttribution(formObject["attribution"]);
    await updateArray(table, params.id, "facts", instance.getFacts(), Number(params.index), fact);
    return redirect("../");
  }

  async function updateQualifier({params, request}: { params: Params, request: Request }) {
    const instance = await getFactInstance(params);
    let fact = instance.getFacts()[Number(params.index)];

    if (request.method === "POST") {
      const formObject = updateObject(await request.formData());
      const qualifier = new GedcomX.Qualifier(formObject);

      if (params.qIndex) {
        fact.getQualifiers()[Number(params.qIndex)] = qualifier;
      } else {
        fact.getQualifiers().push(qualifier);
      }
      fact.setAttribution(formObject["attribution"]);
    } else if (request.method === "DELETE") {
      console.debug(Number(params.qIndex));
      let qualifiers = fact.getQualifiers();
      qualifiers.splice(Number(params.qIndex), 1);
      if (qualifiers.length === 0)
        qualifiers = undefined;

      fact.setQualifiers(qualifiers)
    }

    await updateArray(table, params.id, "facts", instance.getFacts(), Number(params.index), fact);
    return redirect("../")
  }

  return {
    path: "facts/:index", children: [{
      index: true, Component: FactComponent,
      loader: async ({params}) => {
        let datum = await table.get(params.id);
        return datum.facts.map(f => new Fact(f));
      }, action: updateFact
    }, {
      path: "date", action: updateDate
    }, {
      path: "place", action: updatePlace
    }, {
      path: "qualifier/:qIndex?", action: updateQualifier
    }]
  }
}

export function getConclusionRoutes(table: Table<IConclusion>): RouteObject[] {
  return [
    getNotesRoute(table),
    getSourceReferenceRoutes(table)
  ]
}

export function getSubjectRoutes(table: Table<ISubject>): RouteObject[] {
  return [
    ...getConclusionRoutes(table),
    getIdentifierRoute(table),
    getEvidenceRoutes(table),
    getMediaRoutes(table)
  ]
}
