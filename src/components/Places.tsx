import {Article, LayoutContext, Main, ReactLink, ReactNavLink, Sidebar, Tag, Title} from "../App";
import {useLoaderData} from "react-router-dom";
import {PlaceDescription} from "gedcomx-js";
import {useContext, useEffect, useState} from "react";
import {strings} from "../main";
import {db} from "../backend/db";
import {MapContainer, Marker, TileLayer} from "react-leaflet";
import {LatLngExpression} from "leaflet";
import {
  Alias,
  SubjectArticles,
  SubjectMisc, SubjectSidebar
} from "./GedcomXComponents";
import {GDate} from "../backend/gedcomx-extensions";

export function PlaceOverview() {
  const places = useLoaderData() as PlaceDescription[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="🌎">{strings.gedcomX.placeDescription.places}</Title>);
  }, [layoutContext]);

  return <Main><Article>
    <PlaceList places={places}/>
  </Article></Main>
}

function PlaceList(props: { places: PlaceDescription[] }) {
  return <ul>
    {props.places?.map(place =>
      <li key={place.id}><ReactNavLink to={`/places/${place.id}`}>
        {`🌎 ${place.names[0].getValue()}`}</ReactNavLink>
      </li>)}
  </ul>;
}

export function PlaceView() {
  const place = useLoaderData() as PlaceDescription;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="🌎">{place.names[0].getValue()}</Title>)
    layoutContext.setRightTitle(strings.gedcomX.placeDescription.places);
  }, [layoutContext, place])

  useEffect(() => {
    db.places.toArray().then(sds => sds.map(sd => new PlaceDescription(sd))).then(setOthers);
  }, [])

  const hasData = place.names?.length > 1 || place.jurisdiction || place.latitude || place.longitude || place.temporalDescription || place.spatialDescription;

  const coordinates: LatLngExpression = [place.latitude, place.longitude];

  return <>
    <Main>
      <section className="mx-auto w-fit flex flex-row gap-4">
        {place.jurisdiction && <Tag>{strings.gedcomX.placeDescription.jurisdiction}: <ReactLink to={`/places/${place.jurisdiction.resource.substring(1)}`}>{place.jurisdiction.resource}</ReactLink></Tag>}
        {place.temporalDescription && <Tag>{new GDate(place.temporalDescription.toJSON()).toString()}</Tag>}
        <SubjectMisc subject={place}/>
      </section>
      <Article>
        {!hasData && <p>{strings.errors.noData}</p>}
        {place.names && <Alias aliases={place.names}/>}
        {place.latitude && place.longitude && <MapContainer center={coordinates} zoom={13} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          <Marker position={coordinates}/>
        </MapContainer>}
      </Article>
      <SubjectArticles subject={place}/>
    </Main>
    <Sidebar>
      <PlaceList places={others}/>
      <SubjectSidebar subject={place}/>
    </Sidebar>
  </>
}
