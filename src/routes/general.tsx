import { Table } from "dexie";
import { FunctionalDict, pushArray, updateArray, updateDB, updateObject } from "./utils";
import { Params, redirect, RouteObject } from "react-router-dom";
import * as GedcomX from "gedcomx-js";
import { PlaceReference } from "gedcomx-js";
import { baseUri } from "../gedcomx/types";
import {
  IAgent,
  IConclusion,
  IFact, INote,
  IPerson,
  IRelationship,
  ISourceDescription, ISourceReference,
  ISubject
} from "../gedcomx/interfaces";
import FactComponent from "../components/FactComponent";
import { Fact, Person, Relationship } from "../gedcomx/gedcomx-js-extensions";
import GedcomXDate from "gedcomx-date";
import { IResourceReference } from "../gedcomx/json";

type Accessor = (parent: IConclusion, params: Params) => IConclusion;
type Updater = <T extends IConclusion>(parent: IConclusion, data: T, params: Params) => Promise<number>;
const identity: Accessor = d => d;

export function getNotesRoute(
  table: Table<IConclusion>,
  accessor: Accessor = identity,
  updater?: Updater): RouteObject {

  updater ??= async (parent, _, params) => {
    return updateDB(table, params.id, "notes", parent.notes.map(n => new GedcomX.Note(n)));
  }

  async function updateNotes({params, request}: { params: Params, request: Request }) {
    let parent = await table.get(params.id);
    let conclusion = accessor(parent, params);

    let note = null;
    if (request.method === "POST") {
      note = new GedcomX.Note(updateObject(await request.formData()));
    }
    conclusion.notes = updateArray(conclusion.notes, Number(params.index), note);
    await updater(parent, conclusion, params);
    return redirect("../..")
  }

  async function pushNote({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let note = new GedcomX.Note(updateObject(formData));

    let parent = await table.get(params.id);
    const conclusion = accessor(parent, params);

    conclusion.notes = pushArray<INote>(conclusion.notes, note.toJSON() as INote);
    await updater(parent, conclusion, params);
    return redirect("..");
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
    return redirect("..");
  }

  async function editIdentifier({request, params}: { params: Params, request: Request }) {
    const datum = await table.get(params.id);
    const formData = await request.formData();

    let index = Number(params.index);
    let value = formData?.get("value") as string ?? null;
    let identifiers = new GedcomX.Identifiers(datum.identifiers);

    await updateDB(table, params.id, "identifiers",
      updateIdentifiers(identifiers, undefined, index, value));
    return redirect("../..");
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
    return redirect("../..");
  }

  return {
    path: "identifiers", action: pushIdentifier,
    children: [
      {path: ":index", action: editIdentifier},
      {path: ":type/:index", action: editTypedIdentifier}]
  }
}

export function getSourceReferenceRoutes(
  table: Table<IConclusion>,
  accessor: Accessor = identity,
  updater?: Updater): RouteObject {

  updater ??= async (parent, _, params) => {
    return updateDB(table, params.id, "sources", parent.sources.map(n => new GedcomX.SourceReference(n)));
  }

  async function pushSourceReference({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let sourceReference = new GedcomX.SourceReference(updateObject(formData));

    const parent = await table.get(params.id);
    const conclusion = accessor(parent, params);

    conclusion.sources = pushArray<ISourceReference>(conclusion.sources, sourceReference as ISourceReference);
    await updater(parent, conclusion, params);
    return redirect("..")
  }

  async function updateSourceReference({params, request}) {
    let parent = await table.get(params.id);
    let conclusion = accessor(parent, params);

    let sourceReference: GedcomX.SourceReference = null;
    if (request.method === "POST") {
      sourceReference = new GedcomX.SourceReference(updateObject(await request.formData()));
    }
    conclusion.sources = updateArray(conclusion.sources, Number(params.index), sourceReference);
    await updater(parent, conclusion, params);
    return redirect("../..");
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
    pushArray(subject.evidence, evidence);
    await updateDB(table, params.id, "evidence", subject.evidence);
    return redirect("..")
  }

  async function updateEvidence({params, request}: { params: Params, request: Request }) {
    let subject = new GedcomX.Subject(await table.get(params.id));

    let evidence: GedcomX.EvidenceReference = null;
    if (request.method === "POST") {
      evidence = new GedcomX.EvidenceReference(updateObject(await request.formData()));
    }

    updateArray(subject.evidence, Number(params.index), evidence);
    await updateDB(table, params.id, "evidence", subject.evidence);
    return redirect("../..");
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
    pushArray(subject.media, media);
    await updateDB(table, params.id, "media", subject.media);
    redirect("..")
  }

  async function updateMedia({params, request}) {
    let subject = new GedcomX.Subject(await table.get(params.id));

    let media: GedcomX.SourceReference = null;
    if (request.method === "POST") {
      media = new GedcomX.SourceReference(updateObject(await request.formData()));
    }

    updateArray(subject.media, Number(params.index), media);
    await updateDB(table, params.id, "media", subject.media);
    return redirect("../..");
  }

  return {
    path: "media", action: pushMedia,
    children: [
      {path: ":index", action: updateMedia}
    ]
  }
}

export function formToFormalDate(formData: FormData | FunctionalDict) {
  let date = new GedcomX.Date()
    .setOriginal(formData.get("original") as string);

  let formal = "";
  if (formData.has("approximate")) {
    formal = "A";
  }

  function formToFormalSimple(prefix: string): string {
    let string = "";

    if (!formData.get(prefix + "-date")) {
      console.debug(`no ${prefix} date`)
      return string;
    }
    string += `+${formData.get(prefix + "-date")}`;

    if (!formData.get(prefix + "-time")) {
      return string;
    }
    string += `T${formData.get(prefix + "-time")}`;

    if (!formData.get(prefix + "-tz")) {
      return string;
    }
    string += formData.get(prefix + "-tz-sign") as string + formData.get(prefix + "-tz");

    return string;
  }

  switch (formData.get("mode")) {
    case "single":
      formal += formToFormalSimple("start");
      break;
    case "recurring":
      formal = `R${Number(formData.get("count")) > 1 ? formData.get("count") : ""}/` + formal;
    // intentionally no break
    // noinspection FallThroughInSwitchStatementJS
    case "range":
      formal += `${formToFormalSimple("start")}/${formToFormalSimple("end")}`;
      break;
    default:
      throw new TypeError("Unsupported mode " + formData.get("mode"));
  }

  // validate that it is a valid string
  try {
    GedcomXDate(formal);
  } catch (e) {
    console.error("Formal:", formal)
    throw e;
  }

  date.setFormal(formal);
  return date;
}

export function getFactRoute(table: Table<IPerson | IRelationship>): RouteObject {
  async function updateFacts(params: Params, instance: GedcomX.Person | GedcomX.Relationship) {
    return updateDB(table, params.id, "facts", instance.getFacts());
  }

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
    const instance = await getFactInstance(params);

    if (request.method === "DELETE") {
      instance.getFacts().splice(Number(params.index), 1);
      await updateFacts(params, instance);
      return redirect("");
    } else if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let fact = new GedcomX.Fact(updateObject(formData));

    if ("index" in params) {
      updateArray(instance.getFacts(), Number(params.index), fact);
      await updateFacts(params, instance);
      return redirect("");
    } else {
      // create new fact
      pushArray(instance.getFacts(), fact);
      await updateFacts(params, instance);
      return redirect(`/person/${params.id}/facts/${instance.facts.length - 1}`);
    }
  }

  async function updateDate({params, request}: { params: Params, request: Request }) {
    if (request.method !== "POST")
      return;

    const instance = await getFactInstance(params);
    let fact = instance.getFacts()[Number(params.index)];

    const formObject = updateObject(await request.formData());
    fact.setDate(formToFormalDate(formObject));
    fact.setAttribution(formObject["attribution"]);

    updateArray(instance.getFacts(), Number(params.index), fact);
    await updateFacts(params, instance);
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

    updateArray(instance.getFacts(), Number(params.index), fact);
    await updateFacts(params, instance);
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

    updateArray(instance.getFacts(), Number(params.index), fact);
    await updateFacts(params, instance);
    return redirect("../")
  }

  return {
    path: "facts", action: updateFact, children: [{
      path: ":index", children: [{
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
      }, ...getConclusionRoutes(
        table,
        (d: IPerson | IRelationship, params) => d.facts[Number(params.index)],
        (parent: IPerson | IRelationship, data, params) => {
          parent.facts[Number(params.index)] = data as unknown as IFact;
          return updateDB(table, params.id, "facts", parent.facts.map(f => new GedcomX.Fact(f)))
        })]
    }]
  }
}

export function getAnalysisRoute(
  table: Table<IConclusion>,
  accessor: Accessor = identity,
  updater?: Updater): RouteObject {

  updater ??= async (_, data, params) => {
    return updateDB(table, params.id, "analysis", new GedcomX.ResourceReference(data.analysis));
  }

  async function updateAnalysis({params, request}: {params: Params, request: Request}) {
    const parent = await table.get(params.id);
    const conclusion = accessor(parent, params);

    conclusion.analysis = updateObject(await request.formData()) as object as IResourceReference;
    if (conclusion.analysis.resource == null) {
      conclusion.analysis = null;
    }
    await updater(parent, conclusion, params);
    return redirect("..");
  }

  return {
    path: "analysis", action: updateAnalysis
  }
}

export function getConfidenceRoute(
  table: Table<IConclusion>,
  accessor: Accessor = identity,
  updater?: Updater): RouteObject {

  updater ??= async (_, data, params) => {
    return updateDB(table, params.id, "confidence", data.confidence);
  }

  async function updateConfidence({params, request}: {params: Params, request: Request}) {
    const parent = await table.get(params.id);
    const conclusion = accessor(parent, params);

    conclusion.confidence = updateObject(await request.formData())["confidence"];
    if (conclusion.confidence == "-") {
      delete conclusion.confidence;
    }
    await updater(parent, conclusion, params);
    return redirect("..");
  }

  return {
    path: "confidence", action: updateConfidence
  }
}

export function getConclusionRoutes(
  table: Table<IConclusion>,
  accessor: Accessor = identity,
  updater?: Updater
  ): RouteObject[] {
  return [
    getNotesRoute(table, accessor, updater),
    getSourceReferenceRoutes(table, accessor, updater),
    getAnalysisRoute(table, accessor, updater),
    getConfidenceRoute(table, accessor, updater)
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
