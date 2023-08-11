import { redirect, RouteObject } from "react-router-dom";
import Persons from "../components/Persons";
import { db } from "../backend/db";
import { getIdentifierRoute, getNotesRoute } from "./general";

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
  }, children: [
      getNotesRoute(db.persons),
      getIdentifierRoute(db.persons)
  ]
};
