import { Agent, Person } from "../gedcomx/gedcomx-js-extensions";
import { filterLang, strings } from "../main";
import { Link, useLoaderData } from "react-router-dom";
import {
  AddDataButton,
  Article,
  ButtonLike,
  CreateNewButton,
  DeleteDataButton,
  EditDataButton,
  Hr,
  Input,
  Li,
  ReactLink,
  ReactNavLink,
  Tag,
  Tags,
  Title,
  VanillaLink
} from "./GeneralComponents";
import { LayoutContext, Main, Sidebar } from "../Layout";
import * as React from "react";
import { useContext, useEffect, useState } from "react";
import { db } from "../backend/db";
import { Identifiers } from "./GedcomXComponents";
import emojis from '../backend/emojies.json';
import { writeStorage } from "@rehooks/local-storage";
import { useLiveQuery } from "dexie-react-hooks";
import { Attribution, ResourceReference } from "gedcomx-js";

export const ActiveAgentKey = "activeAgent";

function setActiveAgent(agent: Agent): void {
  return writeStorage(ActiveAgentKey, agent?.id);
}

export function AgentSelector({agent}: {agent: Agent}) {
  return <>
    <Link to={`/agent/${agent?.id}`} className="px-4 bg-white rounded-full py-2">
      <span className="mr-2 hidden lg:inline">{agent?.names?.filter(filterLang).at(0)?.value ?? strings.gedcomX.agent.agent}</span>
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
    <li><CreateNewButton path={"/agent"} label={strings.gedcomX.agent.new}/></li>
  </ul>;
}

export function AgentView() {
  const agent = useLoaderData() as Agent;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  const isActive = layoutContext.agent?.id === agent.id;

  useEffect(() => {
    db.agents.toArray().then(sds => sds.map(sd => new Agent(sd))).then(setOthers);
    layoutContext.setHeaderChildren(<Title
      emoji={emojis.agent.agent}>{agent.name ?? strings.gedcomX.agent.agent}</Title>)
  }, [agent, layoutContext])

  return <>
    <Main>
      <Tags>
        {agent.person ? <Tag>
          {strings.gedcomX.agent.person}: <ReactLink to={`/persons/${agent.person.resource.substring(1)}`}>
          {agent.person.resource}</ReactLink>
          <EditDataButton path="person">
            <PersonForm person={agent.person} />
          </EditDataButton>
          <DeleteDataButton path="person"/>
        </Tag> : <AddDataButton dataType={strings.gedcomX.person.persons} path={"person"}>
          <PersonForm />
        </AddDataButton>}
      </Tags>
      <Article>
        <div className="grid grid-cols-2 gap-4" id="agentTable">
          <div>{`${emojis.name} ${strings.gedcomX.person.names}`}</div>
          <div>
            <ul>
              {agent.names?.map((n, i) => {
                return <Li key={i}>
                  <span>{n.value}</span>
                  <EditDataButton path={`names/${i}`}>
                    <NameForm name={n.value}/>
                  </EditDataButton>
                  <DeleteDataButton path={`names/${i}`}/>
                </Li>
              }) ?? <Li><span>{strings.errors.noData}</span></Li>}
              <Li><AddDataButton dataType={strings.gedcomX.person.names} path="names">
                <NameForm/>
              </AddDataButton></Li>
            </ul>
          </div>

          <div>{`${emojis.agent.homepage} ${strings.gedcomX.agent.homepage}`}</div>
          <div>
            {agent.homepage ? <VanillaLink href={agent.homepage.resource}>{agent.homepage.resource}</VanillaLink>
              : <span>{strings.errors.noData}</span>}
            <EditDataButton path="homepage">
              <HomepageForm homepage={agent.homepage?.resource}/>
            </EditDataButton>
            {agent.homepage && <DeleteDataButton path="homepage"/>}
          </div>

          <div>{`${emojis.agent.openid} OpenID`}</div>
          <div>
            {agent.openid ? <VanillaLink href={agent.openid?.resource}>{agent.openid?.resource}</VanillaLink>
              : <span>{strings.errors.noData}</span>}
            <EditDataButton path="openid">
              <OpenIdForm openid={agent.openid?.resource}/>
            </EditDataButton>
            {agent.openid && <DeleteDataButton path="openid"/>}
          </div>

          <div>{`${emojis.agent.account} ${strings.gedcomX.agent.accounts}`}</div>
          <div>
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
                <AccountForm/>
              </AddDataButton></Li>
            </ul>
          </div>

          <div>{`${emojis.agent.email} ${strings.gedcomX.agent.emails}`}</div>
          <div>
            <ul>
              {agent.emails?.map((e, i) => <Li key={i}>
                <VanillaLink href={`mailto:${e.resource}`}>{e.resource}</VanillaLink>
                <EditDataButton path={`emails/${i}`}>
                  <EmailForm email={e.resource}/>
                </EditDataButton>
                <DeleteDataButton path={`emails/${i}`}/>
              </Li>) ?? <Li>{strings.errors.noData}</Li>}
              <Li><AddDataButton dataType={strings.gedcomX.agent.emails} path="emails">
                <EmailForm/>
              </AddDataButton></Li>
            </ul>
          </div>

          <div>{`${emojis.agent.phones} ${strings.gedcomX.agent.phones}`}</div>
          <div>
            <ul>
              {agent.phones?.map((p, i) => <Li key={i}>
                <VanillaLink href={`tel:${p.resource}`}>{p.resource}</VanillaLink>
                <EditDataButton path={`phones/${i}`}>
                  <PhoneForm phone={p.resource}/>
                </EditDataButton>
                <DeleteDataButton path={`phones/${i}`}/>
              </Li>) ?? <Li>{strings.errors.noData}</Li>}
              <Li><AddDataButton dataType={strings.gedcomX.agent.phones} path="phones">
                <PhoneForm/>
              </AddDataButton></Li>
            </ul>
          </div>

          <div>{`${emojis.agent.address} ${strings.gedcomX.agent.addresses}`}</div>
          <div>
            <ul>
              {agent.addresses?.map((a, i) => <Li key={a.value}>
                <span>{a.value}</span>
                <EditDataButton path={`addresses/${i}`}>
                  <AddressForm address={a.value}/>
                </EditDataButton>
                <DeleteDataButton path={`addresses/${i}`}/>
              </Li>) ?? <Li>{strings.errors.noData}</Li>}
              <Li><AddDataButton dataType={strings.gedcomX.agent.addresses} path="addresses">
                <AddressForm/>
              </AddDataButton></Li>
            </ul>
          </div>
        </div>
      </Article>
    </Main>
    <Sidebar>
      <AgentList agents={others}/>
      {(agent.identifiers || layoutContext.edit) && <>
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
        <DeleteDataButton path=""/>
      </div>
    </Sidebar>
  </>
}

function NameForm({name}: {name?: string}) {
  return <Input type="text" name="value" label={strings.gedcomX.person.names} defaultValue={name}/>
}

function HomepageForm({homepage}: { homepage?: string }) {
  return <Input type="url" name="homepage" defaultValue={homepage} label={strings.gedcomX.agent.homepage}/>;
}

function OpenIdForm({openid}: { openid?: string }) {
  return <Input type="url" name="openid" defaultValue={openid} label="OpenID"/>;
}

function AccountForm({name, website}: { name?: string, website?: string }) {
  return <>
    <Input name="account" type="text" label={strings.gedcomX.agent.accountName} defaultValue={name} />
    <Input name="serviceHomepage" type="url" defaultValue={website} label={strings.gedcomX.agent.website}/>
  </>
}

function EmailForm({email}: { email?: string }) {
  return <Input type="email" name="email" defaultValue={email} label={strings.gedcomX.agent.emails}/>;
}

function PhoneForm({phone}: { phone?: string }) {
  return <Input type="tel" name="phone" defaultValue={phone} label={strings.gedcomX.agent.phones} />;
}

function AddressForm({address}: { address?: string }) {
  return <Input type="text" name="value" defaultValue={address} label={strings.gedcomX.agent.addresses}/>;
}

function PersonForm({person}: { person?: ResourceReference }) {
  const persons = useLiveQuery(async () =>
    db.persons.toArray().then(persons => persons.map(p => new Person(p))),
    []);

  return <>
    <input type="search" name="person" list="persons" defaultValue={person?.resource}/>
    <datalist id="persons">
      {persons?.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
    </datalist>
  </>
}

export function UpdateAttribution({attribution}: { attribution?: Attribution }) {
  const agent = useContext(LayoutContext).agent;

  if (!agent) {
    return <></>;
  }

  if (attribution == null) {
    attribution = new Attribution()
      .setCreator(new ResourceReference().setResource("#" + agent.id))
      .setCreated(Date.now());
  }

  attribution.setModified(Date.now())
    .setContributor(new ResourceReference().setResource("#" + agent.id));

  return <>
    <Input type={"text"} name={"changeMessage"} label={strings.gedcomX.conclusion.attribution.changeMessage}/>
    <textarea hidden readOnly name="attribution" value={JSON.stringify(attribution.toJSON())} />
  </>
}
