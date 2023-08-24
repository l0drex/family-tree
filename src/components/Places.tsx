import {LayoutContext, Main, Sidebar} from "../Layout";
import {
  Article,
  ExternalContent,
  Hr,
  ReactLink,
  ReactNavLink,
  Tag,
  Tags,
  Title,
  VanillaLink
} from "./GeneralComponents";
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
import {GDate} from "../gedcomx/gedcomx-js-extensions";
import emojis from '../backend/emojies.json';

export function PlaceOverview() {
  const places = useLoaderData() as PlaceDescription[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.place}>{strings.gedcomX.placeDescription.places}</Title>);
  }, [layoutContext]);

  return <Main><Article>
    <PlaceList places={places}/>
  </Article></Main>
}

function PlaceList(props: { places: PlaceDescription[] }) {
  return <ul>
    {props.places?.map(place =>
      <li key={place.id}><ReactNavLink to={`/place/${place.id}`}>
        {`${emojis.place} ${place.names[0].getValue()}`}</ReactNavLink>
      </li>)}
  </ul>;
}

export function PlaceView() {
  const place = useLoaderData() as PlaceDescription;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.place}>{place.names[0].getValue()}</Title>)
  }, [layoutContext, place])

  useEffect(() => {
    db.places.toArray().then(sds => sds.map(sd => new PlaceDescription(sd))).then(setOthers);
  }, [])

  const hasData = place.names?.length > 1 || place.jurisdiction || place.latitude || place.longitude || place.temporalDescription || place.spatialDescription;
  const hasSidebarContent = place.place || place.spatialDescription;
  const coordinates: LatLngExpression = [place.latitude, place.longitude];

  return <>
    <Main>
      <Tags>
        {place.type && <Tag>{place.type}</Tag>}
        {place.jurisdiction && <Tag>{strings.gedcomX.placeDescription.jurisdiction}: <ReactLink to={`/places/${place.jurisdiction.resource.substring(1)}`}>{place.jurisdiction.resource}</ReactLink></Tag>}
        {place.temporalDescription && <Tag>{new GDate(place.temporalDescription.toJSON()).toString()}</Tag>}
        <SubjectMisc subject={place}/>
      </Tags>
      <Article>
        {!hasData && <p>{strings.errors.noData}</p>}
        {place.names && <Alias aliases={place.names}/>}
        {place.latitude && place.longitude && <ExternalContent>
          <MapContainer center={coordinates} zoom={13} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"/>
            <Marker position={coordinates}/>
          </MapContainer>
        </ExternalContent>}
      </Article>
      <SubjectArticles subject={place}/>
    </Main>
    <Sidebar>
      <PlaceList places={others}/>
      {hasSidebarContent && <Hr/>}
      {place.place && <div>
        {strings.gedcomX.placeDescription.place}: <VanillaLink to={place.place.resource}>{place.place.resource}</VanillaLink>
      </div>}
      {place.spatialDescription && <div>
        {strings.gedcomX.placeDescription.spatialDescription}: <VanillaLink to={place.spatialDescription.resource}>{place.spatialDescription.resource}</VanillaLink>
      </div>}
      <SubjectSidebar subject={place}/>
    </Sidebar>
  </>
}
