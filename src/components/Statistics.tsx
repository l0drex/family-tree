import "./Statistics.css";

import * as React from "react";
import {ReactNode} from "react";
import {baseUri} from "../backend/gedcomx-enums";
import {LineRadial, Pie} from "@visx/shape";
import {scaleLinear, scaleLog, scaleOrdinal} from "@visx/scale";
import {
  getBirthDeathMonthOverYears,
  getBirthPlace,
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
import {strings} from "../main";
import {Legend} from "@visx/visx";
import {graphModel, loadData} from "../backend/ModelGraph";
import Header from "./Header";

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
  let data = getGenderPerGeneration();
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
  let data = getReligionPerYear();
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

function OccupationStats() {
  let data = getOccupations();
  let colorScale = scaleOrdinal({
    domain: data.map(d => d.value),
    range: d3.schemeSet3.map(c => c.toString())
  });

  return <Stat title={strings.gedcomX.types.fact.person.Occupation}>
    <svg width={200} height={200}>
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

function LocationStats() {
  let data = getBirthPlace();

  return <Stat title={strings.gedcomX.types.fact.person.Heimat}>
    <NaturalEarth
      data={data}
      center={[530, -50]}
    />
  </Stat>
}

function NameStats(props: { nameType: "First" | "Last" }) {
  let data = getNames(props.nameType);

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
  let data = getBirthDeathMonthOverYears(props.type);
  let angleScale = scaleLinear({
    domain: [0, 12],
    range: [0, Math.PI * 2]
  })
  let radiusScale = scaleLinear({
    domain: [0, Math.max(...data)],
    range: [0, radius]
  })

  return <Stat title={props.type === "Birth" ? strings.statistics.birth_month : strings.statistics.death_month}>
    <svg height={200} width={200}>
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
  let data = getLifeExpectancyOverYears();
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
  let data = getMarriageAge();

  let yScale = scaleLinear({
    domain: [Math.min(...data.map(d => Number(d.value))), Math.max(...data.map(d => Number(d.value)))],
    range: [height, 0]
  })

  return <Stat title={strings.statistics.marriageAge}>
    <svg height={200} width={200}>
      <ViolinPlot valueScale={yScale} data={data} fill={"#6ca5e5"} width={width}/>
      <AxisLeft scale={yScale} left={25}/>
    </svg>
  </Stat>
}

export default function Statistics() {
  if (graphModel === undefined){
    console.warn("Graph model is undefined, initializing from local storage");
    loadData(JSON.parse(localStorage.getItem("familyData")))
  }

  return <>
    <Header></Header>
    <main id="stats">
      <GenderStats/>
      <ReligionStats/>
      <OccupationStats/>
      <NameStats nameType={"First"}/>
      <NameStats nameType={"Last"}/>
      <BirthOverYearStats type={"Birth"}/>
      <BirthOverYearStats type={"Death"}/>
      <LifeExpectancy/>
      <MarriageAge/>
    </main>
  </>
}
