import "./Statistics.css";

import * as React from "react";
import {ReactNode, useEffect, useState} from "react";
import {baseUri, Confidence} from "../backend/gedcomx-enums";
import {LineRadial, Pie} from "@visx/shape";
import {scaleLinear, scaleLog, scaleOrdinal} from "@visx/scale";
import {
  getBirthDeathMonthOverYears,
  getBirthPlace, getConfidence,
  getGenderPerGeneration,
  getLifeExpectancyOverYears,
  getMarriageAge,
  getNames,
  getOccupations,
  getReligionPerYear
} from "../backend/StatisticsProvider";
import * as d3 from "d3";
import {curveLinearClosed} from "d3";
import {NaturalEarth} from "@visx/geo";
import {GridPolar} from "@visx/grid";
import {Group} from "@visx/group";
import {Wordcloud} from "@visx/wordcloud";
import {AreaSeries, AreaStack, Axis, BarSeries, BarStack, GlyphSeries, Grid, Tooltip, XYChart} from "@visx/xychart";
import {ViolinPlot} from "@visx/stats";
import {AxisLeft} from "@visx/axis";
import {hasData, strings} from "../main";
import {Legend} from "@visx/visx";
import Header from "./Header";
import {useLiveQuery} from "dexie-react-hooks";
import NoData from "./NoData";
import {Loading} from "./Loading";

const width = 200, height = 200;
const radius = Math.min(width, height) / 2;

function Stat(props: { title: string, legend?: ReactNode, className?: string, children }) {
  return <article className={"graph " + props.className}>
    <h1>{props.title}</h1>
    <p>
      {props.children}
    </p>
    {props.legend}
  </article>
}

function GenderStats() {
  const data = useLiveQuery(getGenderPerGeneration);

  if (!data) return <Stat title={strings.gedcomX.gender}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>

  let keys = Array.from(new Set(data.map(d => Object.keys(d.gender)).flat())).map(g => g.substring(baseUri.length));
  let legend = <Legend.LegendOrdinal scale={scaleOrdinal({
    domain: keys.map(k => strings.gedcomX.types.gender[k]),
    range: d3.schemeSet1.map(c => c.toString())
  })} direction={"row"}/>

  return <Stat title={strings.gedcomX.gender} legend={legend}>
    <XYChart height={height} width={width}
             xScale={{type: "linear"}} yScale={{type: "band", padding: 0.2, reverse: true}}
             margin={{top: 0, left: 45, bottom: 0, right: 0}}>
      <BarStack offset="silhouette">
        {keys.map(key => <BarSeries
          data={data} dataKey={key} key={key}
          xAccessor={d => d.gender[baseUri + key]} yAccessor={d => d.generation}
          colorAccessor={() => d3.schemeSet1[keys.indexOf(key)]}
        />)}
      </BarStack>
      <Axis orientation="left" label={strings.gedcomX.types.fact.person.GenerationNumber} hideAxisLine={true} hideTicks={true}/>
    </XYChart>
  </Stat>
}

function ReligionStats() {
  let data = useLiveQuery(getReligionPerYear);
  if (!data) return <Stat title={strings.gedcomX.types.fact.person.Religion}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>

  let keysUnfiltered = Array.from(new Set(data.map(d => Object.keys(d.religion)).flat()));
  let keys = keysUnfiltered.filter(r => r !== "");

  return <Stat title={strings.gedcomX.types.fact.person.Religion} className="landscape">
    <XYChart height={height} width={width * 2}
             xScale={{type: "time"}} yScale={{type: "linear"}}
             margin={{top: 1, left: 15, right: 0, bottom: 25}}>
      <AreaStack order="ascending">
        {keys.map(key =>
          <AreaSeries
            data={data} key={key} dataKey={key}
            xAccessor={d => d.birthDecade} yAccessor={d => d.religion[key]}/>
        )}
      </AreaStack>
      <Axis orientation="bottom"/>
      <Tooltip renderTooltip={({tooltipData}) =>
        tooltipData.nearestDatum.distance < 10 ?
          tooltipData.nearestDatum.key + ": "
          + (tooltipData.nearestDatum.datum as { religion }).religion[tooltipData.nearestDatum.key] : null
      }/>
    </XYChart>
  </Stat>
}

// todo make these usable

// eslint-disable-next-line
function OccupationStats() {
  let data = useLiveQuery(getOccupations);
  let colorScale = scaleOrdinal({
    domain: data.map(d => d.value),
    range: d3.schemeSet3.map(c => c.toString())
  });

  return <Stat title={strings.gedcomX.types.fact.person.Occupation}>
    <svg width={width} height={height}>
      <Pie
        data={data}
        outerRadius={radius}
        top={height / 2}
        left={width / 2}
        pieValue={d => d.count}
        fill={d => colorScale(d.data.value)}
      />
    </svg>
  </Stat>;
}

// eslint-disable-next-line
function LocationStats() {
  let data = useLiveQuery(getBirthPlace);

  return <Stat title={strings.gedcomX.types.fact.person.Heimat}>
    <NaturalEarth
      data={data}
      center={[530, -50]}
    />
  </Stat>
}

function NameStats(props: { nameType: "First" | "Last" }) {
  let data = useLiveQuery(async () => getNames(props.nameType), [props.nameType]);
  if (!data) return <Stat title={strings.gedcomX.firstName}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>

  const colors = scaleOrdinal({
    domain: data.map(d => d.value),
    range: d3.schemeSet2.map(c => c.toString())
  });

  return <Stat title={props.nameType === "First" ? strings.gedcomX.firstName : strings.gedcomX.types.namePart.Surname}>
    <Wordcloud
      height={height}
      width={width}
      words={data.map(d => {
        return {text: d.value.toString(), value: d.count}
      })}
      fontSize={d => scaleLog({
        domain: [Math.min(...data.map(d => d.count)), Math.max(...data.map(d => d.count))],
        range: [5, 30]
      })(d.value)}
      padding={2}
      font={'Impact'}
      spiral="rectangular"
      rotate={0}>
      {cloudWords =>
        cloudWords.map(w => (
          <text
            key={w.text}
            style={{fill: colors(w.text)}}
            textAnchor={'middle'}
            transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
            fontSize={w.size}
            fontFamily={w.font}
          >
            {w.text}
          </text>
        ))
      }
    </Wordcloud>
  </Stat>
}

function BirthOverYearStats(props: { type: "Birth" | "Death" }) {
  let data = useLiveQuery(async () => getBirthDeathMonthOverYears(props.type), [props.type]);
  if (!data) return <Stat title={strings.gedcomX.gender}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>

  let angleScale = scaleLinear({
    domain: [0, 12],
    range: [0, Math.PI * 2]
  })
  let radiusScale = scaleLinear({
    domain: [0, Math.max(...data)],
    range: [0, radius]
  })

  return <Stat title={props.type === "Birth" ? strings.statistics.birth_month : strings.statistics.death_month}>
    <svg height={height} width={width}>
      <Group top={height / 2} left={width / 2}>
        <GridPolar scaleAngle={angleScale} scaleRadial={radiusScale} outerRadius={radius}/>
        <LineRadial
          data={data}
          angle={(_, i) => angleScale(i) ?? 0}
          radius={d => radiusScale(d) ?? 0}
          stroke={d3.schemeSet1[4]}
          curve={curveLinearClosed}
        />
      </Group>
    </svg>
  </Stat>
}

function LifeExpectancy() {
  let data = useLiveQuery(getLifeExpectancyOverYears);
  if (!data) return <Stat title={strings.gedcomX.gender}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>
  //console.debug(data)

  return <Stat title={strings.statistics.lifeExpectancy} className="landscape">
    <XYChart height={height} width={width * 2 + 60} xScale={{type: "time"}} yScale={{type: "linear"}}
             margin={{top: 5, left: 30, bottom: 25, right: 5}}>
      <Grid/>
      <GlyphSeries data={data} dataKey={"Line 1"} xAccessor={d => d.birth} yAccessor={d => d.age}/>
      <Tooltip renderTooltip={({tooltipData}) =>
        (tooltipData.nearestDatum.datum as { name }).name}/>
      <Axis orientation={"bottom"}/>
      <Axis orientation={"left"}/>
    </XYChart>
  </Stat>
}

function MarriageAge() {
  let data = useLiveQuery(getMarriageAge);
  if (!data) return <Stat title={strings.gedcomX.gender}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>

  let yScale = scaleLinear({
    domain: [Math.min(...data.map(d => Number(d.value))), Math.max(...data.map(d => Number(d.value)))],
    range: [height, 0]
  })

  return <Stat title={strings.statistics.marriageAge}>
    <svg height={height} width={width}>
      <ViolinPlot valueScale={yScale} data={data} fill={"#6ca5e5"} width={width}/>
      <AxisLeft scale={yScale} left={25}/>
    </svg>
  </Stat>
}

function ConfidenceStats() {
  let data = useLiveQuery(getConfidence);
  if (!data) return <Stat title={strings.gedcomX.gender}>
    <Loading text={strings.loading.statistic} value={.5}/>
  </Stat>

  let colorScale = scaleOrdinal({
    domain: [Confidence.Low, Confidence.Medium, Confidence.High],
    range: d3.schemeRdYlGn[3].map(c => c.toString())
  });

  console.debug(data);

  return <Stat title={strings.gedcomX.confidence}>
    <svg width={width} height={height}>
      <Pie
        data={data}
        outerRadius={radius}
        top={height/2}
        left={width/2}
        pieValue={d => d.count}
        fill={d => d.data.value === "null" ? "none" : colorScale(d.data.value as Confidence)}
        stroke={"var(--background)"}
        stroke-width={".2rem"}
      />
    </svg>
  </Stat>
}

export default function Statistics() {
  const [dataExists, setDataExists] = useState(false);

  useEffect(() => {
    hasData().then(value => setDataExists(value));
  });

  return <>
    <Header/>
    {dataExists ?
    <main id="stats">
      <ConfidenceStats/>
      <GenderStats/>
      <ReligionStats/>
      <NameStats nameType={"First"}/>
      <NameStats nameType={"Last"}/>
      <BirthOverYearStats type={"Birth"}/>
      <BirthOverYearStats type={"Death"}/>
      <LifeExpectancy/>
      <MarriageAge/>
    </main> : <NoData/>}
  </>
}
