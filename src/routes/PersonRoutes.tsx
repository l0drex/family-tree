import { redirect, RouteObject } from "react-router-dom";
import Persons from "../components/Persons";
import { db } from "../backend/db";
import { getFactRoute, getSubjectRoutes } from "./general";
import { pushArray, updateDB, updateObject } from "./utils";
import * as GedcomX from "gedcomx-js";

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
            if (request.method !== "DELETE") {
              return;
            }

            const person = await db.personWithId(params.id);
            person.names.splice(Number(params.nameId), 1);
            await updateDB(db.persons, params.id, "names", person.names);
            return redirect("../..");
          },
          children: [{
            path: "form", action: async ({params, request}) => {
              const person = await db.personWithId(params.id);

              const formData = updateObject(await request.formData());
              const nameForm = new GedcomX.NameForm(formData);

              pushArray(person.getNames()[params.nameId].getNameForms(), nameForm);
              await updateDB(db.persons, params.id, "names", person.names);

              return redirect("../../..")
            }, children: [{
              path: ":formId", action: async ({params, request}) => {
                const person = await db.personWithId(params.id);
                const name: GedcomX.Name = person.getNames()[params.nameId];

                if (request.method === "DELETE") {
                  name.nameForms.splice(Number(params.formId), 1);
                  await updateDB(db.persons, params.id, "names", person.names);
                  return redirect("../../../..")
                } else if (request.method === "POST") {
                  const formData = updateObject(await request.formData())
                  name.nameForms[params.formId] = new GedcomX.NameForm(formData)
                  await updateDB(db.persons, params.id, "names", person.names);
                  return redirect("../../../..")
                }
              }, children: [{
                path: "part", action: async ({params, request}) => {
                  const person = await db.personWithId(params.id);
                  const name: GedcomX.Name = person.getNames()[params.nameId];
                  const nameForm: GedcomX.NameForm = name.getNameForms()[params.formId];

                  if (request.method === "POST") {
                    const data = updateObject(await request.formData());
                    const part = new GedcomX.NamePart(data);
                    console.debug(part);

                    nameForm.addPart(part);
                    await updateDB(db.persons, params.id, "names", person.names);
                    return redirect("../../../../..");
                  }
                }, children: [{
                  path: ":partId", action: async ({params, request}) => {
                    const person = await db.personWithId(params.id);
                    const name: GedcomX.Name = person.getNames()[params.nameId];
                    const nameForm: GedcomX.NameForm = name.getNameForms()[params.formId];

                    if (request.method === "DELETE") {
                      nameForm.parts.splice(Number(params.partId));
                      await updateDB(db.persons, params.id, "names", person.names);
                      return redirect("../../../../../..");
                    }
                  }
                }]
              }]
            }]
          }, {
            path: ":attribute", action: async ({params, request}) => {
              const person = await db.personWithId(params.id);
              const name: GedcomX.Name = person.getNames()[params.nameId];
              const data = updateObject(await request.formData());

              switch (params.attribute){
                case "type": {
                  if (data.has("type") && data.get("type") !== "-") {
                    name.type = data.get("type");
                  } else {
                    delete name.type;
                  }
                  break;
                }
                case "date": {
                  // TODO
                  break;
                }
              }

              await updateDB(db.persons, params.id, "names", person.names);
              return redirect("../../..");
            }

          }]
        }]
      },
      getFactRoute(db.persons),
      ...getSubjectRoutes(db.persons)
    ]
  }]
};
