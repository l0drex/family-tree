import "./Statistics.css";

import {Component, ReactNode} from "react";
import {baseUri} from "../backend/gedcomx-enums";
import {Pie, LineRadial} from "@visx/shape";
import {scaleLinear, scaleOrdinal, scaleLog} from "@visx/scale";
import {
  getBirthDeathMonthOverYears,
  getBirthPlace,
  getGenderPerGeneration, getLifeExpectancyOverYears, getMarriageAge, getNames,
  getOccupations,
  getReligionPerYear
} from "../backend/StatisticsProvider";
import * as d3 from "d3";
import {NaturalEarth} from "@visx/geo";
import {GridRadial, GridAngle} from "@visx/grid";
import {Group} from "@visx/group";
import {curveLinearClosed} from "d3";
import {Wordcloud} from "@visx/wordcloud";
import {AreaSeries, AreaStack, Axis, BarStack, BarSeries, Grid, GlyphSeries, Tooltip, XYChart} from "@visx/xychart";
import {ViolinPlot} from "@visx/stats";
import {AxisLeft} from "@visx/axis";
import * as React from "react";

const width = 200, height = 200;
const radius = Math.min(width, height) / 2;

function Stat(props: { title: string, legend?: ReactNode, children, width?: number }) {
  return <div id={props.title.toLowerCase().replace(" ", "-")} className={"graph"}>
    <h1>{props.title}</h1>
    <svg width={props.width ?? width} height={height}>
      {props.children}
    </svg>
    {props.legend}
  </div>
}

function GenderStats() {
  let data = getGenderPerGeneration();
  let keys = Array.from(new Set(data.map(d => Object.keys(d.gender)).flat())).map(g => g.substring(baseUri.length));

  // TODO reverse the generation order

  return <Stat title="Gender">
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
      <Axis orientation="left" label="Generation" hideAxisLine={true} hideTicks={true}/>
      <Tooltip renderTooltip={({tooltipData}) =>
        tooltipData.nearestDatum.key + ": "
        + (tooltipData.nearestDatum.datum as { generation: number, gender }).gender[baseUri + tooltipData.nearestDatum.key]}/>
    </XYChart>
  </Stat>
}

function ReligionStats() {
  let data = getReligionPerYear();
  let keysUnfiltered = Array.from(new Set(data.map(d => Object.keys(d.religion)).flat()));
  let keys = keysUnfiltered.filter(r => r !== "");

  return <Stat title={"Religion"} width={width * 2}>
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

  return <Stat title="Occupation">
    <Pie
      data={data}
      outerRadius={radius}
      top={height / 2}
      left={width / 2}
      pieValue={d => d.count}
      fill={d => colorScale(d.data.value)}
    />
  </Stat>;
}

function LocationStats() {
  let data = getBirthPlace();

  return <Stat title="Location">
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

  return <Stat title={`${props.nameType} Names`}>
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
      rotate={0}
    >
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

  return <Stat title={`${props.type} Month`}>
    <Group top={height / 2} left={width / 2}>
      <GridRadial scale={radiusScale}/>
      <GridAngle scale={angleScale} outerRadius={radius}/>
      <LineRadial
        data={data}
        angle={(_, i) => angleScale(i) ?? 0}
        radius={d => radiusScale(d) ?? 0}
        stroke={d3.schemeSet1[4]}
        curve={curveLinearClosed}
      />
    </Group>
  </Stat>
}

function LifeExpectancy() {
  let data = getLifeExpectancyOverYears();
  //console.debug(data)

  return <Stat title="Life Expectancy" width={width * 2 + 60}>
    <XYChart height={height} width={width * 2 + 60} xScale={{type: "time"}} yScale={{type: "linear"}}
             margin={{top: 5, left: 30, bottom: 25, right: 5}}>
      <Grid/>
      <GlyphSeries data={data} dataKey={"Line 1"} xAccessor={d => d.birth} yAccessor={d => d.age}/>
      <Tooltip renderTooltip={({tooltipData}) =>
        (tooltipData.nearestDatum.datum as {name}).name}/>
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

  return <Stat title={"Marriage Age"}>
    <ViolinPlot valueScale={yScale} data={data} fill={"#6ca5e5"} width={width}/>
    <AxisLeft scale={yScale} left={25}/>
  </Stat>
}

export default class Statistics extends Component
  <any
    , any> {
  render() {
    return <main id="stats">
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
  }
}
