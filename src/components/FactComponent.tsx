import { useLoaderData, useParams } from "react-router-dom";
import { strings } from "../main";
import { ConclusionArticles, ConclusionMisc, ConclusionSidebar, } from "./GedcomXComponents";
import { Article, EditDataButton, Input, ReactNavLink, Tags, Title } from "./GeneralComponents";
import React, { useContext, useEffect } from "react";
import { Fact } from "../gedcomx/gedcomx-js-extensions";
import { LayoutContext, Main, Sidebar } from "../Layout";
import emojies from "../backend/emojies.json";
import { baseUri } from "../gedcomx/types";
import DateForm from "./GeneralForms";


function FactForm({types, fact}: { types: object, fact?: Fact }) {
  return <>
    <label htmlFor="type">type</label>
    <select id="type" name="type" defaultValue={fact.type} className="bg-white rounded-full px-4">
      {Object.keys(types)
        .sort((a, b) => (types[a] as string).localeCompare(types[b]))
        .map(type =>
          <option key={type} value={baseUri + type}>{emojies.fact[type]} {types[type]}</option>)}
    </select>
    <Input type="text" name="value" label={"value"} defaultValue={fact?.value}/>
  </>
}

export default function FactComponent() {
  const facts = useLoaderData() as Fact[];
  const params = useParams();
  const layoutContext = useContext(LayoutContext);

  const fact = facts[Number(params.index)];
  const type = params["*"].split("/")[0];
  const types = type === "person" ? strings.gedcomX.person.factTypes
    : type === "couple" ? strings.gedcomX.relationship.factTypes.Couple
      : strings.gedcomX.relationship.factTypes.ParentChild;

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojies.event.default}>{strings.gedcomX.facts}</Title>)
  }, [fact, layoutContext])

  return <>
    <Main>
      <Tags>
        <ConclusionMisc conclusion={fact}/>
      </Tags>
      <Article>
        <div className="flex flex-row">
          <Title emoji={fact.emoji}>{fact.localType}{fact.value && ": " + fact.value}</Title>
          <EditDataButton path=".">
            <FactForm types={types} fact={fact}/>
          </EditDataButton>
        </div>
        <div className="grid grid-cols-2">
          <span>{strings.gedcomX.date.date}</span>
          <span>{fact.getDate()?.toString() ?? "-"} <EditDataButton path={"date"}>
            <DateForm date={fact.getDate()} />
          </EditDataButton></span>
          <span>{strings.gedcomX.place.place}</span>
          <span>{fact.getPlace()?.toString() ?? "-"}</span>
        </div>
      </Article>
      <ConclusionArticles conclusion={fact}/>
    </Main>
    <Sidebar>
      <nav>
        <ReactNavLink to={`../`}>{emojies.left} {type === "person"
          ? strings.gedcomX.person.persons
          : strings.gedcomX.relationship.relationships}
        </ReactNavLink>
        <div className="mb-2"/>
        {facts.map((f, i) => <ReactNavLink key={i} to={`../facts/${i}`}>{f.emoji} {f.localType}</ReactNavLink>)}
      </nav>
      <ConclusionSidebar conclusion={fact}/>
    </Sidebar>
  </>;
}
