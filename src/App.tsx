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
import { Identifiers } from "gedcomx-js";
import { baseUri } from "./gedcomx/types";

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

          let note = new GedcomX.Note()
            .setSubject(formData.get("subject") as string)
            .setText(formData.get("text") as string);

          if (formData.has("attribution"))
            note.setAttribution(JSON.parse(formData.get("attribution") as string));

          const person = await db.personWithId(params.id);
          person.addNote(note);

          db.persons.update(params.id, {
            notes: person.getNotes().map(n => n.toJSON())
          });

          return redirect("../")
        }, children: [{
          path: ":index", action: async ({params, request}) => {
            const formData = await request.formData();
            const person = await db.personWithId(params.id);

            switch (request.method) {
              case "POST":
                let note = new GedcomX.Note()
                  .setSubject(formData.get("subject") as string)
                  .setText(formData.get("text") as string);

                if (formData.has("attribution")) {
                  note.setAttribution(JSON.parse(formData.get("attribution") as string));

                  let changeMessage = formData.get("changeMessage") as string;
                  if (changeMessage != null && changeMessage != "") {
                    note.attribution.changeMessage = changeMessage;
                  }
                }

                person.notes[params.index] = note
                break;
              case "DELETE":
                person.notes.splice(Number(params.index), 1);
                if (person.notes.length === 0) {
                  person.notes = undefined;
                }
                break;
            }

            await db.persons.update(params.id, {
              notes: person.getNotes().map(n => n.toJSON())
            })
            return redirect("../../");
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
            if (agent.names == null) {
              agent.names = [];
            }
            agent.names.push(new GedcomX.TextValue().setValue(formData.get("value") as string));

            await db.agents.update(params.id, {
              names: agent.getNames().map(t => t.toJSON())
            });

            return redirect("../");
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              switch (request.method) {
                case "POST":
                  agent.names[params.index] = new GedcomX.TextValue()
                    .setValue(formData.get("value") as string);
                  break;
                case "DELETE":
                  agent.names.splice(Number(params.index), 1);
                  if (agent.names.length === 0) {
                    agent.names = undefined;
                  }
                  break;
              }

              await db.agents.update(params.id, {
                names: agent.getNames().map(n => n.toJSON())
              })
              return redirect("../../");
            }
          }]
        }, {
          path: "person", action: async ({request, params}) => {
            const agent = await db.agentWithId(params.id);

            if (request.method === "POST") {
              const formData = await request.formData();
              agent.person = new GedcomX.ResourceReference()
                .setResource(formData.get("person") as string)
            } else if (request.method === "DELETE") {
              agent.person = undefined;
            }

            await db.agents.update(params.id, {
              person: agent.person?.toJSON()
            });

            return redirect("../");
          }
        }, {
          path: "homepage", action: async ({request, params}) => {
            if (request.method === "DELETE") {
              await db.agents.update(params.id, {
                homepage: undefined
              });
            } else if (request.method === "POST") {
              const formData = await request.formData();

              await db.agents.update(params.id, {
                homepage: new GedcomX.ResourceReference().setResource(formData.get("homepage") as string).toJSON()
              })
            }

            return redirect("../");
          }
        }, {
          path: "openid", action: async ({request, params}) => {
            if (request.method === "DELETE") {
              await db.agents.update(params.id, {
                openid: undefined
              });
            } else if (request.method === "POST") {
              const formData = await request.formData();

              await db.agents.update(params.id, {
                openid: new GedcomX.ResourceReference().setResource(formData.get("openid") as string).toJSON()
              })
            }

            return redirect("../");
          }
        }, {
          path: "account", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            if (agent.accounts == null) {
              agent.accounts = [];
            }

            agent.accounts.push(new GedcomX.OnlineAccount()
              .setAccountName(formData.get("account") as string)
              .setServiceHomepage(new GedcomX.ResourceReference().setResource(formData.get("serviceHomepage") as string)));

            await db.agents.update(params.id, {
              accounts: agent.accounts.map(a => a.toJSON())
            })

            return redirect("../");
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              switch (request.method) {
                case "POST":
                  agent.accounts[params.index] = new GedcomX.OnlineAccount()
                    .setAccountName(formData.get("account") as string)
                    .setServiceHomepage(new GedcomX.ResourceReference().setResource(formData.get("serviceHomepage") as string));
                  break;
                case "DELETE":
                  agent.accounts.splice(Number(params.index), 1);
                  if (agent.accounts.length === 0) {
                    agent.accounts = undefined;
                  }
                  break;
              }

              await db.agents.update(params.id, {
                accounts: agent.accounts?.map(a => a.toJSON())
              })
              return redirect("../../");
            }
          }]
        }, {
          path: "emails", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            if (agent.emails == null) {
              agent.emails = [];
            }

            agent.emails.push(new GedcomX.ResourceReference()
              .setResource(formData.get("email") as string));

            await db.agents.update(params.id, {
              emails: agent.emails.map(e => e.toJSON())
            })

            return redirect("../");
          },
          children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              switch (request.method) {
                case "POST":
                  agent.emails[params.index] = new GedcomX.ResourceReference()
                    .setResource(formData.get("email") as string);
                  break;
                case "DELETE":
                  agent.emails.splice(Number(params.index), 1);
                  if (agent.emails.length === 0) {
                    agent.emails = undefined;
                  }
                  break;
              }

              await db.agents.update(params.id, {
                emails: agent.emails?.map(e => e.toJSON())
              })
              return redirect("../../");
            }
          }]
        }, {
          path: "phones", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            if (agent.phones == null) {
              agent.phones = [];
            }

            agent.phones.push(new GedcomX.ResourceReference()
              .setResource(formData.get("phone") as string));

            await db.agents.update(params.id, {
              phones: agent.phones.map(p => p.toJSON())
            })

            return redirect("../");
          },
          children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              switch (request.method) {
                case "POST":
                  agent.phones[params.index] = new GedcomX.ResourceReference()
                    .setResource(formData.get("phone") as string);
                  break;
                case "DELETE":
                  agent.phones.splice(Number(params.index), 1);
                  if (agent.phones.length === 0) {
                    agent.phones = undefined;
                  }
                  break;
              }

              await db.agents.update(params.id, {
                phones: agent.phones?.map(p => p.toJSON())
              })
              return redirect("../../");
            }
          }]
        }, {
          path: "addresses", action: async ({request, params}) => {
            if (request.method !== "POST") {
              return;
            }

            const formData = await request.formData();
            const agent = await db.agentWithId(params.id);

            if (agent.addresses == null) {
              agent.addresses = [];
            }

            agent.addresses.push(new GedcomX.Address()
              .setValue(formData.get("value") as string));

            await db.agents.update(params.id, {
              addresses: agent.addresses.map(a => a.toJSON())
            })

            return redirect("../");
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const formData = await request.formData();
              const agent = await db.agentWithId(params.id);

              switch (request.method) {
                case "POST":
                  agent.addresses[params.index] = new GedcomX.Address()
                    .setValue(formData.get("value") as string);
                  break;
                case "DELETE":
                  agent.addresses.splice(Number(params.index), 1);
                  if (agent.addresses.length === 0) {
                    agent.addresses = undefined;
                  }
                  break;
              }

              await db.agents.update(params.id, {
                addresses: agent.addresses?.map(a => a.toJSON())
              })
              return redirect("../../");
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

            await db.agents.update(params.id, {
              identifiers: agent.identifiers.toJSON()
            })

            return redirect("../");
          }, children: [{
            path: ":index", action: async ({request, params}) => {
              const agent = await db.agentWithId(params.id);
              const formData = await request.formData();

              let index = Number(params.index);
              let value = formData?.get("value") as string ?? null;

              await db.agents.update(params.id, {
                identifiers: updateIdentifiers(agent.getIdentifiers(), undefined, index, value).toJSON()
              })

              return redirect("../../");
            }
          }, {
            path: ":type/:index", action: async ({request, params}) => {
              const agent = await db.agentWithId(params.id);
              const formData = await request.formData();

              let index = Number(params.index);
              let type = baseUri + params.type;
              let value = formData?.get("value") as string ?? null;

              await db.agents.update(params.id, {
                identifiers: updateIdentifiers(agent.getIdentifiers(), type, index, value).toJSON()
              })

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

  console.debug(type, value, index)

  if (value != null) {
    current[index] = value;
  } else {
    current.splice(index, 1);
  }

  identifiers.setValues(current, type);
  console.debug(identifiers.toJSON())

  return identifiers;
}
