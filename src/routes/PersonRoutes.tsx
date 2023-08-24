import { redirect, RouteObject } from "react-router-dom";
import Persons from "../components/Persons";
import { db } from "../backend/db";
import { getFactRoute, getSubjectRoutes } from "./general";

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
      getFactRoute(db.persons),
      ...getSubjectRoutes(db.persons)
    ]
  }]
};
