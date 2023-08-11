import { Table } from "dexie";
import { pushArray, updateArray, updateObject } from "./utils";
import { Params } from "react-router-dom";
import * as GedcomX from "gedcomx-js";

export function getNotesRoute(table: Table) {
  async function updateNotes(table: Table, params: Params<string>, request: Request) {
    let conclusion = new GedcomX.Conclusion(await table.get(params.id));

    let note = null;
    if (request.method === "POST") {
      note = new GedcomX.Note(updateObject(await request.formData()));
    }
    return updateArray(table, params.id, "notes", conclusion.notes, Number(params.index), note);
  }

  async function pushNote(table: Table, params: Params<string>, request: Request) {
    if (request.method !== "POST")
      return;

    const formData = await request.formData();
    let note = new GedcomX.Note(updateObject(formData));

    const conclusion = new GedcomX.Conclusion(await table.get(params.id));
    return pushArray(table, params.id, "notes", conclusion.notes, note);
  }

  return {
    path: "notes",
    action: async ({params, request}) => pushNote(table, params, request),
    children: [{
      path: ":index",
      action: async ({params, request}) => updateNotes(table, params, request)
    }]
  }
}
