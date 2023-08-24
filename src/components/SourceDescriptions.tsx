import {SourceDescription} from "../gedcomx/gedcomx-js-extensions";
import {filterLang, strings} from "../main";
import {useLoaderData} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {Alias, Attribution, Coverage, Identifiers, Notes, SourceReferences} from "./GedcomXComponents";
import {
  Article,
  Hr,
  Media,
  ReactLink,
  ReactNavLink,
  Tag, Tags,
  Title,
  VanillaLink
} from "./GeneralComponents";
import {LayoutContext, Main, Sidebar} from "../Layout";
import {db} from "../backend/db";
import emojis from '../backend/emojies.json';

export function SourceDescriptionOverview() {
  const descriptions = useLoaderData() as SourceDescription[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.source.default}>{strings.gedcomX.sourceDescription.sourceDescriptions}</Title>);
  }, [layoutContext])

  return <Main><Article>
    <SourcesList descriptions={descriptions}/>
  </Article></Main>;
}

function SourcesList(props) {
  return <ul>
    {props.descriptions?.map(sd =>
      <li key={sd.id}>
        <ReactNavLink to={`/sourceDescription/${sd.getId()}`}>{`${sd.emoji} ${sd.title}`}</ReactNavLink>
      </li>
    )}
  </ul>
}

export function SourceDescriptionView() {
  const sourceDescription = useLoaderData() as SourceDescription;
  const hasMedia = sourceDescription.mediaType && sourceDescription.about;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    db.sourceDescriptions.toArray().then(sds => sds.map(sd => new SourceDescription(sd))).then(setOthers);
    layoutContext.setHeaderChildren(<Title emoji={sourceDescription?.emoji}>
      {sourceDescription.title ?? strings.gedcomX.sourceDescription.sourceDescription}
    </Title>)
  }, [layoutContext, sourceDescription])

  const componentOf = sourceDescription.getComponentOf();
  let media;
  if (hasMedia)
    media = <Media mimeType={sourceDescription.mediaType} url={sourceDescription.about}
                   alt={sourceDescription.getDescriptions().filter(filterLang)[0]?.getValue()}/>
  const hasMisc = componentOf || sourceDescription.rights || sourceDescription.repository || sourceDescription.analysis;

  return <>
    <Main>
      {hasMisc && <Tags>
        {componentOf && <Tag>
          component of: <ReactLink to={`/sources/${componentOf.getDescription().substring(1)}`}>
          {componentOf.getDescriptionId() ?? componentOf.getDescription()}</ReactLink>
        </Tag>}
        {sourceDescription.rights && sourceDescription.getRights().map(r => <Tag key={r.getResource()}>
          rights: <VanillaLink to={r.getResource()}>{r.getResource()}</VanillaLink>
        </Tag>)}
        {sourceDescription.repository && <Tag>
          repository: <VanillaLink to={sourceDescription.getRepository().getResource()}>
          {sourceDescription.getRepository().getResource()}</VanillaLink>
        </Tag>}
        {sourceDescription.getMediator() && <Tag>
          mediator: <ReactLink to={`/${sourceDescription.getMediator().getResource()}`}>
          {sourceDescription.getMediator().getResource()}</ReactLink>
        </Tag>}
        {sourceDescription.getAnalysis() && <Tag>
          <ReactLink to={`/documents/${sourceDescription.getAnalysis().resource.substring(1)}`}>Analysis</ReactLink>
        </Tag>}
      </Tags>}
      <Article>
        <Alias aliases={sourceDescription.getTitles()}/>
        {hasMedia && <figure className="mb-4 last:mb-0">{media}</figure>}
        {sourceDescription.getDescriptions().filter(filterLang).map((d, i) =>
          <p key={i} className="mb-4 last:mb-0">{d.getValue()}</p>
        )}
        {sourceDescription.citations && <section>
          <h2 className="font-bold">Citations</h2>
          <ul className="list-disc pl-4">
            {sourceDescription.getCitations()
              .filter(filterLang)
              .map((c, i) => <li key={i}>{c.getValue()}</li>)}
          </ul>
        </section>}
      </Article>
      {sourceDescription.getCoverage().map((c, i) => <Coverage coverage={c} key={i}/>)}
      <Notes notes={sourceDescription.getNotes()}/>
      <SourceReferences references={sourceDescription.getSources()}/>
    </Main>
    <Sidebar>
      <SourcesList descriptions={others}/>
      {sourceDescription.getAttribution() && <Hr/>}
      <Attribution attribution={sourceDescription.getAttribution()}/>
      {sourceDescription.getIdentifiers() && <Hr/>}
      <Identifiers identifiers={sourceDescription.getIdentifiers()}/>

    </Sidebar>
  </>
}
