import { Table } from "dexie";
import { pushArray, updateArray, updateDB, updateObject } from "./utils";
import { Params, redirect } from "react-router-dom";
import * as GedcomX from "gedcomx-js";
import { baseUri } from "../gedcomx/types";
import { IAgent, IConclusion, ISourceDescription, ISubject } from "../gedcomx/interfaces";

export function getNotesRoute(table: Table<IConclusion>) {
    async function updateNotes({params, request}: { params: Params<string>, request: Request }) {
        let conclusion = new GedcomX.Conclusion(await table.get(params.id));

        let note = null;
        if (request.method === "POST") {
            note = new GedcomX.Note(updateObject(await request.formData()));
        }
        return updateArray(table, params.id, "notes", conclusion.notes, Number(params.index), note);
    }

    async function pushNote({params, request}: { params: Params<string>, request: Request }) {
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

export function getIdentifierRoute(table: Table<hasIdentifiers>) {
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

    async function pushIdentifier({request, params}) {
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

    async function editIdentifier({request, params}) {
        const datum = await table.get(params.id);
        const formData = await request.formData();

        let index = Number(params.index);
        let value = formData?.get("value") as string ?? null;
        let identifiers = new GedcomX.Identifiers(datum.identifiers);

        await updateDB(table, params.id, "identifiers",
            updateIdentifiers(identifiers, undefined, index, value));
        return redirect("../../");
    }

    async function editTypedIdentifier({request, params}) {
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
