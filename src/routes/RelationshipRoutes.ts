import { redirect, RouteObject } from "react-router-dom";
import { updateObject, pushArray, updateDB } from "./utils";
import { Relationship, Person } from "../gedcomx/gedcomx-js-extensions";
import * as GedcomX from "gedcomx-js";
import { db } from "../backend/db";
import { IRelationship } from "../gedcomx/interfaces";
import { RelationshipTypes } from "../gedcomx/types";

export const relationshipRoutes: RouteObject = {
  path: "relationship", action: async ({params, request}) => {
    const data = updateObject(await request.formData());
    const relation = new GedcomX.Relationship(data);
    relation.setId(crypto.randomUUID());
    
    if (relation.person1 === relation.person2) {
      throw "Person1 and Person2 can not be equal!";
    }
    
    db.relationships.add(relation.toJSON() as IRelationship)
    
    // add unknown persons if necessary
    if (relation.type === RelationshipTypes.ParentChild) {
      await addMissingParent(relation);
    }
    
    // TODO return to original person, maybe through browser history?
    return redirect(`/person/${relation.person1.resource.substring(1)}`);
  }, children: [{
    path: ":relId", action: async ({params, request}) => {
      if (request.method !== "DELETE") {
        return;
      }
      
      const relation = await db.elementWithId(params.relId, "relationship") as Relationship;
      db.relationships.delete(params.relId);
      
      return redirect(`/person/${relation.person1.resource.substring(1)}`);
    }
  }]
}

async function addMissingParent(relation: GedcomX.Relationship) {
  // TODO allow to select an existing person as parent

  const parents = await db.getParentsOf(relation.person2);
  if (parents.length > 1)
    return;

  // create unknown parent
  const anonymous = new Person()
    .setId(crypto.randomUUID());
  db.persons.add(anonymous.toJSON());
  
  // set anonymous as the parent
  const parentChild = new Relationship()
    .setType(RelationshipTypes.ParentChild)
    .setPerson1(new GedcomX.ResourceReference()
      .setResource("#" + anonymous.id))
    .setPerson2(relation.person2)
    .setId(crypto.randomUUID());
  db.relationships.add(parentChild.toJSON() as IRelationship);
  
  // create new couple relationship with parent and anonymous
  const couple = new Relationship()
    .setType(RelationshipTypes.Couple)
    .setPerson1(relation.person1)
    .setPerson2(new GedcomX.ResourceReference()
      .setResource("#" + anonymous.id))
    .setId(crypto.randomUUID());
  db.relationships.add(couple.toJSON() as IRelationship);
}
