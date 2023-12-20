import { baseUri, NameTypes, RelationshipTypes } from "../gedcomx/types";
import { filterLang, strings } from "../main";
import { db } from "../backend/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Fact, GDate, Person, Relationship } from "../gedcomx/gedcomx-js-extensions";
import { SubjectArticles, SubjectMisc, SubjectSidebar } from "./GedcomXComponents";
import { LayoutContext, Sidebar } from "../Layout";
import {
  AddDataButton,
  Article,
  ArticleTag,
  DateTimeInput, DeleteDataButton,
  Details, EditDataButton,
  Input, Search, Select,
  Tag,
  Tags,
  Title
} from "./GeneralComponents";
import { Name } from "gedcomx-js";
import emojis from '../backend/emojies.json';
import React, { Fragment, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FactForm } from "./FactComponent";
import * as GedcomX from "gedcomx-js";

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
  const editing = useContext(LayoutContext).edit;

  if (!names || names.length === 0) return <></>

  return <section>
    <Title emoji={emojis.name}>{strings.gedcomX.person.names}</Title>
    {names.map((n, i) => {
      return <Article key={i}>
        {n.nameForms.map((nf, j) =>
          <details className="mb-2 last:mb-0 pb-2 last:pb-0" key={j}>
            <summary>
              {`${nf.getFullText(true)} ${nf.lang ? `(${nf.lang})` : ""}`}
              <EditDataButton path={`names/${i}/form/${j}`}>
                <NameFormForm nameForm={nf}/>
              </EditDataButton>
              {j > 0 && <DeleteDataButton path={`names/${i}/form/${j}`}/>}
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
                    <EditDataButton path={`names/${i}/form/${j}/part/${k}`}>
                      <NamePartForm namePart={p}/>
                    </EditDataButton>
                    <DeleteDataButton path={`names/${i}/form/${j}/part/${k}`} />
                  </div>
                </Fragment>;
              })}
              <div>
                <AddDataButton dataType={strings.gedcomX.person.names} path={`names/${i}/form/${j}/part`}>
                  <NamePartForm/>
                </AddDataButton>
              </div>
            </div>
          </details>)}
        <AddDataButton dataType={strings.gedcomX.person.names} path={`names/${i}/form`}>
          <NameFormForm/>
        </AddDataButton>
        {(n.type || n.date || editing) && <section className="mt-2 flex flex-row flex-wrap gap-2">
          {(n.type || editing) && <ArticleTag>
            {strings.gedcomX.person.nameTypes[n.type?.substring(baseUri.length)] ?? "- "}
            <EditDataButton path={`names/${i}/type`}>
              <SelectNameType/>
            </EditDataButton>
          </ArticleTag>}
          {n.date && <ArticleTag>{new GDate(n.date.toJSON()).toString()}</ArticleTag>}
        </section>}
        {editing && <div className="mt-4 text-right">
          <DeleteDataButton path={`names/${i}`} label/>
        </div>}
      </Article>
    })}
    <AddDataButton dataType={strings.gedcomX.person.names} path="names">
      <NameForm/>
    </AddDataButton>
  </section>
}

function SelectNameType({type}: {type?: NameTypes | string}) {
  const nameTypes = strings.gedcomX.person.nameTypes;
  const options = Object.keys(nameTypes)
    .map(t => ({
      value: baseUri + t,
      text: nameTypes[t]
    }))
  options.push({
    value: "-",
    text: "-"
  })

  return <Select name={"type"} label={strings.gedcomX.fact.type} options={options}/>
}

function NameForm() {
  return <>
    <SelectNameType/>
    <NameFormForm/>
  </>
}

function NameFormForm({nameForm}: {nameForm?: GedcomX.NameForm}) {
  return <>
    <Input type="text" label={strings.gedcomX.person.names} name="fullText"
           defaultValue={nameForm?.getFullText(true)}/>
  </>
}

function NamePartForm({namePart}: { namePart?: GedcomX.NamePart }) {
  return <>
    {/* TODO localize labels here and around (a lot of them are just "label") */}
    <Select name="type" label={"type"} options={Object.keys(strings.gedcomX.person.namePartTypes)
      .map(k => ({
        value: baseUri + k,
        text: strings.gedcomX.person.namePartTypes[k]
      }))} defaultValue={namePart?.getType()} />
    <Input type="text" name="value" label={strings.gedcomX.person.names} defaultValue={namePart?.getValue()}/>
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
  const persons = useLiveQuery(() => db.persons.toArray()
    .then(p => p
      .filter(p => p.id != person.id)
      .map(p => new Person(p))
      .map(p => ({
        display: p.fullName,
        value: "#" + p.id
      })))) ?? []

  const types = Object.keys(strings.gedcomX.relationship.types)
    .map(t => ({
      value: baseUri + t,
      text: strings.gedcomX.relationship.types[t]["general"]
    }))

  return <Details title={strings.gedcomX.relationship.relationships}>
    <RelationshipGroup type={RelationshipTypes.Couple} person1={person}/>
    <RelationshipGroup type={RelationshipTypes.ParentChild} person2={person}/>
    <RelationshipGroup type={RelationshipTypes.ParentChild} person1={person}/>
    <RelationshipGroup type={RelationshipTypes.Godparent} person1={person}/>
    <RelationshipGroup type={RelationshipTypes.Godparent} person2={person}/>
    <RelationshipGroup type={RelationshipTypes.EnslavedBy} person1={person}/>
    <RelationshipGroup type={RelationshipTypes.EnslavedBy} person2={person}/>

    <AddDataButton dataType={strings.gedcomX.relationship.relationships} path={"/relationship"}>
      <Select name="type" label={"Type"} options={types}/>
      <Search type="text" label="Person 1" name="person1.resource" values={persons}/>
      <Search type="text" label="Person 2" name="person2.resource" values={persons}/>
    </AddDataButton>
  </Details>
}

function RelationshipGroup({type, person1, person2}: {
  type: RelationshipTypes,
  person1?: Person,
  person2?: Person
}) {
  // TODO improve this, not very efficient
  const query = {
    type: type.toString()
  };
  if (person1)
    query["person1.resource"] = "#" + person1.id;
  else if (person2)
    query["person2.resource"] = "#" + person2.id;
  else
    throw "No person defined";

  const rels = useLiveQuery(async () => db.relationships.where(query).toArray()
    .then(rels => rels.map(r => new Relationship(r))));
  const others = useLiveQuery(async () => rels && Promise.all(
    rels.map(r => db.personWithId(r.getOtherPerson(person1 ?? person2)))),
    [rels]);

  if (!others?.length)
    return <></>

  const personIndex = person1 == null ? 0 : 1;
  const typeString = type.substring(baseUri.length);
  const emoji: string = emojis.relationship[typeString][personIndex];
  const title: string = strings.gedcomX.relationship.types[typeString][personIndex.toString()];
  console.assert(typeof title === "string")

  return <section className="mb-4 last:mb-0 mt-2">
    <Title emoji={emoji}>{title}</Title>
    {rels?.map((r, i) => <div key={i} className="mb-4 last:mb-0">
      <Article>
        <Link to={`/person/${others[i].id ?? ""}`}>{others[i]?.fullName ?? "???"}</Link>
        <DeleteDataButton path={
        `/relationship/${r.id}`} />
      </Article>
    </div>)}
    <AddDataButton dataType={title}
    path="/relationship">
      <RelationshipForm type={type} person1={person1} person2={person2}/>
    </AddDataButton>
  </section>
}

function RelationshipForm({type, person1, person2}: {
  type: RelationshipTypes,
  person1?: Person,
  person2?: Person
}) {
  const persons = useLiveQuery(() => db.persons.toArray()
    .then(p => p
      .filter(p => p.id != (person1?.id ?? person2?.id))
      .map(p => new Person(p))
      .map(p => ({
        display: p.fullName,
        value: "#" + p.id
      })))) ?? []
  /*
  TODO filter persons:
   - no already connected persons of the same type
   - don't allow connections that would break the app:
     partners must not be relatives and vice versa
  */

  return <>
    <input hidden readOnly name="type" value={type}/>
    {person1 && <input hidden readOnly name="person1.resource" value={"#" + person1.id} />}
    {person2 && <input hidden readOnly name="person2.resource" value={"#" + person2.id} />}
    <Search name={person1 ? "person2.resource" : "person1.resource"} label={strings.gedcomX.person.persons} values={persons}/>
  </>;
}

export default InfoPanel;
