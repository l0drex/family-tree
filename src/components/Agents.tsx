import {Agent} from "../backend/gedcomx-extensions";
import {strings} from "../main";
import {Link, useLoaderData} from "react-router-dom";

export function AgentOverview() {
  const agents = useLoaderData() as Agent[];
  const hasAgents = agents && agents.length > 0;

  return <main><article>
    <h1><span className={"emoji"}>👤</span> {strings.gedcomX.agent.agents}</h1>
    {hasAgents && <ul className={"clickable"}>
      {agents?.map(agent =>
        <li key={agent.id}><Link to={`${agent.id}`}>{`👤 ${agent.name ?? strings.gedcomX.agent.agent}`}</Link></li>)}
    </ul>}
  </article></main>
}

export function AgentView() {
  const agent = useLoaderData() as Agent;

  return <main>
    <article>
      <h1><span className={"emoji"}>👤</span> {`${strings.gedcomX.agent.agent} ${agent.name ?? ""}`}</h1>
      {agent.names?.length > 1 && <p>{strings.infoPanel.aka + agent.names.map(n => n.value).join(', ')}</p>}
      {agent.homepage && <p>{strings.gedcomX.agent.homepage}: <a href={agent.homepage.resource}>{agent.homepage.resource}</a></p>}
      {agent.openid && <p>OpenID: <a href={agent.openid.resource}>{agent.openid.resource}</a></p>}
      {agent.accounts && <>{strings.gedcomX.agent.accounts}: <ul>
        {agent.accounts.map((a, i) => <li key={i}>
          {strings.formatString(strings.gedcomX.agent.onlineAccount, <>{a.accountName}</>, <a href={a.serviceHomepage.resource}>{a.serviceHomepage.resource}</a>)}
        </li>)}
      </ul></>}
      {agent.emails && <>{strings.gedcomX.agent.emails}: <ul>
        {agent.emails.map(e => <li key={e.resource}><a href={`mailto:${e.resource}`}>{e.resource}</a></li>)}
      </ul></>}
      {agent.phones && <>{strings.gedcomX.agent.phones}:
        <ul>{agent.phones.map(p => <li key={p.resource}><a href={`tel:${p.resource}`}>{p.resource}</a></li>)}
        </ul></>}
      {agent.addresses && <>{strings.gedcomX.agent.addresses}: <ul>
        {agent.addresses.map(a => <li key={a.value}>{a.value}</li>)}
      </ul></>}
      {agent.person && <p>{strings.gedcomX.agent.person}: <Link to={`/persons/${agent.person.resource.substring(1)}`}>{agent.person.resource}</Link></p>}
    </article>
  </main>
}
