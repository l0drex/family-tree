import {baseUri} from "../backend/gedcomx-enums";
import {filterLang, strings} from "../main";
import {db} from "../backend/db";
import {useLiveQuery} from "dexie-react-hooks";
import {Fact, GDate, Person} from "../backend/gedcomx-extensions";
import {
  Attribution,
  ConclusionMisc, Notes, SourceReferences,
  SubjectArticles,
  SubjectMisc,
  SubjectSidebar
} from "./GedcomXComponents";
import {Sidebar} from "../App";
import {Article, Details, PopupButton, Tag, Title} from "./GeneralComponents";
import {Name} from "gedcomx-js";
import emojis from '../backend/emojies.json';

function InfoPanel({person}: { person: Person }) {
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

  if (!person) {
    return <aside id={"info-panel"}></aside>
  }

  return (
    <Sidebar id="info-panel">
      <Names names={person.names}/>

      <Facts facts={person.getFacts()}/>

      <Details title={strings.gedcomX.relationship.relationships}>
        <RelationshipGroup relationships={parents} emoji={emojis.relationship.parent}
                           title={strings.gedcomX.relationship.parents}/>
        <RelationshipGroup relationships={children} emoji={emojis.relationship.child}
                           title={strings.gedcomX.relationship.children}/>
        <RelationshipGroup relationships={partner} emoji={emojis.relationship.partner}
                           title={strings.gedcomX.relationship.partner}/>
        <RelationshipGroup relationships={godparents} emoji={emojis.relationship.godparent}
                           title={strings.gedcomX.relationship.godparents}/>
        <RelationshipGroup relationships={godchildren} emoji={emojis.relationship.godchild}
                           title={strings.gedcomX.relationship.godchildren}/>
        <RelationshipGroup relationships={enslavedBy} emoji={emojis.relationship.enslaver}
                           title={strings.gedcomX.relationship.enslavedBy}/>
        <RelationshipGroup relationships={slaves} emoji={emojis.relationship.slaves}
                           title={strings.gedcomX.relationship.slaves}/>
      </Details>

      <SubjectArticles subject={person} noMargin/>
      <section className="mx-auto w-fit flex flex-row flex-wrap gap-4">
        {person.isPrivate && <Tag>{strings.gedcomX.person.private}</Tag>}
        <SubjectMisc subject={person}/>
      </section>

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
        {n.nameForms.map((nf, j) => {
          return <div key={j}>{nf.fullText} {nf.lang && `(${nf.lang})`}</div>
        })}
        {(n.type || n.date) && <section className="mt-2 flex flex-row flex-wrap gap-2">
          {n.type && <ArticleTag>{strings.gedcomX.person.nameTypes[n.type.substring(baseUri.length)]}</ArticleTag>}
          {n.date && <ArticleTag>{new GDate(n.date.toJSON()).toString()}</ArticleTag>}
        </section>}
      </Article>
    })}
  </section>
}

function Facts({facts}: { facts: Fact[] }) {
  if (!facts || facts.length === 0) return <></>

  return <section>
    <Title emoji={emojis.fact.default}>{strings.gedcomX.facts}</Title>
    {facts
      .filter(filterLang)
      .map((f, i) => {
        const hasMisc = f.getDate() || f.getPlace() || f.getQualifiers().length > 0
          || f.confidence || f.analysis;

        return <Article key={i}>
          <div className="flex flex-row gap-4">
            <div className="flex-grow">
              {f.emoji} {strings.gedcomX.person.factTypes[f.type.substring(baseUri.length)]
              + (f.value ? `: ${f.value}` : "")}

              {hasMisc && <section className="mt-2 flex flex-row flex-wrap gap-2">
                {f.getDate() && <ArticleTag>{f.getDate().toString()}</ArticleTag>}
                {f.getPlace() && <ArticleTag>{f.getPlace().toString()}</ArticleTag>}
                {f.getQualifiers().map((q, i) =>
                  <ArticleTag key={i}>
                    {strings.gedcomX.factQualifier[q.name.substring(baseUri.length)]}: {q.value}
                  </ArticleTag>)}
                <ConclusionMisc conclusion={f} bgColor="bg-bg-light dark:bg-bg-dark"/>
              </section>}
            </div>
            <div className="flex flex-col">
              {f.notes && <PopupButton title={emojis.note}>
                {<Notes notes={f.notes}/>}
              </PopupButton>}
              {f.attribution && <PopupButton title={emojis.attribution}>
                <Attribution attribution={f.attribution}/>
                ️</PopupButton>}
              {f.sources && <PopupButton title={emojis.source.default}>
                <SourceReferences references={f.sources}/>
              </PopupButton>}
            </div>
          </div>
        </Article>
      })}
  </section>
}

function ArticleTag({children}) {
  if (!children) return <></>

  return <Tag bgColor="bg-bg-light dark:bg-bg-dark">{children}</Tag>
}

function RelationshipGroup({relationships, emoji, title}) {
  if (!relationships || relationships.length === 0) return <></>

  return <Article emoji={emoji} title={title}>
    <ul>
      {relationships.map(p => <li key={p.id}>{p.fullName}</li>)}
    </ul>
  </Article>
}

export default InfoPanel;
