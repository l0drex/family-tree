import {Agent} from "../backend/gedcomx-extensions";
import {strings} from "../main";
import {useLoaderData} from "react-router-dom";
import {Article, Hr, P, ReactLink, ReactNavLink, Tag, Title, VanillaLink} from "./GeneralComponents";
import {LayoutContext, Main, Sidebar} from "../App";
import {ReactNode, useContext, useEffect, useState} from "react";
import {db} from "../backend/db";
import {Alias, Identifiers} from "./GedcomXComponents";
import emojis from '../backend/emojies.json';

export function AgentOverview() {
  const agents = useLoaderData() as Agent[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.agent.agent}>{strings.gedcomX.agent.agents}</Title>);
  }, [layoutContext])

  return <Main>
    <Article><AgentList agents={agents}/></Article>
  </Main>
}

function AgentList(props) {
  return <ul>
    {props.agents?.map(agent =>
      <li key={agent.id}><ReactNavLink
        to={`/agent/${agent.id}`}>{`${emojis.agent.agent} ${agent.name ?? strings.gedcomX.agent.agent}`}</ReactNavLink></li>)}
  </ul>;
}

function Tags(props: { children: ReactNode }) {
  return null;
}

export function AgentView() {
  const agent = useLoaderData() as Agent;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    db.agents.toArray().then(sds => sds.map(sd => new Agent(sd))).then(setOthers);
    layoutContext.setHeaderChildren(<Title emoji={emojis.agent.agent}>{agent.name ?? strings.gedcomX.agent.agent}</Title>)
    layoutContext.setRightTitle(strings.gedcomX.agent.agents);
  }, [agent, layoutContext])

  const hasData = agent.names?.length > 1 || agent.homepage || agent.openid || agent.accounts || agent.emails || agent.phones || agent.addresses;

  // todo linked person not visible

  return <>
    <Main>
      <Tags>
        {agent.person && <Tag>
          {strings.gedcomX.agent.person}: <ReactLink to={`/persons/${agent.person.resource.substring(1)}`}>
          {agent.person.resource}</ReactLink>
        </Tag>}
      </Tags>
      <Article>
        {!hasData && <p>{strings.errors.noData}</p>}
        {agent.names && <Alias aliases={agent.names}/>}

        {agent.homepage && <>
          <Title emoji={emojis.agent.homepage}>{strings.gedcomX.agent.homepage}</Title>
          <P><VanillaLink href={agent.homepage.resource}>{agent.homepage.resource}</VanillaLink></P>
        </>}

        {agent.openid && <>
          <Title emoji={emojis.agent.openid}>OpenID</Title>
          <P><VanillaLink href={agent.openid.resource}>{agent.openid.resource}</VanillaLink></P>
        </>}

        {agent.accounts && <>
          <Title emoji={emojis.agent.account}>{strings.gedcomX.agent.accounts}</Title>
          <ul>
            {agent.accounts.map((a, i) =>
              <li key={i}>{strings.formatString(strings.gedcomX.agent.onlineAccount,
                <span className="italic">{a.accountName}</span>,
                <VanillaLink href={a.serviceHomepage.resource}>{a.serviceHomepage.resource}</VanillaLink>)}
              </li>)}
          </ul>
        </>}

        {agent.emails && <>
          <Title emoji={emojis.agent.email}>{strings.gedcomX.agent.emails}</Title>
          <ul>
            {agent.emails.map(e => <li key={e.resource}><VanillaLink
              href={`mailto:${e.resource}`}>{e.resource}</VanillaLink></li>)}
          </ul>
        </>}

        {agent.phones && <>
          <Title emoji={emojis.agent.phones}>{strings.gedcomX.agent.phones}</Title>
          <ul>
            {agent.phones.map(p => <li key={p.resource}><VanillaLink
              href={`tel:${p.resource}`}>{p.resource}</VanillaLink></li>)}
          </ul>
        </>}

        {agent.addresses && <>
          <Title emoji={emojis.agent.address}>{strings.gedcomX.agent.addresses}</Title>
          <ul>
            {agent.addresses.map(a => <li key={a.value}>{a.value}</li>)}
          </ul>
        </>}
      </Article>
    </Main>
    <Sidebar>
      <AgentList agents={others}/>
      {agent.identifiers && <>
        <Hr/>
        <Identifiers identifiers={agent.identifiers}/>
      </>}
    </Sidebar>
  </>
}
