import {Article, P, ReactLink, ReactNavLink, Title} from "./GeneralComponents";
import {LayoutContext, Main, Sidebar} from "../App";
import {strings} from "../main";
import {useContext, useEffect, useState} from "react";
import {useLoaderData} from "react-router-dom";
import {SubjectArticles, SubjectMisc, SubjectSidebar} from "./GedcomXComponents";
import {Event} from "gedcomx-js";
import {db} from "../backend/db";
import {baseUri} from "../backend/gedcomx-enums";
import {EventExtended} from "../backend/gedcomx-extensions";

export function EventOverview() {
  const events = useLoaderData() as Event[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="📅">{strings.gedcomX.event.events}</Title>);
  }, [layoutContext])

  return <Main><Article>
    <EventList events={events}/>
  </Article></Main>
}

function EventList({events}) {
  return <ul>
    {events?.map(event =>
      <li key={event.id}><ReactNavLink to={`/events/${event.getId()}`}>
        {`${event.emoji} ${event.title}`}
      </ReactNavLink></li>
    )}
  </ul>
}

export function EventView() {
  const event = useLoaderData() as EventExtended;
  const layoutContext = useContext(LayoutContext);
  const [others, setOthers] = useState([]);

  useEffect(() => {
    db.events.toArray().then(sds => sds.map(sd => new EventExtended(sd))).then(setOthers);
  }, [])

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="📅">{event.title}</Title>)
  }, [event, layoutContext])

  return <>
    <Main>
      <section className="mx-auto w-fit flex flex-row gap-4">
        <SubjectMisc subject={event}/>
      </section>
      <Article>
        <P>{event.getDate()?.toString()} {event.place && strings.formatString(strings.gedcomX.place, <ReactLink to={`/places/${event.place.description.substring(1)}`}>{event.place.description}</ReactLink>)}</P>
        {event.roles && <ul>
          {event.roles.map((r, i) =>
            <li key={i}>
              <P>{r.type && <span>{strings.gedcomX.event.roles[r.type.substring(baseUri.length)]}: </span>}
                {<ReactLink to={`/persons/${r.person.resource.substring(1)}`}>{r.person.resource}</ReactLink>}
              </P>
              {r.details && <P>{r.details}</P>}
            </li>
          )}
        </ul>}
        {(!event.date || event.place || event.roles) && strings.errors.noData}
      </Article>
      <SubjectArticles subject={event}/>
    </Main>
    <Sidebar>
      <EventList events={others} />
      <SubjectSidebar subject={event}/>
    </Sidebar>
  </>
}
