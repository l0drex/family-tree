import { useLoaderData, useParams } from "react-router-dom";
import { filterLang, strings } from "../main";
import { ConclusionArticles, ConclusionMisc, ConclusionSidebar, } from "./GedcomXComponents";
import {
  AddDataButton,
  Article, DeleteDataButton,
  EditDataButton, Hr,
  Input,
  ReactLink,
  ReactNavLink, Select,
  Tag,
  Tags,
  Title
} from "./GeneralComponents";
import React, { useContext, useEffect } from "react";
import { Fact, PlaceDescription } from "../gedcomx/gedcomx-js-extensions";
import { LayoutContext, Main, Sidebar } from "../Layout";
import emojies from "../backend/emojies.json";
import { baseUri } from "../gedcomx/types";
import DateForm, { PlaceForm, QualifierForm } from "./GeneralForms";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../backend/db";
import { UpdateAttribution } from "./Agents";
import { sortPersonFacts } from "../routes/utils";


export function FactForm({types, fact}: { types: object, fact?: Fact }) {
  const options = Object.keys(types)
    .sort((a, b) => (types[a] as string).localeCompare(types[b]))
    .map(type => ({
      value: baseUri + type,
      text: `${emojies.fact[type] ?? emojies.fact.default} ${types[type]}`
    }));

  return <>
    <Select name="type" label={strings.gedcomX.fact.type} options={options} defaultValue={fact?.type}/>
    <Input type="text" name="value" label={strings.gedcomX.fact.value} defaultValue={fact?.value}/>
  </>
}

export default function FactComponent() {
  const facts = useLoaderData() as Fact[];
  facts.sort(sortPersonFacts);
  const params = useParams();
  const layoutContext = useContext(LayoutContext);
  const placeDescription = useLiveQuery(async () =>
    db.elementWithId(fact.getPlace()?.getDescription(), "place").catch(() => undefined), [facts]) as PlaceDescription;

  const fact = facts[Number(params.index)];
  const type = params["*"].split("/")[0];
  const types = type === "person" ? strings.gedcomX.person.factTypes
    : type === "couple" ? strings.gedcomX.relationship.factTypes.Couple
      : strings.gedcomX.relationship.factTypes.ParentChild;
  const placeString = fact.getPlace()?.getOriginal()
      ?? placeDescription?.getNames().filter(filterLang)[0].getValue()
      ?? fact.getPlace()?.getDescription();

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojies.event.default}>{strings.gedcomX.facts}</Title>)
  }, [fact, layoutContext])

  const qualifierForm = (qualifier?) => <>
    <QualifierForm types={strings.gedcomX.factQualifier} qualifier={qualifier}/>
    <UpdateAttribution attribution={fact.getAttribution()} />
  </>

  return <>
    <Main>
      <Tags>
        {fact.getQualifiers().map((q, i) =>
          <Tag key={i} form={qualifierForm(q)} path={`qualifier/${i}`}>
            {strings.gedcomX.factQualifier[q.name.substring(baseUri.length)]}: {q.value}
          </Tag>)}
        <AddDataButton dataType={strings.gedcomX.qualifier.qualifier} path="qualifier">
          {qualifierForm()}
        </AddDataButton>
        <ConclusionMisc conclusion={fact}/>
      </Tags>
      <Article>
        <div className="flex flex-row">
          <Title emoji={fact.emoji}>{fact.localType}{fact.value && ": " + fact.value}</Title>
          <EditDataButton path=".">
            <FactForm types={types} fact={fact} />
            <UpdateAttribution attribution={fact.getAttribution()} />
          </EditDataButton>
        </div>
        <div className="grid grid-cols-2">
          <span>{strings.gedcomX.date.date}</span>
          <span>{fact.getDate()?.toString() ?? "-"} <EditDataButton path={"date"}>
            <DateForm date={fact.getDate()} />
            <UpdateAttribution attribution={fact.getAttribution()} />
          </EditDataButton></span>
          <span>{strings.gedcomX.place.place}</span>
          <span>{fact.getPlace()?.getDescription()
            ? <ReactLink to={`/place/${fact.getPlace()?.getDescription().substring(1)}`}>{placeString}</ReactLink>
            : <>{placeString ?? "-"}</>
            ?? "-"} <EditDataButton path={"place"}>
            <PlaceForm place={fact.getPlace()} />
            <UpdateAttribution attribution={fact.getAttribution()} />
          </EditDataButton></span>
        </div>
      </Article>
      <ConclusionArticles conclusion={fact}/>
    </Main>
    <Sidebar>
      <nav>
        <ReactNavLink to={`../..`}>{emojies.left} {type === "person"
          ? strings.gedcomX.person.persons
          : strings.gedcomX.relationship.relationships}
        </ReactNavLink>
        <div className="mb-2"/>
        {facts.map((f, i) => <ReactNavLink key={i} to={`../${i}`}>{f.emoji} {f.localType}</ReactNavLink>)}
      </nav>
      <ConclusionSidebar conclusion={fact}/>
      <Hr/>
      <div className="text-center">
        <DeleteDataButton path="" label />
        <AddDataButton dataType={strings.gedcomX.facts} path={"../"}>
          <FactForm types={strings.gedcomX.person.factTypes} />
        </AddDataButton>
      </div>
    </Sidebar>
  </>;
}