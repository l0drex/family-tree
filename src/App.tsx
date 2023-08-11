import * as React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { strings } from "./main";
import { db } from "./backend/db";
import { Document, EventExtended, SourceDescription } from "./gedcomx/gedcomx-js-extensions";
import { Home } from "./components/Home";
import Statistics from "./components/Statistics";
import { SourceDescriptionOverview, SourceDescriptionView } from "./components/SourceDescriptions";
import { DocumentOverview, DocumentView } from "./components/Documents";
import * as GedcomX from "gedcomx-js";
import { PlaceOverview, PlaceView } from "./components/Places";
import ErrorBoundary from "./components/ErrorBoundary";
import { Imprint } from "./components/Imprint";
import { EventOverview, EventView } from "./components/Events";
import { Layout } from "./Layout";
import { agentRoutes } from "./routes/AgentRoutes";
import { personRoutes } from "./routes/PersonRoutes";

const router = createBrowserRouter([{
  path: "*", Component: Layout, children: [{
    path: "*", errorElement: <ErrorBoundary/>, children: [{
      index: true, Component: Home
    }, personRoutes, {
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
    }, agentRoutes, {
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
