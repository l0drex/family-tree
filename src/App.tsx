import * as React from "react";
import { createBrowserRouter, redirect, RouterProvider } from "react-router-dom";
import { strings } from "./main";
import { db } from "./backend/db";
import { Agent, Document, EventExtended, SourceDescription } from "./gedcomx/gedcomx-js-extensions";
import { Home } from "./components/Home";
import Persons from "./components/Persons";
import Statistics from "./components/Statistics";
import { SourceDescriptionOverview, SourceDescriptionView } from "./components/SourceDescriptions";
import { DocumentOverview, DocumentView } from "./components/Documents";
import { AgentOverview, AgentView } from "./components/Agents";
import * as GedcomX from "gedcomx-js";
import { PlaceOverview, PlaceView } from "./components/Places";
import ErrorBoundary from "./components/ErrorBoundary";
import { Imprint } from "./components/Imprint";
import { EventOverview, EventView } from "./components/Events";
import { Layout } from "./Layout";
import { Base, Identifiers } from "gedcomx-js";
import { baseUri } from "./gedcomx/types";
import { Table } from "dexie";

const router = createBrowserRouter([{
  path: "*", Component: Layout, children: [{
    path: "*", errorElement: <ErrorBoundary/>, children: [{
      index: true, Component: Home
    }, {
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
    }, {
      path: "stats", Component: Statistics
    }, {
      path: "sourceDescription", children: [{
        index: true,
        Component: SourceDescriptionOverview,
        loader: () => db.sourceDescriptions.toArray().then(s => s.length ? s.map(d => new SourceDescription(d)) : Promise.reject(new Error(strings.errors.noData)))
      }, {
        path: ":id",
        Component: SourceDescriptionView,
        loader: ({params}) => db.sourceDescriptionWithId(params.id)
      }]
    }, {
      path: "document", children: [
        {
          index: true,
          Component: DocumentOverview,
          loader: () => db.documents.toArray().then(ds => ds.length ? ds.map(d => new Document(d)) : Promise.reject(new Error(strings.errors.noData)))
        },
        {path: ":id", Component: DocumentView, loader: ({params}) => db.elementWithId(params.id, "document")}
      ]
    }, {
      path: "agent",
      action: async ({request}) => {
        if (request.method !== "POST")
          return;

        const agent = await db.createAgent();
        return redirect(`/agent/${agent.id}`);
      }, children: [{
        index: true,
        Component: AgentOverview,
        loader: () => db.agents.toArray()
          .then(a => a.length ?
            a.map(d => new Agent(d)) :
            Promise.reject(new Error(strings.errors.noData)))
      }, {
        path: ":id", Component: AgentView, loader: ({params}) => {
          return db.elementWithId(params.id, "agent")
        }, action: async ({params, request}) => {
          if (request.method === "DELETE") {
            await db.agents.delete(params.id);
            return redirect("../");
          }
        }, children: [{
          path: "names", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            let name = new GedcomX.TextValue(updateObject(formData));
            return pushArray(db.agents, params.id, "names", agent.names, name);
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              let name = null;
              if (request.method === "POST") {
                name = new GedcomX.TextValue(updateObject(formData));
              }
              return updateArray(db.agents, params.id, "names", agent.names, Number(params.index), name);
            }
          }]
        }, {
          path: "person", action: async ({request, params}) => {
            let person = undefined;

            if (request.method === "POST") {
              const formData = await request.formData();
              person = new GedcomX.ResourceReference(updateObject(formData));
            }

            await updateDB(db.agents, params.id, "person", person);
            return redirect("../");
          }
        }, {
          path: "homepage", action: async ({request, params}) => {
            let homepage = undefined;

            if (request.method === "POST") {
              const formData = await request.formData();
              homepage = new GedcomX.ResourceReference(updateObject(formData));
            }

            await updateDB(db.agents, params.id, "homepage", homepage);
            return redirect("../");
          }
        }, {
          path: "openid", action: async ({request, params}) => {
            let openid = undefined;

            if (request.method === "POST") {
              const formData = await request.formData();
              openid = new GedcomX.ResourceReference(updateObject(formData));
            }

            await updateDB(db.agents, params.id, "openid", openid);
            return redirect("../");
          }
        }, {
          path: "account", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            let account = new GedcomX.OnlineAccount(updateObject(formData));
            return pushArray(db.agents, params.id, "accounts", agent.accounts, account);
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              let account = null;
              if (request.method === "POST") {
                account = new GedcomX.OnlineAccount(updateObject(formData));
              }

              return updateArray(db.agents, params.id, "accounts", agent.accounts, Number(params.index), account);
            }
          }]
        }, {
          path: "emails", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            let mail = new GedcomX.ResourceReference(updateObject(formData));
            return pushArray(db.agents, params.id, "emails", agent.emails, mail);
          },
          children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              let mail = null;
              if (request.method === "POST") {
                mail = new GedcomX.ResourceReference(updateObject(formData));
              }

              return updateArray(db.agents, params.id, "emails", agent.emails, Number(params.index), mail);
            }
          }]
        }, {
          path: "phones", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }
            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            let phone = new GedcomX.ResourceReference(updateObject(formData));
            return pushArray(db.agents, params.id, "phones", agent.phones, phone);
          },
          children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              let phone = null;
              if (request.method === "POST") {
                phone = new GedcomX.ResourceReference(updateObject(formData));
              }
              return updateArray(db.agents, params.id, "phones", agent.phones, Number(params.index), phone);
            }
          }]
        }, {
          path: "addresses", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }
            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            let address = new GedcomX.Address(updateObject(formData));
            return pushArray(db.agents, params.id, "addresses", agent.addresses, address);
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              let address = null;
              if (request.method === "POST") {
                address = new GedcomX.Address(updateObject(formData));
              }

              return updateArray(db.agents, params.id, "addresses", agent.addresses, Number(params.index), address);
            }
          }]
        }, {
          path: "identifiers", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            let type = formData.get("type") as string;
            if (type === "-")
              type = undefined;

            agent.setIdentifiers(
              (agent.getIdentifiers() ?? new Identifiers())
                .addValue(formData.get("value") as string, type));

            await updateDB(db.agents, params.id, "identifiers", agent.identifiers);
            return redirect("../");
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const agent = await db.agentWithId(params.id);
              const formData = await request.formData();

              let index = Number(params.index);
              let value = formData?.get("value") as string ?? null;

              await updateDB(db.agents, params.id, "identifiers",
                updateIdentifiers(agent.getIdentifiers(), undefined, index, value));
              return redirect("../../");
            }
          }, {
            path: ":type/:index", action: async ({request, params}) => {
              const agent = await db.agentWithId(params.id);
              const formData = await request.formData();

              let index = Number(params.index);
              let type = baseUri + params.type;
              let value = formData?.get("value") as string ?? null;

              await updateDB(db.agents, params.id, "identifiers",
                updateIdentifiers(agent.getIdentifiers(), type, index, value));
              return redirect("../../");
            }
          }]
        }]
      }]
    }, {
      path: "event", children: [{
        index: true,
        Component: EventOverview,
        loader: () => db.events.toArray().then(e => e.length ? e.map(d => new EventExtended(d)) : Promise.reject(new Error(strings.errors.noData)))
      }, {
        path: ":id", Component: EventView, loader: ({params}) => db.elementWithId(params.id, "event")
      }
      ]
    }, {
      path: "place", children: [{
        index: true,
        Component: PlaceOverview,
        loader: () => db.places.toArray().then(p => p.length ? p.map(d => new GedcomX.PlaceDescription(d)) : Promise.reject(new Error(strings.errors.noData)))
      }, {
        path: ":id", Component: PlaceView, loader: ({params}) => db.elementWithId(params.id, "place")
      }
      ]
    }, {
      path: "imprint", Component: Imprint
    }
    ]
  }]
}], {basename: "/family-tree"});

export default function App() {
  return <RouterProvider router={router}/>;
}

function updateIdentifiers(identifiers: Identifiers, type: string, index: number, value?: string) {
  let current = identifiers.getValues(type);

  if (value != null) {
    current[index] = value;
  } else {
    current.splice(index, 1);
  }

  identifiers.setValues(current, type);
  return identifiers;
}

/**
 * Sets the values of the given object to the values of the given form data.
 * @param formData where keys match the keys in the data object (not all have to be present)
 * @param data to be updated
 */
function updateObject(formData: FormData, data: object = {}): object {
  formData.forEach((value, key) => {
    if (key === "attribution") {
      value = JSON.parse(value as string);
    } else if (key === "changeMessage") {
      data["attribution"] ??= {};
      data["attribution"]["changeMessage"] = value;
      return;
    } else if (key.endsWith(".resource")) {
      data[key.split(".")[0]] = { resource: value };
      return;
    }

    data[key] = value;
  });

  return data;
}

/**
 * Pushes the given value to the given array and updates the database.
 * @param table database table
 * @param id primary index of the value in the database table
 * @param key property of the database instance to be updated
 * @param array value behind key
 * @param newValue value to be added to the array
 *
 * @example table.get(id)[key].push(newValue);
 */
async function pushArray<T extends Base>(table: Table, id: string, key: string, array: T[], newValue: T) {
  array ??= [];

  array.push(newValue);
  await updateDB(table, id, key, array);
  return redirect("../");
}

/**
 * Updates the given value in the given array and updates the database.
 * @param table database table
 * @param id primary index of the value in the database table
 * @param key property of the database instance to be updated
 * @param array value behind key
 * @param index index of newValue in the array
 * @param newValue updated value
 *
 * @example table.get(id)[key][index] = newValue;
 */
async function updateArray<T extends Base>(table: Table, id: string, key: string, array: T[], index: number, newValue?: T) {
  if (newValue != null) {
    array[index] = newValue;
  } else {
    array.splice(index, 1);
    if (array.length === 0) {
      array = null;
    }
  }

  await updateDB(table, id, key, array);
  return redirect("../../")
}

/**
 * Updates key of instance id with value in the table.
 * @param table database table
 * @param id primary index of the value in the database table
 * @param key property of the database instance to be updated
 * @param newValue updated value
 */
async function updateDB(table: Table, id: string, key: string, newValue: any[] | any): Promise<number> {
  let changes = {};

  if (newValue instanceof Array)
    changes[key] = newValue?.map(d => d.toJSON());
  else
    changes[key] = newValue?.toJSON();

  return table.update(id, changes)
}
