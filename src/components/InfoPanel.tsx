import { baseUri } from "../gedcomx/types";
import { filterLang, strings } from "../main";
import { db } from "../backend/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Fact, GDate, Person } from "../gedcomx/gedcomx-js-extensions";
import { SubjectArticles, SubjectMisc, SubjectSidebar } from "./GedcomXComponents";
import { Sidebar } from "../Layout";
import {
  AddDataButton,
  Article,
  ArticleTag,
  DateTimeInput,
  Details,
  Input,
  Tag,
  Tags,
  Title
} from "./GeneralComponents";
import { Name } from "gedcomx-js";
import emojis from '../backend/emojies.json';
import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { FactForm } from "./FactComponent";

function InfoPanel({person}: { person: Person }) {
  if (!person) {
    return <aside id={"info-panel"}></aside>
  }

  return (
    <Sidebar id="info-panel">
      <Names names={person.names}/>

      <Facts facts={person.getFacts()}/>

      <Relationships person={person}/>

      <SubjectArticles subject={person} noMargin/>
      <Tags>
        {person.isPrivate && <Tag>{strings.gedcomX.person.private}</Tag>}
        <SubjectMisc subject={person}/>
      </Tags>

      <SubjectSidebar subject={person}/>
    </Sidebar>
  );
}

function Names({names}: { names: Name[] }) {
  if (!names || names.length === 0) return <></>

  return <section>
    <Title emoji={emojis.name}>{strings.gedcomX.person.names}</Title>
    {names.map((n, i) => {
      return <Article key={i}>
        {n.nameForms.map((nf, j) =>
          <details className="mb-2 last:mb-0 pb-2 last:pb-0" key={j}>
            <summary>
              {`${nf.getFullText(true)} ${nf.lang ? `(${nf.lang})` : ""}`}
            </summary>

            <div className="grid grid-cols-2 mt-2">
              {nf.parts?.map((p, k) => {
                let type = strings.gedcomX.person.namePartTypes[p.type?.substring(baseUri.length)];
                if (type != null) {
                  type += ":";
                }

                return <Fragment key={k}>
                  <span>{type}</span>
                  <span>{p.value}</span>
                  <div className="col-span-2 mb-2 last:mb-0 flex gap-2">
                    {p.qualifiers?.length && p.qualifiers?.map(q =>
                      <ArticleTag>{(strings.gedcomX.person.namePartQualifier[q.name.substring(baseUri.length)] ?? q.name) + (q.value ? `: ${q.value}` : "")}</ArticleTag>)}
                  </div>
                </Fragment>;
              })}
            </div>
          </details>)}
        <AddDataButton dataType={strings.gedcomX.person.names} path={`names/${i}`}>
          <NameFormForm/>
        </AddDataButton>
        {(n.type || n.date) && <section className="mt-2 flex flex-row flex-wrap gap-2">
          {n.type && <ArticleTag>{strings.gedcomX.person.nameTypes[n.type.substring(baseUri.length)]}</ArticleTag>}
          {n.date && <ArticleTag>{new GDate(n.date.toJSON()).toString()}</ArticleTag>}
        </section>}
      </Article>
    })}
    <AddDataButton dataType={strings.gedcomX.person.names} path="names">
      <NameForm/>
    </AddDataButton>
  </section>
}

function NameForm(name) {
  const nameTypes = strings.gedcomX.person.nameTypes;

  return <>
    <label>{strings.gedcomX.fact.type}</label>
    <select name="type" className="bg-white rounded-full px-4 py-1">
      <option>-</option>
      {Object.keys(nameTypes).map(t => <option value={baseUri + t} key={t}>{nameTypes[t]}</option>)}
    </select>
    <NameFormForm/>
  </>
}

function NameFormForm(nameForm) {
  return <>
    <Input type="text" label={strings.gedcomX.person.names} name="fullText"/>
  </>
}

function Facts({facts}: { facts: Fact[] }) {
  const navigate = useNavigate();

  if (!facts || facts.length === 0) return <></>

  return <section>
    <Title emoji={emojis.fact.default}>{strings.gedcomX.facts}</Title>
    {facts
      .filter(filterLang)
      .map((f, i) => {
        return <Article key={i} onClick={() => navigate(`facts/${i}`)}>
          <FactContent fact={f}/>
        </Article>
      })}
    <AddDataButton dataType={strings.gedcomX.facts} path={"facts"}>
      <FactForm types={strings.gedcomX.person.factTypes} />
    </AddDataButton>
  </section>
}

function FactContent({fact}: {
  fact: Fact
}) {
  const hasMisc = fact.getDate() || fact.getPlace() || fact.getQualifiers().length > 0
    || fact.confidence || fact.analysis;

  const originalType = fact.type.substring(baseUri.length);
  const type = strings.gedcomX.person.factTypes[originalType]
    ?? strings.gedcomX.relationship.factTypes.Couple[originalType]
    ?? strings.gedcomX.relationship.factTypes.ParentChild[originalType]
    ?? originalType;

  return <>
    {fact.emoji} {type + (fact.value ? `: ${fact.value}` : "")}

    {hasMisc && <section className="mt-2 flex flex-row flex-wrap gap-2">
      {fact.getDate() && <ArticleTag>{fact.getDate().toString()}</ArticleTag>}
      {fact.getPlace() && <ArticleTag>{fact.getPlace().toString()}</ArticleTag>}
      {fact.getQualifiers().map((q, i) =>
        <ArticleTag key={i}>
          {strings.gedcomX.factQualifier[q.name.substring(baseUri.length)]}: {q.value}
        </ArticleTag>)}
    </section>}
  </>;
}

function Relationships({person}: { person: Person }) {
  const parents = useLiveQuery(async () => {
    if (!person) return;

    return db.getParentsOf(person.id).then(parents =>
      Promise.all(parents.map(r => db.personWithId(r))));
  }, [person])

  const children = useLiveQuery(async () => {
    if (!person) return;

    return db.getChildrenOf(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person])

  const partner = useLiveQuery(async () => {
    if (!person) return;

    return db.getPartnerOf(person.id).then(partner =>
      Promise.all(partner.map(r => db.personWithId(r))));
  }, [person])

  const godparents = useLiveQuery(async () => {
    if (!person) return;

    return db.getGodparentsOf(person.id).then(parents =>
      Promise.all(parents.map(r => db.personWithId(r))));
  }, [person])

  const godchildren = useLiveQuery(async () => {
    if (!person) return;

    return db.getGodchildrenOf(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person])

  const enslavedBy = useLiveQuery(async () => {
    if (!person) return;

    return db.getEnslavers(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person])

  const slaves = useLiveQuery(async () => {
    if (!person) return;

    return db.getSlaves(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person])

  return <Details title={strings.gedcomX.relationship.relationships}>
    <RelationshipType others={partner} emoji={emojis.relationship.partner}
                      title={strings.gedcomX.relationship.partner}/>
    <RelationshipType others={parents} emoji={emojis.relationship.parent}
                      title={strings.gedcomX.relationship.parents}/>
    <RelationshipType others={children} emoji={emojis.relationship.child}
                      title={strings.gedcomX.relationship.children}/>
    <RelationshipType others={godparents} emoji={emojis.relationship.godparent}
                      title={strings.gedcomX.relationship.godparents}/>
    <RelationshipType others={godchildren} emoji={emojis.relationship.godchild}
                      title={strings.gedcomX.relationship.godchildren}/>
    <RelationshipType others={enslavedBy} emoji={emojis.relationship.enslaver}
                      title={strings.gedcomX.relationship.enslavedBy}/>
    <RelationshipType others={slaves} emoji={emojis.relationship.slaves}
                      title={strings.gedcomX.relationship.slaves}/>
  </Details>
}

function RelationshipType({others, emoji, title}: {
  others: Person[],
  emoji: string,
  title: string
}) {

  if (!others?.length)
    return <></>

  return <section className="mb-4 last:mb-0 mt-2">
    <Title emoji={emoji}>{title}</Title>
    {others?.map((r, i) => <div key={i} className="mb-4 last:mb-0">
      <Article>{others?.at(i)?.fullName}</Article>
    </div>)}
  </section>
}

export default InfoPanel;
