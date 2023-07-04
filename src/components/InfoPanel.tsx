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
import {Article, Details, Sidebar, Tag} from "../App";

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

  // todo:
  // person.getEvidence()
  // person.getIdentifiers()
  // person.getAnalysis()
  // person.getAttribution()

  if (!person) {
    return <aside id={"info-panel"}></aside>
  }

  const hasMultipleNames = person.names?.length > 1;

  return (
    <Sidebar id="info-panel">
      {hasMultipleNames && <Article className="text-lg text-center">
        {person.marriedName && <h2 className="birth-name">
          {strings.formatString(strings.infoPanel.born, person.birthName)}
        </h2>}
        {person.alsoKnownAs && <h2 className="alsoKnownAs">
          {strings.formatString(strings.infoPanel.aka, person.alsoKnownAs)}
        </h2>}
        {person.nickname && <h2 className="nickname">
          {strings.formatString(strings.infoPanel.nickname, person.nickname)}
        </h2>}
      </Article>}

      {person.facts && <Article noMargin>
        <ul id="factView" className="pl-4">
          {person.getFacts()
            .filter(filterLang)
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
      </Article>}

      <Details title={strings.infoPanel.relationships}>
        {parents && parents.length > 0 && <Article emoji="👪" title={strings.infoPanel.parents}>
          <ul>
            {parents?.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}

        {children && children.length > 0 && <Article emoji="🍼" title={strings.infoPanel.children}>
          <ul>
            {children.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}

        {partner && partner.length > 0 && <Article emoji="❤️️" title={strings.infoPanel.partner}>
          <ul>
            {partner.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}

        {godparents && godparents.length > 0 && <Article emoji="⛅" title={strings.infoPanel.godparents}>
          <ul>
            {godparents.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}

        {godchildren && godchildren.length > 0 && <Article emoji="⛅" title={strings.infoPanel.godchildren}>
          <ul>
            {godchildren.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}

        {enslavedBy && enslavedBy.length > 0 && <Article emoji="⛓" title={strings.infoPanel.enslavedBy}>
          <ul>
            {enslavedBy.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}

        {slaves && slaves.length > 0 && <Article emoji="⛓" title={strings.infoPanel.slaves}>
          <ul>
            {slaves.map(p => <li key={p.id}>{p.fullName}</li>)}
          </ul>
        </Article>}
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

export default InfoPanel;
