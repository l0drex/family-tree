import {baseUri, PersonFactTypes} from "../backend/gedcomx-enums";
import {filterLang, strings} from "../main";
import {db} from "../backend/db";
import {useLiveQuery} from "dexie-react-hooks";
import {GDate, Person} from "../backend/gedcomx-extensions";
import {useContext} from "react";
import {FocusPersonContext} from "./Persons";
import {
  SubjectArticles,
  SubjectMisc,
  SubjectSidebar
} from "./GedcomXComponents";
import {Sidebar} from "../App";
import {Article, Details, Tag, Title} from "./GeneralComponents";
import {filter} from "d3";
import {Name} from "gedcomx-js";

function InfoPanel() {
  const person = useContext(FocusPersonContext);

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

      <Facts facts={person.facts}/>

      <Details title={strings.gedcomX.relationship.relationships}>
        <RelationshipGroup relationships={parents} emoji="👪" title={strings.gedcomX.relationship.parents}/>
        <RelationshipGroup relationships={children} emoji="🍼" title={strings.gedcomX.relationship.children}/>
        <RelationshipGroup relationships={partner} emoji="❤️️" title={strings.gedcomX.relationship.partner}/>
        <RelationshipGroup relationships={godparents} emoji="⛅" title={strings.gedcomX.relationship.godparents}/>
        <RelationshipGroup relationships={godchildren} emoji="⛅" title={strings.gedcomX.relationship.godchildren}/>
        <RelationshipGroup relationships={enslavedBy} emoji="🔗" title={strings.gedcomX.relationship.enslavedBy}/>
        <RelationshipGroup relationships={slaves} emoji="🔗" title={strings.gedcomX.relationship.slaves}/>
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
    <h2 className="ml-4 text-lg">{strings.gedcomX.person.names}</h2>
    {names.map(n => {
      return <Article>
        {n.nameForms.map(nf => {
          return <div>{nf.fullText} {nf.lang && `(${nf.lang})`}</div>
        })}
        {(n.type || n.date) && <section className="mt-2 flex flex-row flex-wrap gap-2">
          {n.type && <Tag
            bgColor="bg-bg-light dark:bg-bg-dark">{strings.gedcomX.person.nameTypes[n.type.substring(baseUri.length)]}</Tag>}
          {n.date && <Tag bgColor="bg-bg-light dark:bg-bg-dark">{new GDate(n.date.toJSON()).toString()}</Tag>}
        </section>}
      </Article>
    })}
  </section>
}

function Facts({facts}) {
  if (!facts) return <></>

  return <Article noMargin>
    <ul id="factView" className="pl-4">
      {facts.filter(filterLang)
        .sort((a, b) => {
          // place birth at top, generation right below
          if (a.getType() === PersonFactTypes.Birth) {
            return -1;
          } else if (b.getType() === PersonFactTypes.Birth) {
            return 1;
          } else if (a.getType() === PersonFactTypes.GenerationNumber) {
            return -1;
          } else if (b.getType() === PersonFactTypes.GenerationNumber) {
            return 1;
          }

          if (a.getDate() && !b.getDate()) {
            return 1;
          } else if (!a.getDate() && b.getDate()) {
            return -1;
          }
          if (a.getDate() && b.getDate()) {
            let aDate = new GDate(a.date).toDateObject();
            let bDate = new GDate(b.date).toDateObject();
            if (aDate && bDate) {
              return aDate.getMilliseconds() - bDate.getMilliseconds();
            }
          }

          return 0;
        })
        .map((f, i) => <li key={i} style={{listStyleType: `"${f.emoji} "`}}>
          {f.toString()}
        </li>)}
    </ul>
  </Article>
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
