import {PersonFactTypes} from "../backend/gedcomx-enums";
import {filterLang, strings} from "../main";
import {db} from "../backend/db";
import {useLiveQuery} from "dexie-react-hooks";
import {GDate} from "../backend/gedcomx-extensions";
import {useContext} from "react";
import {FocusPersonContext} from "./Persons";
import {
  SubjectArticles,
  SubjectMisc,
  SubjectSidebar
} from "./GedcomXComponents";
import {Sidebar} from "../App";
import {Article, Details, Tag} from "./GeneralComponents";

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
      <Names person={person}/>

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

function Names({person}) {
  const hasMultipleNames = person.names?.length > 1;
  if (!hasMultipleNames) return <></>

  return <Article className="text-lg text-center">
    {person.marriedName && <h2 className="birth-name">
      {strings.formatString(strings.gedcomX.person.born, person.birthName)}
    </h2>}
    {person.alsoKnownAs && <h2 className="alsoKnownAs">
      {strings.formatString(strings.gedcomX.person.aka, person.alsoKnownAs)}
    </h2>}
    {person.nickname && <h2 className="nickname">
      {strings.formatString(strings.gedcomX.person.nickname, person.nickname)}
    </h2>}
  </Article>
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
