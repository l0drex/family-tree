import { redirect, RouteObject } from "react-router-dom";
import Persons from "../components/Persons";
import { db } from "../backend/db";
import { formToFormalDate, getFactRoute, getSubjectRoutes } from "./general";
import { pushArray, updateDB, updateObject } from "./utils";
import * as GedcomX from "gedcomx-js";
import { IName } from "../gedcomx/interfaces";

export const personRoutes: RouteObject = {
  path: "person", children: [{
    index: true, loader: async ({params}) => {
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
  }, {
    path: ":id", children: [
      {index: true, Component: Persons, loader: async ({params}) => db.personWithId(params.id)},
      {
        path: "names", action: async ({params, request}) => {
          const formData = updateObject(await request.formData());
          if (formData.get("type") === "-") {
            formData.delete("type");
          }
          const name = new GedcomX.Name(formData)
            .addNameForm(new GedcomX.NameForm(formData));

          const person = await db.personWithId(params.id);
          pushArray<GedcomX.Name>(person.names, name);
          await updateDB(db.persons, params.id, "names", person.names);

          return redirect("../");
        }, children: [{
          path: ":nameId", action: async ({params, request}) => {
            const person = await db.personWithId(params.id);

            if (request.method === "DELETE") {
              person.names.splice(Number(params.nameId), 1);
              await updateDB(db.persons, params.id, "names", person.names);
              return redirect("../..");
            } else if (request.method === "POST") {
              const formData = updateObject(await request.formData());
              const nameForm = new GedcomX.NameForm(formData);

              pushArray(person.getNames()[params.nameId].getNameForms(), nameForm);
              await updateDB(db.persons, params.id, "names", person.names);

              return redirect("../..")
            }
          }
        }]
      },
      getFactRoute(db.persons),
      ...getSubjectRoutes(db.persons)
    ]
  }]
};
