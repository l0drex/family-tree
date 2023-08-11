import { redirect, RouteObject } from "react-router-dom";
import Persons from "../components/Persons";
import { db } from "../backend/db";
import * as GedcomX from "gedcomx-js";
import { pushArray, updateArray, updateObject } from "./utils";

export const personRoutes: RouteObject = {
  path: "person/:id?", Component: Persons, loader: async ({params}) => {
    if (!params.id) {
      let persons = await db.persons.toArray();

      let startPerson = persons[0];
      for (let p of persons) {
        let relations = await db.relationships.where("person1.resource").equals("#" + p.id)
          .or("person2.resource").equals("#" + p.id).toArray();
        if (relations.length > 0) {
          startPerson = p;
          break;
        }
      }

      return redirect("/person/" + startPerson.id);
    }

    return db.personWithId(params.id);
  }, children: [{
    path: "notes", action: async ({params, request}) => {
      if (request.method !== "POST")
        return;

      const formData = await request.formData();
      let note = new GedcomX.Note(updateObject(formData));

      const person = await db.personWithId(params.id);
      return pushArray(db.persons, params.id, "notes", person.notes, note);
    }, children: [{
      path: ":index", action: async ({params, request}) => {
        const formData = await request.formData();
        const person = await db.personWithId(params.id);

        let note = null;
        if (request.method === "POST") {
          note = new GedcomX.Note(updateObject(formData));
        }
        return updateArray(db.persons, params.id, "notes", person.notes, Number(params.index), note);
      }
    }]
  }]
};
