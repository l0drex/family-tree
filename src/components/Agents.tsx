import { Agent } from "../gedcomx/gedcomx-js-extensions";
import { filterLang, strings } from "../main";
import { Link, useLoaderData } from "react-router-dom";
import {
  AddDataButton,
  Article,
  ButtonLike, DeleteDataButton, EditDataButton,
  Hr, Li,
  P,
  ReactLink,
  ReactNavLink,
  Tag,
  Tags, Td,
  Title,
  VanillaLink
} from "./GeneralComponents";
import { LayoutContext, Main, Sidebar } from "../App";
import { useContext, useEffect, useRef, useState } from "react";
import { db } from "../backend/db";
import * as GedcomX from "gedcomx-js";
import { Alias, Identifiers } from "./GedcomXComponents";
import emojis from '../backend/emojies.json';
import { useLiveQuery } from "dexie-react-hooks";
import * as React from "react";
import { useLocalStorage, writeStorage } from "@rehooks/local-storage";

const ActiveAgentKey = "activeAgent";

async function getAgent(id: string): Promise<Agent> {
  return db.agentWithId(id).catch(async e => {
    const agent = new Agent(await db.agents.toCollection().first());
    localStorage.setItem("activeAgent", agent?.id);
    return agent;
  });
}

function setActiveAgent(agent: Agent): void {
  return writeStorage(ActiveAgentKey, agent?.id);
}

export function AgentSelector() {
  const [agentId] = useLocalStorage<string>(ActiveAgentKey, null);
  const agent = useLiveQuery(() => getAgent(agentId), [agentId]);

  return <>
    <Link to={`/agent/${agent?.id}`} className="px-4 bg-white rounded-full py-2">
      <span className="mr-2 hidden lg:inline">{agent?.names?.filter(filterLang).at(0).value}</span>
      {emojis.agent.agent}
    </Link>
  </>
}

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
        to={`/agent/${agent.id}`}>{`${emojis.agent.agent} ${agent.name ?? strings.gedcomX.agent.agent}`}</ReactNavLink>
      </li>)}
    <li><ReactNavLink to="/agent/new">{`${emojis.new} ${strings.gedcomX.agent.new}`}</ReactNavLink></li>
  </ul>;
}

export function AgentView() {
  const agent = useLoaderData() as Agent;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  const [activeAgentId] = useLocalStorage<string>(ActiveAgentKey, null);
  const isActive = activeAgentId === agent.id;

  useEffect(() => {
    db.agents.toArray().then(sds => sds.map(sd => new Agent(sd))).then(setOthers);
    layoutContext.setHeaderChildren(<Title
      emoji={emojis.agent.agent}>{agent.name ?? strings.gedcomX.agent.agent}</Title>)
  }, [agent, layoutContext])

  const hasData = agent.names?.length > 1 || agent.homepage || agent.openid || agent.accounts || agent.emails || agent.phones || agent.addresses;

  return <>
    <Main>
      <Tags>
        {agent.person && <Tag>
          {strings.gedcomX.agent.person}: <ReactLink to={`/persons/${agent.person.resource.substring(1)}`}>
          {agent.person.resource}</ReactLink>
        </Tag>}
      </Tags>
      <Article>
        {agent.names && <Alias aliases={agent.names}/>}
        <table>
          <tbody>
          <tr>
            <Td>{`${emojis.agent.homepage} ${strings.gedcomX.agent.homepage}`}</Td>
            <Td>
              {agent.homepage ? <VanillaLink href={agent.homepage.resource}>{agent.homepage.resource}</VanillaLink>
                : strings.errors.noData}
            </Td>
          </tr>
          <tr>
            <Td>{`${emojis.agent.openid} OpenID`}</Td>
            <Td>
              {agent.openid ? <VanillaLink href={agent.openid?.resource}>{agent.openid?.resource}</VanillaLink>
                : strings.errors.noData}
            </Td>
          </tr>
          <tr>
            <Td>{`${emojis.agent.account} ${strings.gedcomX.agent.accounts}`}</Td>
            <Td>
              <ul>
                {agent.accounts?.map((a, i) =>
                  <Li key={i}>{strings.formatString(strings.gedcomX.agent.onlineAccount,
                    <span className="italic">{a.accountName}</span>,
                    <VanillaLink href={a.serviceHomepage.resource}>{a.serviceHomepage.resource}</VanillaLink>)}
                    <EditDataButton path={`account/${i}`}>
                      <AccountForm name={a.accountName} website={a.serviceHomepage.resource}/>
                    </EditDataButton>
                    <DeleteDataButton path={`account/${i}`}/>
                  </Li>) ?? <Li>{strings.errors.noData}</Li>}
                <Li><AddDataButton dataType={strings.gedcomX.agent.accounts} path="account">
                  <AccountForm />
                </AddDataButton></Li>
              </ul>
            </Td>
          </tr>
          <tr>
            <Td>{`${emojis.agent.email} ${strings.gedcomX.agent.emails}`}</Td>
            <Td>
              <ul>
                {agent.emails?.map(e => <Li key={e.resource}><VanillaLink
                  href={`mailto:${e.resource}`}>{e.resource}</VanillaLink></Li>) ?? <Li>{strings.errors.noData}</Li>}
              </ul>
            </Td>
          </tr>
          <tr>
            <Td>{`${emojis.agent.phones} ${strings.gedcomX.agent.phones}`}</Td>
            <Td>
              <ul>
                {agent.phones?.map(p => <Li key={p.resource}><VanillaLink
                  href={`tel:${p.resource}`}>{p.resource}</VanillaLink></Li>) ?? <Li>{strings.errors.noData}</Li>}
              </ul>
            </Td>
          </tr>
          <tr>
            <Td>
              {`${emojis.agent.address} ${strings.gedcomX.agent.addresses}`}
            </Td>
            <Td>
              <ul>
                {agent.addresses?.map(a => <Li key={a.value}>{a.value}</Li>) ?? <Li>{strings.errors.noData}</Li>}
              </ul>
            </Td>
          </tr>
          </tbody>
        </table>
      </Article>
    </Main>
    <Sidebar>
      <AgentList agents={others}/>
      {agent.identifiers && <>
        <Hr/>
        <Identifiers identifiers={agent.identifiers}/>
      </>}
      <Hr/>
      <div className="text-center">
        <ButtonLike primary={isActive}>
          <button className="px-4 py-2 hover:cursor-pointer" onClick={() => setActiveAgent(agent)}>
            {isActive ? strings.gedcomX.agent.selected : strings.gedcomX.agent.select}
          </button>
        </ButtonLike>
      </div>
    </Sidebar>
  </>
}

function AccountForm({name, website}: {name?: string, website?: string}) {
  return <>
    <label htmlFor="accountName">{strings.gedcomX.agent.accountName}</label>
    <input id={"accountName"} name="account" type="text" defaultValue={name} contentEditable={true} className="rounded-full px-4"/>

    <label htmlFor="website" className="mr-2">{strings.gedcomX.agent.website}</label>
    <input id="website" name="serviceHomepage" type="url" defaultValue={website} className="rounded-full px-4"/>
  </>
}
