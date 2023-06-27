import {Agent} from "../backend/gedcomx-extensions";
import {strings} from "../main";
import {useLoaderData} from "react-router-dom";
import {Article, LayoutContext, Main, ReactLink, ReactNavLink, Sidebar, VanillaLink} from "../App";
import {useContext, useEffect, useState} from "react";
import {db} from "../backend/db";

export function AgentOverview() {
  const agents = useLoaderData() as Agent[];
  const hasAgents = agents && agents.length > 0;

  return <Main><Article emoji="👤" title={strings.gedcomX.agent.agents}>
    {hasAgents && <AgentList agents={agents}/>}
    {!hasAgents && <p>{strings.gedcomX.agent.noAgents}</p>}
  </Article></Main>
}

function AgentList(props) {
  return <ul>
    {props.agents?.map(agent =>
      <li key={agent.id}><ReactNavLink
        to={`/agents/${agent.id}`}>{`👤 ${agent.name ?? strings.gedcomX.agent.agent}`}</ReactNavLink></li>)}
  </ul>;
}

export function AgentView() {
  const agent = useLoaderData() as Agent;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    db.agents.toArray().then(sds => sds.map(sd => new Agent(sd))).then(setOthers);
    layoutContext.setRightTitle(strings.gedcomX.agent.agents);
  }, [])

  return <>
    <Main>
      <Article emoji="👤" title={`${strings.gedcomX.agent.agent} ${agent.name ?? ""}`}>
        {agent.names?.length > 1 && <p>{strings.infoPanel.aka + agent.names.map(n => n.value).join(', ')}</p>}
        {agent.homepage && <p>{strings.gedcomX.agent.homepage}: <VanillaLink
          href={agent.homepage.resource}>{agent.homepage.resource}</VanillaLink></p>}
        {agent.openid && <p>OpenID: <VanillaLink href={agent.openid.resource}>{agent.openid.resource}</VanillaLink></p>}
        {agent.accounts && <>{strings.gedcomX.agent.accounts}: <ul>
          {agent.accounts.map((a, i) => <li key={i}>
            {strings.formatString(strings.gedcomX.agent.onlineAccount, <>{a.accountName}</>, <VanillaLink
              href={a.serviceHomepage.resource}>{a.serviceHomepage.resource}</VanillaLink>)}
          </li>)}
        </ul></>}
        {agent.emails && <>{strings.gedcomX.agent.emails}: <ul>
          {agent.emails.map(e => <li key={e.resource}><VanillaLink
            href={`mailto:${e.resource}`}>{e.resource}</VanillaLink></li>)}
        </ul></>}
        {agent.phones && <>{strings.gedcomX.agent.phones}:
          <ul>{agent.phones.map(p => <li key={p.resource}><VanillaLink
            href={`tel:${p.resource}`}>{p.resource}</VanillaLink></li>)}
          </ul></>}
        {agent.addresses && <>{strings.gedcomX.agent.addresses}: <ul>
          {agent.addresses.map(a => <li key={a.value}>{a.value}</li>)}
        </ul></>}
        {agent.person && <p>{strings.gedcomX.agent.person}: <ReactLink
          to={`/persons/${agent.person.resource.substring(1)}`}>{agent.person.resource}</ReactLink></p>}
      </Article>
    </Main>
    <Sidebar>
      <AgentList agents={others}/>
    </Sidebar>
  </>
}
