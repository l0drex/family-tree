import { useLoaderData, useParams } from "react-router-dom";
import { strings } from "../main";
import {
  ConclusionArticles,
  ConclusionMisc,
  ConclusionSidebar,
} from "./GedcomXComponents";
import { Article, ReactNavLink, Tags, Title } from "./GeneralComponents";
import React, { useContext, useEffect } from "react";
import {Fact} from "../gedcomx/gedcomx-js-extensions";
import { LayoutContext, Main, Sidebar } from "../Layout";
import emojies from "../backend/emojies.json";

export default function FactComponent() {
  const facts = useLoaderData() as Fact[];
  const params = useParams();
  const layoutContext = useContext(LayoutContext);

  const fact = facts[Number(params.index)];

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojies.event.default}>{strings.gedcomX.facts}</Title>)
  }, [fact, layoutContext])

  return <>
    <Main>
      <Tags>
        <ConclusionMisc conclusion={fact} />
      </Tags>
      <Article title={fact.localType} emoji={fact.emoji}>
        {fact.value}
        <div className="grid grid-cols-2">
          <span>Date</span>
          <span>{fact.getDate()?.toString()}</span>
          <span>Place</span>
          <span>{fact.getPlace()?.toString()}</span>
        </div>
      </Article>
      <ConclusionArticles conclusion={fact} />
    </Main>
    <Sidebar>
      <nav>
        <ReactNavLink to={`../`}>{emojies.left} {strings.gedcomX.person.persons}</ReactNavLink>
        <div className="mb-2"/>
        {facts.map((f, i) => <ReactNavLink key={i} to={`../facts/${i}`}>{f.emoji} {f.localType}</ReactNavLink>)}
      </nav>
      <ConclusionSidebar conclusion={fact} />
    </Sidebar>
  </>;
}
