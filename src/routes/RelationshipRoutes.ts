import { redirect, RouteObject } from "react-router-dom";
import { updateObject, pushArray, updateDB } from "./utils";
import * as GedcomX from "gedcomx-js";
import { db } from "../backend/db";
import { IRelationship } from "../gedcomx/interfaces";

export const relationshipRoutes: RouteObject = {
  path: "relationship", action: async ({params, request}) => {
    const data = updateObject(await request.formData());
    const relation = new GedcomX.Relationship(data);
    relation.setId(crypto.randomUUID());
    
    if (relation.person1 === relation.person2) {
      throw "Person1 and Person2 can not be equal!";
    }
    
    console.debug(relation.toJSON());
    // TODO push the new relation to the db
    
    db.relationships.add(relation.toJSON() as IRelationship)
    
    // TODO return to original person, maybe through browser history?
    return redirect(`/person/${relation.person1.resource.substring(1)}`);
  }
}
