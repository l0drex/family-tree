import { redirect, RouteObject } from "react-router-dom";
import { db } from "../backend/db";
import { AgentOverview, AgentView } from "../components/Agents";
import { Agent } from "../gedcomx/gedcomx-js-extensions";
import * as GedcomX from "gedcomx-js";
import { getAll, pushArray, updateArray, updateDB, updateObject } from "./utils";
import { getIdentifierRoute } from "./general";

export const agentRoutes: RouteObject = {
    path: "agent", action: async ({request}) => {
        if (request.method !== "POST")
            return;

        const agent = await db.createAgent();
        return redirect(`/agent/${agent.id}`);
    },
    children: [{
        index: true,
        Component: AgentOverview,
        loader: getAll(db.agents, Agent)
    }, {
        path: ":id", Component: AgentView,
        loader: ({params}) => db.elementWithId(params.id, "agent"),
        action: async ({params, request}) => {
            if (request.method === "DELETE") {
                await db.agents.delete(params.id);
                return redirect("..");
            }
        }, children: [{
            path: "names", action: async ({request, params}) => {
                if (request.method !== "POST") {
                    return;
                }

                const formData = await request.formData();
                const agent = await db.agentWithId(params.id);

                let name = new GedcomX.TextValue(updateObject(formData));
                pushArray(agent.names, name);
                await updateDB(db.agents, params.id, "names", agent.names);
                return redirect("..");
            }, children: [{
                path: ":index", action: async ({request, params}) => {
                    const formData = await request.formData();
                    const agent = await db.agentWithId(params.id);

                    let name = null;
                    if (request.method === "POST") {
                        name = new GedcomX.TextValue(updateObject(formData));
                    }
                    updateArray(agent.names, Number(params.index), name);
                    await updateDB(db.agents, params.id, "names", agent.names);
                    return redirect("../..")
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
                pushArray(agent.accounts, account);
                await updateDB(db.agents, params.id, "accounts", agent.accounts);
                return redirect("..")
            }, children: [{
                path: ":index", action: async ({request, params}) => {
                    const formData = await request.formData();
                    const agent = await db.agentWithId(params.id);

                    let account = null;
                    if (request.method === "POST") {
                        account = new GedcomX.OnlineAccount(updateObject(formData));
                    }

                    updateArray(agent.accounts, Number(params.index), account);
                    await updateDB(db.agents, params.id, "accounts", agent.accounts);
                    return redirect("../..")
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
                pushArray(agent.emails, mail);
                await updateDB(db.agents, params.id, "emails", agent.emails);
                return redirect("..")
            },
            children: [{
                path: ":index", action: async ({request, params}) => {
                    const formData = await request.formData();
                    const agent = await db.agentWithId(params.id);

                    let mail = null;
                    if (request.method === "POST") {
                        mail = new GedcomX.ResourceReference(updateObject(formData));
                    }

                    updateArray(agent.emails, Number(params.index), mail);
                    await updateDB(db.agents, params.id, "emails", agent.emails);
                    return redirect("../..");
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
                pushArray(agent.phones, phone);
                await updateDB(db.agents, params.id, "phones", agent.phones);
                return redirect("..")
            },
            children: [{
                path: ":index", action: async ({request, params}) => {
                    const formData = await request.formData();
                    const agent = await db.agentWithId(params.id);

                    let phone = null;
                    if (request.method === "POST") {
                        phone = new GedcomX.ResourceReference(updateObject(formData));
                    }
                    updateArray(agent.phones, Number(params.index), phone);
                    await updateDB(db.agents, params.id, "phones", agent.phones);
                    return redirect("../..");
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
                pushArray(agent.addresses, address);
                await updateDB(db.agents, params.id, "addresses", agent.addresses);
                return redirect("..");
            }, children: [{
                path: ":index", action: async ({request, params}) => {
                    const formData = await request.formData();
                    const agent = await db.agentWithId(params.id);

                    let address = null;
                    if (request.method === "POST") {
                        address = new GedcomX.Address(updateObject(formData));
                    }

                    updateArray(agent.addresses, Number(params.index), address);
                    await updateDB(db.agents, params.id, "addresses", agent.addresses);
                    return redirect("../..");
                }
            }]
        }, getIdentifierRoute(db.agents)]
    }]
}
