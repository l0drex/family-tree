import * as React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import { getAll } from "./routes/utils";
import { getNotesRoute } from "./routes/general";

const router = createBrowserRouter([{
  path: "*", Component: Layout, children: [{
    path: "*", errorElement: <ErrorBoundary/>, children: [{
      index: true, Component: Home
    }, personRoutes, {
      path: "stats", Component: Statistics
    }, {
      path: "sourceDescription", children: [{
        index: true, Component: SourceDescriptionOverview,
        loader: getAll(db.sourceDescriptions, SourceDescription)
      }, {
        path: ":id", Component: SourceDescriptionView,
        loader: ({params}) => db.sourceDescriptionWithId(params.id),
        children: [getNotesRoute(db.sourceDescriptions)]
      }]
    }, {
      path: "document", children: [{
        index: true, Component: DocumentOverview,
        loader: getAll(db.documents, Document)
      }, {
        path: ":id", Component: DocumentView,
        loader: ({params}) => db.elementWithId(params.id, "document"),
        children: [getNotesRoute(db.documents)]
      }]
    }, agentRoutes, {
      path: "event", children: [{
        index: true, Component: EventOverview,
        loader: getAll(db.events, EventExtended)
      }, {
        path: ":id", Component: EventView,
        loader: ({params}) => db.elementWithId(params.id, "event"),
        children: [getNotesRoute(db.events)]
      }]
    }, {
      path: "place", children: [{
        index: true, Component: PlaceOverview,
        loader: getAll(db.places, GedcomX.PlaceDescription)
      }, {
        path: ":id", Component: PlaceView,
        loader: ({params}) => db.elementWithId(params.id, "place"),
        children: [getNotesRoute(db.places)]
      }]
    }, {
      path: "imprint", Component: Imprint
    }]
  }]
}], {basename: "/family-tree"});

export default function App() {
  return <RouterProvider router={router}/>;
}
